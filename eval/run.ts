/**
 * Evaluation harness.
 *
 * Compares plain prompting, each technique alone, and a multi-call full
 * pipeline on six fixed open-ended tasks. Reports diversity, novelty against a
 * plain-prompt consensus pool, duplicate rate, cross-run convergence, and
 * usefulness from two LLM judges.
 *
 * Run:
 *   node --experimental-strip-types eval/run.ts --reps=3
 *   node --experimental-strip-types eval/run.ts --report-only
 *
 * The harness does not run the OpenCode plugin. It reimplements the prompt
 * protocol and uses the plugin's real dedup code. This is stated in
 * docs/results.md.
 */

import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveConfig } from "../src/config.ts";
import { classifyPrompt } from "../src/trigger.ts";
import { TRIGGER_LABELS } from "./trigger-labels.ts";
import { TASKS, type EvalTask } from "./tasks.ts";
import { ModelClient, type Provider, type Usage } from "./lib/client.ts";
import { judge, meanUsefulness, type JudgeResult } from "./lib/judge.ts";
import {
  bootstrapCI,
  cohensD,
  diversity,
  duplicateRate,
  mean,
  novelty,
  pearson,
  sd,
  stratifiedPermutation,
  vendiScore,
  type Valued,
} from "./lib/metrics.ts";
import { parseIdeas, type ParsedIdea } from "./lib/parse.ts";
import { runFullPipeline } from "./lib/pipeline.ts";
import {
  brainwritingPrompt,
  consensusPrompt,
  critiquePrompt,
  divergePrompt,
  IDEAS_PER_RUN,
  keywordsPrompt,
  outOfBoxPrompt,
  personaCotPrompt,
  personasPrompt,
  plainPrompt,
  researchPrompt,
  vsPrompt,
} from "./lib/prompts.ts";

const EVAL_DIR = fileURLToPath(new URL(".", import.meta.url));
const RAW_DIR = join(EVAL_DIR, "raw");
const CACHE_DIR = join(EVAL_DIR, "cache");
const FIXTURE_DIR = join(EVAL_DIR, "fixtures", "research");
const DOCS_DIR = join(EVAL_DIR, "..", "docs");

type Condition =
  | "plain"
  | "research"
  | "diverge"
  | "vs"
  | "personas"
  | "persona_cot"
  | "brainwriting"
  | "out_of_box"
  | "keywords"
  | "consensus"
  | "critique"
  | "full";

const SINGLE_CONDITIONS: Record<Exclude<Condition, "full">, (task: EvalTask, brief: string) => string> = {
  plain: (task) => plainPrompt(task),
  research: (task, brief) => researchPrompt(task, brief),
  diverge: (task) => divergePrompt(task),
  vs: (task) => vsPrompt(task),
  personas: (task) => personasPrompt(task),
  persona_cot: (task) => personaCotPrompt(task),
  brainwriting: (task) => brainwritingPrompt(task),
  out_of_box: (task) => outOfBoxPrompt(task),
  keywords: (task) => keywordsPrompt(task),
  consensus: (task) => consensusPrompt(task),
  critique: (task) => critiquePrompt(task),
};

const ALL_CONDITIONS: Condition[] = [
  "plain",
  "research",
  "diverge",
  "vs",
  "personas",
  "persona_cot",
  "brainwriting",
  "out_of_box",
  "keywords",
  "consensus",
  "critique",
  "full",
];

interface RunRecord {
  id: string;
  task: string;
  condition: Condition;
  rep: number;
  model: string;
  timestamp: string;
  latencyMs: number;
  calls: number;
  ideas: ParsedIdea[];
  selected?: ParsedIdea[];
  generated: number;
  dropped: number;
  error?: string;
}

interface RunMetrics {
  id: string;
  task: string;
  condition: Condition;
  rep: number;
  poolSize: number;
  diversity: number;
  vendi: number;
  novelty: number;
  duplicateRate: number;
  crossRunNovelty: number;
  usefulness?: number;
  selectedNovelty?: number;
  selectedDiversity?: number;
}

interface JudgmentRecord {
  runId: string;
  judge: string;
  target: "pool" | "selected";
  result: JudgeResult;
}

