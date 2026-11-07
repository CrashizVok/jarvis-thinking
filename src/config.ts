/**
 * Configuration for the jarvis-thinking plugin.
 *
 * Every number that shapes the pipeline is here. Defaults are either taken
 * from a cited experiment or marked as an engineering default in
 * docs/design.md. Nothing is hidden in the prompt text.
 */

export type BrainwritingMode = "simulated" | "multi-agent";

export interface JarvisConfig {
  /** Master switch. When false the plugin registers nothing that changes prompts. */
  enabled: boolean;
  /** Automatically attach the pipeline skill to open-ended prompts. */
  autoTrigger: boolean;
  /** Score at or above which a prompt counts as open-ended. See src/trigger.ts. */
  triggerThreshold: number;
  /** Extra regexes that force a trigger. Strings, compiled case-insensitively. */
  extraTriggerPatterns: string[];
  /** Extra regexes that suppress a trigger. */
  extraNegativePatterns: string[];

  /** Candidates requested per verbalized-sampling call. */
  candidateCount: number;
  /** How many of those candidates must sit below probabilityThreshold. */
  lowProbabilityCandidates: number;
  /** Probability ceiling for the tail candidates. */
  probabilityThreshold: number;

  /** Number of deliberately different expert viewpoints. */
  personaCount: number;
  /** Total brainwriting rounds, including the first divergent round. */
  brainwritingRounds: number;
  /** Simulated uses one model in one session. multi-agent asks for subagents. */
  brainwritingMode: BrainwritingMode;

  /** Ask for an explicit out-of-the-box instruction. */
  outOfBox: boolean;
  /** Ask for surprising and negative keywords plus a random stimulus. */
  stimuli: boolean;
  /** Ask for one opposite-assumption and one extreme-constraint branch. */
  extremeConstraints: boolean;

  /** Write the typical answer first and forbid it in later phases. */
  consensusExclusion: boolean;
  /** How many typical answers to record. */
  consensusCount: number;
  /** Cosine similarity at or above which two ideas count as duplicates. */
  dedupThreshold: number;
  /** Use the configured embedding endpoint for dedup. */
  useEmbeddings: boolean;
  /** OpenAI-compatible embeddings endpoint, for example https://api.openai.com/v1/embeddings. */
  embeddingEndpoint?: string;
  /** Embedding model name. */
  embeddingModel: string;
  /** Environment variable that holds the embedding API key. */
  embeddingApiKeyEnv: string;

  /** Ideas file, relative to the project directory. */
  ideasFile: string;
  /** How many recent ideas to show in the context digest. */
  recentIdeasInContext: number;
  /** How many winners the convergence phase returns. */
  selectionCount: number;
  /** Require a research phase before generation. */
  researchRequired: boolean;
  /** Minimum sources the research phase should collect when search works. */
  researchMinSources: number;
  /** Persist accepted ideas through the jarvis_persist tool. */
  persist: boolean;
  /** Install agents/jarvis.md into the project on first load when missing. */
  installAgent: boolean;
  /** Log trigger decisions to stderr. */
  debug: boolean;
}

export const DEFAULT_CONFIG: JarvisConfig = {
  enabled: true,
  autoTrigger: true,
  triggerThreshold: 2.5,
  extraTriggerPatterns: [],
  extraNegativePatterns: [],

  // VS uses k=5 in its creative-writing experiments and reports that a larger
  // k raises diversity while lowering quality. 5 is the tested operating point.
  candidateCount: 5,
  // The paper tunes a probability ceiling and shows diversity rises as it
  // falls. 0.10 sits inside the tested range and forces real tail exploration.
  lowProbabilityCandidates: 2,
  probabilityThreshold: 0.1,

  // The persona study samples many personas across sessions. Three is the
  // smallest set that can cover different knowledge regions in one session.
  personaCount: 3,
  // Brainwriting's winning configuration has three divergent roles and one
  // synthesis role. Three rounds reproduce the three divergent passes.
  brainwritingRounds: 3,
  // The single-LLM simulation captured about 70% of the multi-agent gain at a
  // fraction of the cost, and the multi-agent advantage was p=.057.
  brainwritingMode: "simulated",

  outOfBox: true,
  stimuli: true,
  extremeConstraints: true,

  consensusExclusion: true,
  consensusCount: 3,
  // Engineering default, calibrated in docs/results.md. No paper supplies a
  // threshold for this exact hybrid similarity.
  dedupThreshold: 0.82,
  useEmbeddings: false,
  embeddingModel: "text-embedding-3-small",
  embeddingApiKeyEnv: "JARVIS_EMBEDDING_API_KEY",

  ideasFile: ".jarvis/ideas.md",
  recentIdeasInContext: 12,
  selectionCount: 2,
  researchRequired: true,
  researchMinSources: 5,
  persist: true,
  installAgent: false,
  debug: false,
};

