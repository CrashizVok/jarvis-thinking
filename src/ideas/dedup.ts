/**
 * Duplicate detection for candidate ideas.
 *
 * The score blends three cheap signals: IDF-weighted token cosine, character
 * 4-gram Jaccard, and the overlap of agent-supplied concept signatures. When an
 * embedding backend is configured, its cosine is blended in and the lexical
 * terms remain as a tie-breaker. The method and its limits are documented in
 * docs/design.md.
 */

import { embedTexts, type EmbeddingOptions } from "../similarity/embeddings.ts";
import {
  buildIdf,
  charNgrams,
  cosine,
  jaccard,
  normalizeText,
  tfidfVector,
  tokenize,
} from "../similarity/text.ts";

export interface IdeaCandidate {
  text: string;
  title?: string;
  signature?: string;
}

export interface DedupNeighbour {
  source: "existing" | "candidate";
  index: number;
  title?: string;
  text: string;
}

export interface DedupMatch {
  index: number;
  duplicate: boolean;
  score: number;
  lexical: number;
  character: number;
  signature: number;
  embedding?: number;
  best: DedupNeighbour | null;
  reason: string;
}

export interface DedupResult {
  threshold: number;
  method: "lexical" | "embedding+lexical";
  matches: DedupMatch[];
  kept: number[];
  dropped: number[];
}

export interface DedupOptions {
  threshold: number;
  existing?: IdeaCandidate[];
  embeddings?: EmbeddingOptions;
  signal?: AbortSignal;
}

function titleKey(title: string | undefined): string {
  return normalizeText(title ?? "");
}

export async function deduplicate(candidates: IdeaCandidate[], options: DedupOptions): Promise<DedupResult> {
  const existing = options.existing ?? [];
  const all = [...existing, ...candidates];
  const tokenDocs = all.map((item) => tokenize(`${item.title ?? ""} ${item.text} ${item.signature ?? ""}`));
  const idf = buildIdf(tokenDocs);
  const vectors = tokenDocs.map((tokens) => tfidfVector(tokens, idf));
  const chars = all.map((item) => charNgrams(`${item.title ?? ""} ${item.text}`));
  const signatures = all.map((item) => new Set(tokenize(item.signature ?? "")));

  const vectorsForEmbedding = await embedTexts(
    all.map((item) => `${item.title ?? ""}. ${item.text}`.trim()),
    options.embeddings,
    options.signal,
  );
  const method: DedupResult["method"] = vectorsForEmbedding ? "embedding+lexical" : "lexical";

  const matches: DedupMatch[] = [];
  const kept: number[] = [];
  const dropped: number[] = [];

  for (let ci = 0; ci < candidates.length; ci++) {
    const i = existing.length + ci;
    let best: DedupNeighbour | null = null;
    let bestScore = -1;
    let bestLexical = 0;
    let bestChar = 0;
    let bestSignature = 0;
    let bestEmbedding: number | undefined;

    for (let j = 0; j < existing.length; j++) {
      const score = scorePair(i, j);
      if (score.total > bestScore) {
        bestScore = score.total;
        bestLexical = score.lexical;
        bestChar = score.character;
        bestSignature = score.signature;
        bestEmbedding = score.embedding;
        best = { source: "existing", index: j, title: existing[j]?.title, text: existing[j]?.text ?? "" };
      }
    }
    for (let cj = 0; cj < ci; cj++) {
      const j = existing.length + cj;
      const score = scorePair(i, j);
      if (score.total > bestScore) {
        bestScore = score.total;
        bestLexical = score.lexical;
        bestChar = score.character;
        bestSignature = score.signature;
        bestEmbedding = score.embedding;
        best = {
          source: "candidate",
          index: cj,
          title: candidates[cj]?.title,
          text: candidates[cj]?.text ?? "",
        };
      }
    }

    const sameTitle =
      best !== null &&
      titleKey(candidates[ci]?.title) !== "" &&
      titleKey(candidates[ci]?.title) === titleKey(best.title);
    const strongSignature = bestSignature >= 0.75 && (candidates[ci]?.signature ?? "").trim() !== "";
    const duplicate = sameTitle || strongSignature || bestScore >= options.threshold;
    const reason = sameTitle
      ? "same normalized title"
      : strongSignature
        ? "concept signature overlap"
        : bestScore >= options.threshold
          ? "similarity above threshold"
          : "kept";

    matches.push({
      index: ci,
      duplicate,
      score: Number(bestScore.toFixed(4)),
      lexical: Number(bestLexical.toFixed(4)),
      character: Number(bestChar.toFixed(4)),
      signature: Number(bestSignature.toFixed(4)),
      embedding: bestEmbedding === undefined ? undefined : Number(bestEmbedding.toFixed(4)),
      best,
      reason,
    });
    if (duplicate) dropped.push(ci);
    else kept.push(ci);
  }

  function scorePair(i: number, j: number): {
    total: number;
    lexical: number;
    character: number;
    signature: number;
    embedding?: number;
  } {
    const lexical = cosine(vectors[i]!, vectors[j]!);
    const character = jaccard(chars[i]!, chars[j]!);
    const signature = jaccard(signatures[i]!, signatures[j]!);
    const base = 0.6 * lexical + 0.25 * character + 0.15 * signature;
    const embedding = vectorsForEmbedding
      ? cosineMap(
          vectorsForEmbedding[i]!,
          vectorsForEmbedding[j]!,
        )
      : undefined;
    const total = embedding === undefined ? base : 0.65 * embedding + 0.35 * base;
    return { total, lexical, character, signature, embedding };
  }

  return { threshold: options.threshold, method, matches, kept, dropped };
}

function cosineMap(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (na === 0 || nb === 0) return 0;
  return Math.max(0, Math.min(1, dot / Math.sqrt(na * nb)));
}