function arg(name: string, fallback?: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function parseList(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pool<T, R>(items: T[], limit: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]!, index);
    }
  });
  await Promise.all(runners);
  return results;
}

async function loadOrCreateBrief(
  client: ModelClient,
  task: EvalTask,
): Promise<{ brief: string; generated: boolean }> {
  const path = join(FIXTURE_DIR, `${task.id}.json`);
  if (existsSync(path)) {
    const parsed = JSON.parse(await readFile(path, "utf8")) as { brief?: string };
    if (parsed.brief) return { brief: parsed.brief, generated: false };
  }
  const prompt = `Write a compact research brief for this task:
${task.prompt}

Include:
- 3 current approaches or schools of thought,
- 2 documented failures or limitations,
- 1 strongest criticism of the mainstream view,
- 1 analogy from an adjacent field.

Use 5 to 7 short bullets. Do not include URLs, citations, or numbers you
cannot verify. Describe the evidence type instead (for example, "a field study
of 30 teams" only if you are sure it exists; otherwise write "commonly
reported"). Keep it under 180 words.`;
  const response = await client.generate(prompt, { temperature: 0.4 });
  await mkdir(FIXTURE_DIR, { recursive: true });
  await writeFile(
    path,
    JSON.stringify(
      {
        task: task.id,
        brief: response.text.trim(),
        generatedAt: new Date().toISOString(),
        model: client.config.model,
        verified: false,
      },
      null,
      2,
    ),
    "utf8",
  );
  return { brief: response.text.trim(), generated: true };
}