function num(value: unknown, fallback: number, min: number, max: number): number {
  if (value === undefined || value === null || value === "") return fallback;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function bool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return fallback;
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function patterns(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

/**
 * Merge plugin options, environment overrides, and defaults.
 *
 * Environment variables exist so a project can tune the pipeline without
 * editing opencode.json, and so the evaluation harness can reuse the same
 * defaults.
 */
export function resolveConfig(options: Record<string, unknown> = {}, env: NodeJS.ProcessEnv = process.env): JarvisConfig {
  const o = options ?? {};
  const ideasFile = str(env.JARVIS_IDEAS_FILE, str(o.ideasFile, DEFAULT_CONFIG.ideasFile));
  const embeddingEndpoint = str(
    env.JARVIS_EMBEDDING_URL,
    str(o.embeddingEndpoint, DEFAULT_CONFIG.embeddingEndpoint ?? ""),
  );

  return {
    enabled: bool(env.JARVIS_DISABLED, false) ? false : bool(o.enabled, DEFAULT_CONFIG.enabled),
    autoTrigger: bool(o.autoTrigger, DEFAULT_CONFIG.autoTrigger),
    triggerThreshold: num(o.triggerThreshold, DEFAULT_CONFIG.triggerThreshold, 0, 100),
    extraTriggerPatterns: patterns(o.extraTriggerPatterns),
    extraNegativePatterns: patterns(o.extraNegativePatterns),

    candidateCount: Math.round(num(o.candidateCount, DEFAULT_CONFIG.candidateCount, 2, 20)),
    lowProbabilityCandidates: Math.round(
      num(o.lowProbabilityCandidates, DEFAULT_CONFIG.lowProbabilityCandidates, 0, 20),
    ),
    probabilityThreshold: num(o.probabilityThreshold, DEFAULT_CONFIG.probabilityThreshold, 0.001, 1),

    personaCount: Math.round(num(o.personaCount, DEFAULT_CONFIG.personaCount, 1, 12)),
    brainwritingRounds: Math.round(num(o.brainwritingRounds, DEFAULT_CONFIG.brainwritingRounds, 1, 10)),
    brainwritingMode: o.brainwritingMode === "multi-agent" ? "multi-agent" : DEFAULT_CONFIG.brainwritingMode,

    outOfBox: bool(o.outOfBox, DEFAULT_CONFIG.outOfBox),
    stimuli: bool(o.stimuli, DEFAULT_CONFIG.stimuli),
    extremeConstraints: bool(o.extremeConstraints, DEFAULT_CONFIG.extremeConstraints),

    consensusExclusion: bool(o.consensusExclusion, DEFAULT_CONFIG.consensusExclusion),
    consensusCount: Math.round(num(o.consensusCount, DEFAULT_CONFIG.consensusCount, 1, 12)),
    dedupThreshold: num(env.JARVIS_DEDUP_THRESHOLD ?? o.dedupThreshold, DEFAULT_CONFIG.dedupThreshold, 0.5, 0.99),
    useEmbeddings: bool(env.JARVIS_EMBEDDING_URL ? true : undefined, bool(o.useEmbeddings, DEFAULT_CONFIG.useEmbeddings)),
    embeddingEndpoint: embeddingEndpoint || undefined,
    embeddingModel: str(env.JARVIS_EMBEDDING_MODEL, str(o.embeddingModel, DEFAULT_CONFIG.embeddingModel)),
    embeddingApiKeyEnv: str(o.embeddingApiKeyEnv, DEFAULT_CONFIG.embeddingApiKeyEnv),

    ideasFile,
    recentIdeasInContext: Math.round(num(o.recentIdeasInContext, DEFAULT_CONFIG.recentIdeasInContext, 0, 100)),
    selectionCount: Math.round(num(o.selectionCount, DEFAULT_CONFIG.selectionCount, 1, 5)),
    researchRequired: bool(o.researchRequired, DEFAULT_CONFIG.researchRequired),
    researchMinSources: Math.round(num(o.researchMinSources, DEFAULT_CONFIG.researchMinSources, 1, 50)),
    persist: bool(o.persist, DEFAULT_CONFIG.persist),
    installAgent: bool(o.installAgent, DEFAULT_CONFIG.installAgent),
    debug: bool(o.debug, DEFAULT_CONFIG.debug),
  };
}
