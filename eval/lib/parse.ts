/**
 * Tolerant JSON extraction for model output.
 *
 * Models wrap JSON in prose, add trailing commas, or return a list where an
 * object was requested. The parser tries hard and then gives up with a clear
 * error rather than inventing ideas.
 */

export interface ParsedIdea {
  title: string;
  text: string;
  signature: string;
  probability?: number;
  verdict?: string;
}

function findJsonBlock(text: string): string | undefined {
  const start = text.search(/[\[{]/);
  if (start === -1) return undefined;
  const open = text[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i]!;
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === open) depth++;
    else if (char === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return undefined;
}

function repairJson(raw: string): string {
  return raw
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

export function extractJson(text: string): unknown {
  const block = findJsonBlock(text);
  if (!block) throw new Error("no JSON object or array in model output");
  for (const candidate of [block, repairJson(block)]) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next form.
    }
  }
  throw new Error("could not parse JSON from model output");
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

function normalizeOne(item: unknown, index: number): ParsedIdea {
  if (typeof item === "string") {
    return { title: `Idea ${index + 1}`, text: item.trim(), signature: "" };
  }
  const record = (item ?? {}) as Record<string, unknown>;
  const title =
    asString(record.title) ||
    asString(record.name) ||
    asString(record.idea) ||
    `Idea ${index + 1}`;
  const text =
    asString(record.text) ||
    asString(record.summary) ||
    asString(record.description) ||
    asString(record.idea_content) ||
    asString(record.content) ||
    title;
  let signature = "";
  if (Array.isArray(record.signature)) signature = record.signature.map(String).join(" ");
  else if (Array.isArray(record.concepts)) signature = record.concepts.map(String).join(" ");
  else if (Array.isArray(record.tags)) signature = record.tags.map(String).join(" ");
  else signature = asString(record.signature) || asString(record.concepts);
  const probabilityRaw = record.probability ?? record.confidence;
  const probability =
    typeof probabilityRaw === "number"
      ? probabilityRaw
      : typeof probabilityRaw === "string" && probabilityRaw.trim() !== ""
        ? Number(probabilityRaw.replace("%", "")) / (probabilityRaw.includes("%") ? 100 : 1)
        : undefined;
  return {
    title,
    text,
    signature,
    probability: Number.isFinite(probability) ? probability : undefined,
    verdict: asString(record.verdict) || undefined,
  };
}

export function parseIdeas(text: string, expected: number): ParsedIdea[] {
  const payload = extractJson(text) as Record<string, unknown> | unknown[];
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as Record<string, unknown>).ideas)
      ? ((payload as Record<string, unknown>).ideas as unknown[])
      : Array.isArray((payload as Record<string, unknown>).responses)
        ? ((payload as Record<string, unknown>).responses as unknown[])
        : Array.isArray((payload as Record<string, unknown>).selected)
          ? ((payload as Record<string, unknown>).selected as unknown[])
          : undefined;
  if (!list) throw new Error("JSON has no ideas, responses, or selected array");
  const ideas = list.map(normalizeOne).filter((idea) => idea.text.length > 0);
  if (ideas.length === 0) throw new Error("no usable ideas in JSON");
  return ideas.slice(0, expected);
}

export function parsePlan(text: string): {
  consensus: string[];
  personas: Array<{ name: string; goal: string; constraint: string; blindSpot: string }>;
  stimuli: { surprising: string; negative: string; noun: string; opposite: string; extreme: string };
} {
  const payload = extractJson(text) as Record<string, unknown>;
  const consensusRaw = payload.consensus;
  const personasRaw = payload.personas;
  const stimuliRaw = (payload.stimuli ?? {}) as Record<string, unknown>;
  const consensus = Array.isArray(consensusRaw)
    ? consensusRaw.map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
    : [];
  const personas = Array.isArray(personasRaw)
    ? personasRaw.map((item, index) => {
        const record = (item ?? {}) as Record<string, unknown>;
        return {
          name: asString(record.name) || `Persona ${index + 1}`,
          goal: asString(record.goal),
          constraint: asString(record.constraint),
          blindSpot: asString(record.blind_spot) || asString(record.blindSpot),
        };
      })
    : [];
  return {
    consensus,
    personas,
    stimuli: {
      surprising: asString(stimuliRaw.surprising),
      negative: asString(stimuliRaw.negative),
      noun: asString(stimuliRaw.noun),
      opposite: asString(stimuliRaw.opposite) || asString(stimuliRaw.opposite_assumption),
      extreme: asString(stimuliRaw.extreme) || asString(stimuliRaw.extreme_constraint),
    },
  };
}