async function executeRun(
  client: ModelClient,
  task: EvalTask,
  condition: Condition,
  rep: number,
  brief: string,
  threshold: number,
): Promise<RunRecord> {
  const started = Date.now();
  const base = {
    id: `${task.id}__${condition}__${rep}`,
    task: task.id,
    condition,
    rep,
    model: client.config.model,
    timestamp: new Date().toISOString(),
  };
  try {
    if (condition === "full") {
      const result = await runFullPipeline(client, task, brief, threshold);
      return {
        ...base,
        latencyMs: Date.now() - started,
        calls: result.calls,
        ideas: result.pool,
        selected: result.selected,
        generated: result.generated,
        dropped: result.dropped,
      };
    }
    const prompt = SINGLE_CONDITIONS[condition](task, brief);
    const response = await client.generate(prompt);
    const ideas = parseIdeas(response.text, IDEAS_PER_RUN);
    return {
      ...base,
      latencyMs: Date.now() - started,
      calls: 1,
      ideas,
      generated: ideas.length,
      dropped: 0,
    };
  } catch (error) {
    return {
      ...base,
      latencyMs: Date.now() - started,
      calls: 0,
      ideas: [],
      generated: 0,
      dropped: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function vectorsFor(
  records: RunRecord[],
  vectors: number[][],
  key: "ideas" | "selected",
): Map<string, number[][]> {
  const map = new Map<string, number[][]>();
  let cursor = 0;
  for (const record of records) {
    const ideas = key === "ideas" ? record.ideas : (record.selected ?? []);
    map.set(record.id, vectors.slice(cursor, cursor + ideas.length));
    cursor += ideas.length;
  }
  return map;
}

async function computeMetrics(
  records: RunRecord[],
  vectorsByRun: Map<string, number[][]>,
  selectedVectorsByRun: Map<string, number[][]>,
  threshold: number,
): Promise<RunMetrics[]> {
  const successful = records.filter((record) => !record.error && record.ideas.length > 0);
  const plainByRun = new Map<string, number[][]>();
  const plainByTask = new Map<string, number[][]>();
  for (const record of successful.filter((item) => item.condition === "plain")) {
    const vectors = vectorsByRun.get(record.id) ?? [];
    plainByRun.set(record.id, vectors);
    const existing = plainByTask.get(record.task) ?? [];
    existing.push(...vectors);
    plainByTask.set(record.task, existing);
  }

  const metrics: RunMetrics[] = [];
  for (const record of successful) {
    const vectors = vectorsByRun.get(record.id) ?? [];
    if (vectors.length === 0) continue;
    const consensus = plainByTask.get(record.task) ?? [];
    const reference =
      record.condition === "plain"
        ? [...plainByRun.entries()]
            .filter(([id]) => id !== record.id)
            .filter(([id]) => successful.find((item) => item.id === id)?.task === record.task)
            .flatMap(([, value]) => value)
        : consensus;
    const noveltyValues = vectors.map((vector) => novelty(vector, reference));
    const dup = await duplicateRate(
      record.ideas.map((idea) => ({ title: idea.title, text: idea.text, signature: idea.signature })),
      threshold,
    );
    const peers = successful.filter(
      (item) => item.task === record.task && item.condition === record.condition && item.id !== record.id,
    );
    const peerVectors = peers.flatMap((item) => vectorsByRun.get(item.id) ?? []);
    const crossRunValues = vectors.map((vector) => novelty(vector, peerVectors));
    metrics.push({
      id: record.id,
      task: record.task,
      condition: record.condition,
      rep: record.rep,
      poolSize: record.ideas.length,
      diversity: diversity(vectors),
      vendi: vendiScore(vectors),
      novelty: mean(noveltyValues),
      duplicateRate: dup.rate,
      crossRunNovelty: peerVectors.length ? mean(crossRunValues) : 0,
    });
  }

  // Selected winners get their own novelty pass; diversity of two items is
  // reported but not compared with the six-idea pool.
  for (const record of successful.filter((item) => item.condition === "full")) {
    const selected = selectedVectorsByRun.get(record.id) ?? [];
    const metric = metrics.find((item) => item.id === record.id);
    if (!metric || selected.length === 0) continue;
    const consensus = plainByTask.get(record.task) ?? [];
    metric.selectedNovelty = mean(selected.map((vector) => novelty(vector, consensus)));
    metric.selectedDiversity = diversity(selected);
  }

  return metrics;
}

function aggregate(values: number[]): { n: number; mean: number; sd: number; ci: [number, number] } {
  return {
    n: values.length,
    mean: mean(values),
    sd: sd(values),
    ci: bootstrapCI(values, 4000),
  };
}

function valuesFor(metrics: RunMetrics[], condition: Condition, key: keyof RunMetrics): Valued[] {
  return metrics
    .filter((item) => item.condition === condition && typeof item[key] === "number")
    .map((item) => ({ task: item.task, value: item[key] as number }));
}

function compare(metrics: RunMetrics[], condition: Condition, key: keyof RunMetrics): {
  condition: string;
  metric: string;
  n: number;
  mean: number;
  deltaVsPlain: number;
  ci: [number, number];
  p: number;
  d: number;
} {
  const a = valuesFor(metrics, condition, key);
  const b = valuesFor(metrics, "plain", key);
  return {
    condition,
    metric: String(key),
    n: a.length,
    mean: mean(a.map((item) => item.value)),
    deltaVsPlain: mean(a.map((item) => item.value)) - mean(b.map((item) => item.value)),
    ci: bootstrapCI(a.map((item) => item.value), 4000),
    p: stratifiedPermutation(a, b, 4000),
    d: cohensD(a.map((item) => item.value), b.map((item) => item.value)),
  };
}

async function judgeRuns(
  client: ModelClient,
  records: RunRecord[],
  tasks: EvalTask[],
  judgeModels: string[],
  judgeReps: number,
  skipKeys: Set<string> = new Set(),
): Promise<JudgmentRecord[]> {
  const judgments: JudgmentRecord[] = [];
  const selected = records.filter(
    (record) => !record.error && record.ideas.length > 0 && record.rep < judgeReps,
  );
  const taskMap = new Map(tasks.map((task) => [task.id, task.prompt]));
  const specs: Array<{ record: RunRecord; model: string; target: "pool" | "selected" }> = selected.flatMap((record) =>
    judgeModels.map((model) => ({ record, model, target: "pool" as const })),
  );
  for (const record of selected.filter((item) => item.condition === "full" && (item.selected?.length ?? 0) > 0)) {
    for (const model of judgeModels) specs.push({ record, model, target: "selected" });
  }

  await pool(
    specs.filter((spec) => !skipKeys.has(`${spec.record.id}:${spec.model}:${spec.target}`)),
    Math.max(1, client.config.concurrency),
    async (spec) => {
      const ideas = spec.target === "pool" ? spec.record.ideas : (spec.record.selected ?? []);
      const prompt = taskMap.get(spec.record.task) ?? spec.record.task;
      const result = await judge(client, prompt, ideas, spec.model);
      judgments.push({
        runId: spec.target === "pool" ? spec.record.id : `${spec.record.id}:selected`,
        judge: spec.model,
        target: spec.target,
        result,
      });
    },
  );
  return judgments;
}

function attachUsefulness(metrics: RunMetrics[], judgments: JudgmentRecord[]): void {
  const byRun = new Map<string, JudgeResult[]>();
  for (const judgment of judgments.filter((item) => item.target === "pool")) {
    const list = byRun.get(judgment.runId) ?? [];
    list.push(judgment.result);
    byRun.set(judgment.runId, list);
  }
  for (const metric of metrics) {
    const results = byRun.get(metric.id);
    if (!results || results.length === 0) continue;
    metric.usefulness = mean(results.map((result) => meanUsefulness(result)));
  }
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function table(headers: string[], rows: Array<Array<string | number>>): string {
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map((cell) => String(cell)).join(" | ")} |`).join("\n");
  return `${head}\n${sep}\n${body}`;
}

function fmt(value: number, digits = 3): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

function triggerEvaluation(): {
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
} {
  const config = resolveConfig({}, {});
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  for (const label of TRIGGER_LABELS) {
    const decision = classifyPrompt(label.text, config);
    if (decision.trigger && label.expected) tp++;
    else if (decision.trigger && !label.expected) fp++;
    else if (!decision.trigger && !label.expected) tn++;
    else fn++;
  }
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const accuracy = (tp + tn) / TRIGGER_LABELS.length;
  return { precision, recall, f1, accuracy, tp, fp, tn, fn };
}

async function writeReport(
  results: {
    generatedAt: string;
    model: string;
    judges: string[];
    tasks: number;
    reps: number;
    conditionRows: Array<{
      condition: Condition;
      poolSize: number;
      diversity: ReturnType<typeof aggregate>;
      novelty: ReturnType<typeof aggregate>;
      duplicateRate: ReturnType<typeof aggregate>;
      crossRunNovelty: ReturnType<typeof aggregate>;
      usefulness: ReturnType<typeof aggregate> | null;
      vendi: ReturnType<typeof aggregate>;
    }>;
    comparisons: ReturnType<typeof compare>[];
    fullSelected: { n: number; novelty: number; usefulness: number | null };
    trigger: ReturnType<typeof triggerEvaluation>;
    usage: Usage;
    errors: number;
  },
): Promise<void> {
  const lines: string[] = [];
  lines.push("# Results");
  lines.push("");
  lines.push(`Generated ${results.generatedAt}. Model: \`${results.model}\`. Judges: ${results.judges.map((judge) => `\`${judge}\``).join(", ")}.`);
  lines.push("");
  lines.push(`${results.tasks} tasks, ${results.reps} repetitions per condition. The full pipeline runs five model calls per repetition. Usefulness is judged on a subsample of repetitions.`);
  lines.push("");
  lines.push("## Headline");
  lines.push("");
  lines.push(
    table(
      ["Condition", "Pool size", "Diversity", "Vendi", "Novelty vs plain", "Duplicate rate", "Cross-run novelty", "Usefulness"],
      results.conditionRows.map((row) => [
        row.condition,
        fmt(row.poolSize, 1),
        `${fmt(row.diversity.mean)} ± ${fmt(row.diversity.sd)}`,
        `${fmt(row.vendi.mean)} ± ${fmt(row.vendi.sd)}`,
        `${fmt(row.novelty.mean)} ± ${fmt(row.novelty.sd)}`,
        `${fmt(row.duplicateRate.mean)} ± ${fmt(row.duplicateRate.sd)}`,
        `${fmt(row.crossRunNovelty.mean)} ± ${fmt(row.crossRunNovelty.sd)}`,
        row.usefulness ? `${fmt(row.usefulness.mean)} (n=${row.usefulness.n})` : "not judged",
      ]),
    ),
  );
  lines.push("");
  lines.push("Higher is better for diversity, novelty, cross-run novelty, and usefulness. Lower is better for duplicate rate. Pool size is the number of ideas the condition returned before selection; the full pipeline returns a pool and then two selected winners.");
  lines.push("");
  lines.push("## Difference from plain prompting");
  lines.push("");
  lines.push(
    table(
      ["Condition", "Metric", "n", "Mean", "Δ vs plain", "95% CI of mean", "p (stratified permutation)", "Cohen's d"],
      results.comparisons.map((row) => [
        row.condition,
        row.metric,
        row.n,
        fmt(row.mean),
        fmt(row.deltaVsPlain),
        `[${fmt(row.ci[0])}, ${fmt(row.ci[1])}]`,
        fmt(row.p, 4),
        fmt(row.d),
      ]),
    ),
  );
  lines.push("");
  lines.push("The p-value is a two-sided stratified permutation test over runs, with label shuffles inside each task. It tests whether the condition differs from plain prompting on the same task mix. It is not a correction for multiple comparisons; treat the whole table as exploratory.");
  lines.push("");
  lines.push("## Full pipeline selection");
  lines.push("");
  lines.push(
    `The full pipeline returned two selected winners per run. Selected novelty is the mean distance from the plain-prompt consensus pool. ${
      results.fullSelected.usefulness === null
        ? "Selected usefulness was not judged."
        : `Selected usefulness is ${fmt(results.fullSelected.usefulness)} (n=${results.fullSelected.n}).`
    }`,
  );
  lines.push("");
  lines.push("## Trigger classifier");
  lines.push("");
  lines.push(
    table(
      ["Precision", "Recall", "F1", "Accuracy", "TP", "FP", "TN", "FN"],
      [[
        fmt(results.trigger.precision),
        fmt(results.trigger.recall),
        fmt(results.trigger.f1),
        fmt(results.trigger.accuracy),
        results.trigger.tp,
        results.trigger.fp,
        results.trigger.tn,
        results.trigger.fn,
      ]],
    ),
  );
  lines.push("");
  lines.push(`The labels are the author's judgments on ${TRIGGER_LABELS.length} prompts, not a human-annotated benchmark. The table is a sanity check, not a validated measure.`);
  lines.push("");
  lines.push("## What this does not show");
  lines.push("");
  lines.push("- The harness reimplements the pipeline as prompts. It does not run the OpenCode plugin, its skills, or its tools. The integration is tested separately.");
  lines.push("- The research briefs are model-generated and not fact-checked. The research condition tests the effect of a research-shaped context, not the quality of retrieval.");
  lines.push("- Usefulness is LLM-judged on a subsample. There is no human evaluation in these numbers.");
  lines.push("- The tasks are six English prompts in five domains. They are not a benchmark.");
  lines.push("- The p-values are exploratory and uncorrected.");
  lines.push("");
  lines.push("## Raw data");
  lines.push("");
  lines.push("`eval/raw/generations.jsonl`, `eval/raw/judgments.jsonl`, `eval/raw/metrics.json`, `eval/raw/summary.csv`, `eval/raw/metrics-by-task.csv`, `eval/raw/spot-check.csv`.");
  lines.push("");
  lines.push(`Model calls: ${results.usage.calls} live, ${results.usage.cached} cached, ${results.usage.failures} failed.`);
  lines.push("");
  lines.push("## Reproduction");
  lines.push("");
  lines.push("```sh");
  lines.push("JARVIS_EVAL_MODEL=gemini-3.5-flash node --experimental-strip-types eval/run.ts --reps=3");
  lines.push("```");
  lines.push("");
  await mkdir(DOCS_DIR, { recursive: true });
  await writeFile(join(DOCS_DIR, "results.md"), `${lines.join("\n")}\n`, "utf8");
}

async function main(): Promise<void> {
  const reportOnly = flag("report-only");
  const analyzeOnly = flag("analyze-only") || reportOnly;
  const skipJudge = flag("skip-judge") || reportOnly;
  const noCache = flag("no-cache");
  const reps = Number(arg("reps", "3"));
  const judgeReps = Number(arg("judge-reps", "1"));
  const taskIds = parseList(arg("tasks"), TASKS.map((task) => task.id));
  const conditions = parseList(arg("conditions"), ALL_CONDITIONS) as Condition[];
  const model = arg("model", process.env.JARVIS_EVAL_MODEL ?? "deepseek-v4.1-flash")!;
  const judgeModels = parseList(
    arg("judges"),
    (process.env.JARVIS_EVAL_JUDGES ?? "gemini-4-argon,gpt-6-luna").split(","),
  );
  const tasks = TASKS.filter((task) => taskIds.includes(task.id));
  if (tasks.length === 0) throw new Error("no matching tasks");

  const provider = (process.env.JARVIS_EVAL_PROVIDER as "google" | "openai") ?? "openai";
  const client = new ModelClient({
    provider,
    model,
    embeddingModel: process.env.JARVIS_EVAL_EMBEDDING_MODEL ?? "gemini-embedding-001",
    baseURL: process.env.JARVIS_EVAL_BASE_URL ?? "https://opencode.ai/inference/go/openai/v1",
    apiKey: process.env.JARVIS_EVAL_API_KEY,
    cacheDir: CACHE_DIR,
    concurrency: Number(arg("concurrency", process.env.JARVIS_EVAL_CONCURRENCY ?? "2")),
    noCache,
    temperature: 0.8,
    maxOutputTokens: Number(arg("max-tokens", "8192")),
  });
  const embeddingProvider =
    (process.env.JARVIS_EVAL_EMBEDDING_PROVIDER as Provider | undefined) ?? "local";
  const embeddingModel =
    process.env.JARVIS_EVAL_EMBEDDING_MODEL ??
    (embeddingProvider === "local" ? "Xenova/all-MiniLM-L6-v2" : "gemini-embedding-001");
  const embeddingClient = new ModelClient({
    provider: embeddingProvider,
    model: embeddingModel,
    embeddingModel,
    baseURL:
      process.env.JARVIS_EVAL_EMBEDDING_BASE_URL ??
      (embeddingProvider === "google"
        ? "https://generativelanguage.googleapis.com/v1beta"
        : undefined),
    apiKey: process.env.JARVIS_EVAL_EMBEDDING_API_KEY || process.env.GOOGLE_API_KEY,
    cacheDir: CACHE_DIR,
    concurrency: 2,
    noCache,
    temperature: 0,
    maxOutputTokens: 32,
  });

  await mkdir(RAW_DIR, { recursive: true });
  const generationsPath = join(RAW_DIR, "generations.jsonl");
  const judgmentsPath = join(RAW_DIR, "judgments.jsonl");
  const resume = flag("resume") || analyzeOnly;
  if (!analyzeOnly && !resume) {
    await writeFile(generationsPath, "", "utf8");
    await writeFile(judgmentsPath, "", "utf8");
  }

  let records: RunRecord[] = [];
  if (analyzeOnly) {
    const raw = await readFile(generationsPath, "utf8").catch(() => "");
    records = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as RunRecord);
    if (records.length === 0) throw new Error("no raw generations to report on");
  } else {
    const briefs = new Map<string, string>();
    for (const task of tasks) {
      const loaded = await loadOrCreateBrief(client, task);
      briefs.set(task.id, loaded.brief);
    }

    const previous = resume
      ? (await readFile(generationsPath, "utf8").catch(() => ""))
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line) as RunRecord)
          .filter((record) => !record.error)
      : [];
    const done = new Set(previous.map((record) => record.id));
    const specs = tasks
      .flatMap((task) =>
        conditions.flatMap((condition) =>
          Array.from({ length: reps }, (_, rep) => ({ task, condition, rep })),
        ),
      )
      .filter((spec) => !done.has(`${spec.task.id}__${spec.condition}__${spec.rep}`));
    console.log(
      `[eval] ${specs.length} runs (${previous.length} already done), model ${model}, concurrency ${client.config.concurrency}`,
    );

    const fresh = await pool(specs, Math.max(1, client.config.concurrency), async (spec, index) => {
      const record = await executeRun(
        client,
        spec.task,
        spec.condition,
        spec.rep,
        briefs.get(spec.task.id) ?? "",
        0.82,
      );
      if (record.error) {
        console.error(`[eval] ${record.id} failed: ${record.error}`);
      } else {
        console.log(`[eval] ${index + 1}/${specs.length} ${record.id} (${record.ideas.length} ideas, ${record.calls} calls)`);
      }
      await appendFile(generationsPath, `${JSON.stringify(record)}\n`, "utf8");
      return record;
    });
    records = [...previous, ...fresh];
  }

  if (flag("generate-only")) {
    console.log(`[eval] generation only: ${records.filter((record) => !record.error).length} valid records`);
    return;
  }

  // Embedding pass. Pool ideas and selected winners are embedded separately so
  // the vector slices line up with the records.
  const poolTexts = records.flatMap((record) =>
    record.ideas.map((idea) => `${idea.title}. ${idea.text}`),
  );
  const selectedTexts = records.flatMap((record) =>
    (record.selected ?? []).map((idea) => `${idea.title}. ${idea.text}`),
  );
  const poolVectors = await embeddingClient.embed(poolTexts);
  const selectedVectors = selectedTexts.length ? await embeddingClient.embed(selectedTexts) : [];
  const vectorsByRun = vectorsFor(records, poolVectors, "ideas");
  const selectedVectorsByRun = vectorsFor(records, selectedVectors, "selected");

  const metrics = await computeMetrics(records, vectorsByRun, selectedVectorsByRun, 0.82);

  let existingJudgments: JudgmentRecord[] = [];
  if (resume) {
    existingJudgments = (await readFile(judgmentsPath, "utf8").catch(() => ""))
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as JudgmentRecord);
  }

  let judgments: JudgmentRecord[] = [];
  if (!skipJudge) {
    console.log(`[eval] judging ${Math.min(judgeReps, reps)} repetition(s) with ${judgeModels.join(", ")}`);
    const skipKeys = new Set(
      existingJudgments.map(
        (item) => `${item.runId.replace(/:selected$/, "")}:${item.judge}:${item.target}`,
      ),
    );
    const fresh = await judgeRuns(client, records, tasks, judgeModels, judgeReps, skipKeys);
    for (const judgment of fresh) {
      await appendFile(judgmentsPath, `${JSON.stringify(judgment)}\n`, "utf8");
    }
    judgments = [...existingJudgments, ...fresh];
  } else {
    const raw = await readFile(judgmentsPath, "utf8").catch(() => "");
    judgments = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as JudgmentRecord);
  }
  const uniqueJudgments = new Map<string, JudgmentRecord>();
  for (const judgment of judgments) {
    uniqueJudgments.set(`${judgment.runId}:${judgment.judge}:${judgment.target}`, judgment);
  }
  judgments = [...uniqueJudgments.values()];
  attachUsefulness(metrics, judgments);

  const conditionRows = conditions.map((condition) => {
    const subset = metrics.filter((item) => item.condition === condition);
    const usefulness = subset
      .map((item) => item.usefulness)
      .filter((value): value is number => typeof value === "number");
    return {
      condition,
      poolSize: mean(subset.map((item) => item.poolSize)),
      diversity: aggregate(subset.map((item) => item.diversity)),
      vendi: aggregate(subset.map((item) => item.vendi)),
      novelty: aggregate(subset.map((item) => item.novelty)),
      duplicateRate: aggregate(subset.map((item) => item.duplicateRate)),
      crossRunNovelty: aggregate(subset.map((item) => item.crossRunNovelty)),
      usefulness: usefulness.length ? aggregate(usefulness) : null,
    };
  });

  const comparisons = conditions
    .filter((condition) => condition !== "plain")
    .flatMap((condition) => [
      compare(metrics, condition, "diversity"),
      compare(metrics, condition, "novelty"),
      compare(metrics, condition, "duplicateRate"),
      compare(metrics, condition, "crossRunNovelty"),
      compare(metrics, condition, "usefulness"),
    ])
    .filter((row) => row.n > 0);

  const fullSelectedNovelty = metrics
    .filter((item) => item.condition === "full")
    .map((item) => (item as RunMetrics & { selectedNovelty?: number }).selectedNovelty)
    .filter((value): value is number => typeof value === "number");
  const fullSelectedJudgments = judgments.filter((item) => item.target === "selected");
  const fullSelectedUsefulness = fullSelectedJudgments.length
    ? mean(fullSelectedJudgments.map((item) => meanUsefulness(item.result)))
    : null;

  const trigger = triggerEvaluation();
  const errors = records.filter((record) => record.error).length;

  const results = {
    generatedAt: new Date().toISOString(),
    model,
    judges: judgeModels,
    tasks: tasks.length,
    reps,
    conditionRows,
    comparisons,
    fullSelected: {
      n: fullSelectedNovelty.length,
      novelty: mean(fullSelectedNovelty),
      usefulness: fullSelectedUsefulness,
    },
    trigger,
    usage: client.usage,
    errors,
  };

  await writeFile(join(RAW_DIR, "metrics.json"), JSON.stringify({ results, metrics }, null, 2), "utf8");
  await writeFile(
    join(RAW_DIR, "summary.csv"),
    [
      "condition,pool_size,diversity_mean,diversity_sd,vendi_mean,novelty_mean,novelty_sd,duplicate_rate_mean,cross_run_novelty_mean,usefulness_mean,usefulness_n",
      ...conditionRows.map((row) =>
        [
          row.condition,
          fmt(row.poolSize, 1),
          fmt(row.diversity.mean),
          fmt(row.diversity.sd),
          fmt(row.vendi.mean),
          fmt(row.novelty.mean),
          fmt(row.novelty.sd),
          fmt(row.duplicateRate.mean),
          fmt(row.crossRunNovelty.mean),
          row.usefulness ? fmt(row.usefulness.mean) : "",
          row.usefulness ? row.usefulness.n : "",
        ]
          .map(csvEscape)
          .join(","),
      ),
    ].join("\n"),
    "utf8",
  );
  await writeFile(
    join(RAW_DIR, "metrics-by-task.csv"),
    [
      "task,condition,rep,pool_size,diversity,vendi,novelty,duplicate_rate,cross_run_novelty,usefulness",
      ...metrics.map((item) =>
        [
          item.task,
          item.condition,
          item.rep,
          item.poolSize,
          fmt(item.diversity),
          fmt(item.vendi),
          fmt(item.novelty),
          fmt(item.duplicateRate),
          fmt(item.crossRunNovelty),
          item.usefulness === undefined ? "" : fmt(item.usefulness),
        ]
          .map(csvEscape)
          .join(","),
      ),
    ].join("\n"),
    "utf8",
  );

  // Spot-check sample: two runs per task, condition hidden.
  const sample: RunRecord[] = [];
  for (const task of tasks) {
    const candidates = records.filter((record) => record.task === task.id && !record.error && record.ideas.length > 0);
    if (candidates.length === 0) continue;
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j]!, candidates[i]!];
    }
    sample.push(candidates[0]!);
    const second = candidates[Math.min(1, candidates.length - 1)]!;
    if (second.id !== sample[sample.length - 1]!.id) sample.push(second);
  }
  const spotRows = ["sample_id,task,ideas,judge1_usefulness,judge2_usefulness,human_usefulness_r1,human_usefulness_r2,human_novelty_r1,human_novelty_r2,notes"];
  const map: Record<string, string> = {};
  sample.forEach((record, index) => {
    const sampleId = `S${String(index + 1).padStart(2, "0")}`;
    map[sampleId] = record.id;
    const judged = judgments.filter((item) => item.runId === record.id && item.target === "pool");
    const j1 = judged[0] ? fmt(meanUsefulness(judged[0].result)) : "";
    const j2 = judged[1] ? fmt(meanUsefulness(judged[1].result)) : "";
    const ideas = record.ideas.map((idea) => `${idea.title}: ${idea.text}`).join(" | ");
    spotRows.push([sampleId, record.task, ideas, j1, j2, "", "", "", "", ""].map(csvEscape).join(","));
  });
  await writeFile(join(RAW_DIR, "spot-check.csv"), `${spotRows.join("\n")}\n`, "utf8");
  await writeFile(join(RAW_DIR, "spot-check-map.json"), JSON.stringify(map, null, 2), "utf8");

  await writeReport(results);
  console.log(`[eval] done. ${records.length} runs, ${errors} errors. Wrote docs/results.md and eval/raw/.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
