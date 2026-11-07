/**
 * Text normalisation shared by deduplication and the evaluation harness.
 *
 * The goal is a stable content signal, not linguistics. Function words are
 * dropped, common suffixes are folded, and the remaining tokens are compared
 * as a bag plus character n-grams. That catches rephrasing that keeps the same
 * subject and mechanism, which is the failure mode this plugin cares about.
 */

const STOP_WORDS = new Set(
  `a an the of to in on at for with by from as is are was were be been being it its this that these those
   and or but if then than so not no do does did have has had i you he she we they them his her our your their
   my me us him there here what which who when where how why all any some more most other into over under about
   after before up out off again just only very can could will would should may might must also such using use
   used make makes made get gets got give gives given new ways way things thing something someone people person
   one two three first second next last across between within without through during before after above below
   than then thus hence while because since both each few many much own same other another any every`
    .split(/\s+/)
    .filter(Boolean),
);

const SUFFIXES = [
  "ational",
  "ization",
  "iveness",
  "fulness",
  "ousness",
  "ization",
  "isation",
  "ability",
  "ibility",
  "ically",
  "ations",
  "ation",
  "ments",
  "ment",
  "ness",
  "ities",
  "ity",
  "ings",
  "ing",
  "ies",
  "ied",
  "ers",
  "er",
  "est",
  "ed",
  "es",
  "s",
];

export function normalizeText(text: string): string {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stem(token: string): string {
  if (token.length <= 4) return token;
  for (const suffix of SUFFIXES) {
    if (token.length - suffix.length >= 3 && token.endsWith(suffix)) {
      return token.slice(0, -suffix.length);
    }
  }
  return token;
}

export function tokenize(text: string): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  return normalized
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
    .map(stem);
}

export function bigrams(tokens: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) out.push(`${tokens[i]}_${tokens[i + 1]}`);
  return out;
}

export function charNgrams(text: string, n = 4): Set<string> {
  const clean = normalizeText(text).replace(/ /g, "_");
  const out = new Set<string>();
  if (clean.length < n) {
    if (clean) out.add(clean);
    return out;
  }
  for (let i = 0; i <= clean.length - n; i++) out.add(clean.slice(i, i + n));
  return out;
}

export function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const item of small) if (large.has(item)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

export function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
  return tf;
}

export function buildIdf(documents: string[][]): Map<string, number> {
  const df = new Map<string, number>();
  for (const doc of documents) {
    for (const token of new Set(doc)) df.set(token, (df.get(token) ?? 0) + 1);
  }
  const n = documents.length;
  const idf = new Map<string, number>();
  for (const [token, count] of df) idf.set(token, Math.log((n + 1) / (count + 1)) + 1);
  return idf;
}

export function tfidfVector(tokens: string[], idf: Map<string, number>): Map<string, number> {
  const tf = termFrequency(tokens);
  const vector = new Map<string, number>();
  let norm = 0;
  for (const [token, count] of tf) {
    const weight = count * (idf.get(token) ?? 1);
    vector.set(token, weight);
    norm += weight * weight;
  }
  if (norm > 0) {
    const scale = 1 / Math.sqrt(norm);
    for (const [token, weight] of vector) vector.set(token, weight * scale);
  }
  return vector;
}

export function cosine(a: Map<string, number>, b: Map<string, number>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [token, weight] of small) {
    const other = large.get(token);
    if (other !== undefined) dot += weight * other;
  }
  return Math.max(0, Math.min(1, dot));
}

export function numericCosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (na === 0 || nb === 0) return 0;
  return Math.max(0, Math.min(1, dot / Math.sqrt(na * nb)));
}
