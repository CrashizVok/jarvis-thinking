/**
 * LLM judge rubric.
 *
 * The novelty-judge literature says judge scores are unstable under small
 * prompt changes. Two mitigations here: two judges from different model
 * families, and a rubric with five concrete criteria instead of a single
 * "quality" number. The harness reports both judges and their correlation.
 */

import type { ParsedIdea } from "./parse.ts";
import { extractJson } from "./parse.ts";
import type { ModelClient } from "./client.ts";

export interface JudgeScore {
  index: number;
  feasibility: number;
  specificity: number;
  insight: number;
  actionability: number;
  evidence: number;
  usefulness: number;
  rationale: string;
}

export interface JudgeResult {
  judge: string;
  order: number[];
  scores: JudgeScore[];
}

const CRITERIA = ["feasibility", "specificity", "insight", "actionability", "evidence"] as const;

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function shuffle<T>(items: T[]): { items: T[]; order: number[] } {
  const order = items.map((_, index) => index);
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return { items: shuffled, order };
}

export function judgePrompt(task: string, ideas: ParsedIdea[]): string {
  const list = ideas
    .map(
      (idea, index) =>
        `${index + 1}. ${idea.title}\n${idea.text}`,
    )
    .join("\n\n");
  return `You are a strict evaluator of idea quality.

Task: ${task}

Ideas:
${list}

For each idea, score these five criteria from 1 to 5. Use integers.
- feasibility: could a small team build and test it in 90 days?
- specificity: is it a concrete design rather than a theme?
- insight: does it explain why the idea would work?
- actionability: is the next step obvious to the person who would do it?
- evidence: is the claim supported, or at least stated as a testable hypothesis?

Be strict. A 5 means excellent for that criterion, not merely acceptable.

Return ONLY JSON:
{"scores":[{"index":1,"feasibility":1,"specificity":1,"insight":1,"actionability":1,"evidence":1,"rationale":"one sentence"}]}

Score every idea exactly once, using the numbers shown above as the index.`;
}

export async function judge(
  client: ModelClient,
  task: string,
  ideas: ParsedIdea[],
  judgeModel: string,
): Promise<JudgeResult> {
  const { items, order } = shuffle(ideas);
  const response = await client.generate(judgePrompt(task, items), {
    model: judgeModel,
    temperature: 0,
    json: true,
  });
  const payload = extractJson(response.text) as { scores?: Array<Record<string, unknown>> };
  const raw = payload.scores;
  if (!Array.isArray(raw)) throw new Error("judge returned no scores");
  const scores: JudgeScore[] = raw.map((entry) => {
    const original = Number(entry.index) - 1;
    const mapped = order[Number.isFinite(original) ? original : 0] ?? 0;
    const values = CRITERIA.map((criterion) => clampScore(entry[criterion]));
    return {
      index: mapped,
      feasibility: values[0]!,
      specificity: values[1]!,
      insight: values[2]!,
      actionability: values[3]!,
      evidence: values[4]!,
      usefulness: values.reduce((sum, value) => sum + value, 0) / values.length,
      rationale: typeof entry.rationale === "string" ? entry.rationale : "",
    };
  });
  return { judge: judgeModel, order, scores };
}

export function meanUsefulness(result: JudgeResult): number {
  if (result.scores.length === 0) return 0;
  return result.scores.reduce((sum, score) => sum + score.usefulness, 0) / result.scores.length;
}
