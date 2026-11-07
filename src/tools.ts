/**
 * Deterministic tools used by the pipeline.
 *
 * The model decides what to keep. These tools handle the parts a model is bad
 * at: exact similarity, file writes, timestamps, and random stimuli.
 */

import { createHash, randomInt } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { Plugin } from "@opencode/plugin";
import type { JarvisConfig } from "./config.ts";
import { deduplicate, type IdeaCandidate } from "./ideas/dedup.ts";
import {
  appendIdeas,
  digest,
  readIdeas,
  resolveIdeasFile,
  type IdeaEntry,
} from "./ideas/store.ts";
import { embeddingCachePath, type EmbeddingOptions } from "./similarity/embeddings.ts";
import { normalizeText } from "./similarity/text.ts";

type Ctx = Plugin.Context;

export interface ToolDeps {
  config: JarvisConfig;
  projectDirectory: string;
}

const SURPRISING = [
  "inflatable",
  "edible",
  "subterranean",
  "nocturnal",
  "disposable",
  "magnetic",
  "feral",
  "analog",
  "one-handed",
  "solar",
  "reversible",
  "silent",
];

const NEGATIVE = [
  "fragile",
  "slow",
  "lonely",
  "unpaid",
  "banned",
  "outdated",
  "broken",
  "crowded",
  "painful",
  "wasteful",
  "illegal",
  "temporary",
];

const NOUNS = [
  "lighthouse",
  "compost",
  "choir",
  "passport",
  "scaffolding",
  "tide",
  "archive",
  "switchboard",
  "orchard",
  "mask",
  "library",
  "ferry",
  "kiln",
  "ledger",
  "beacon",
  "harbor",
];

const OPPOSITE_ASSUMPTIONS = [
  "more features make a product better",
  "users want more automation",
  "cheaper always wins",
  "growth requires venture capital",
  "experts should design it",
  "the interface must be an app",
  "faster is always better",
  "the user is the buyer",
  "scale is the goal",
  "data is the moat",
];

const EXTREMES = [
  "zero budget",
  "one day of work",
  "ten times the users",
  "no software",
  "offline only",
  "one country only",
  "no training for the user",
  "one hand only",
  "under one dollar per user",
  "a ten-year horizon",
];

function pick<T>(items: T[]): T {
  return items[randomInt(items.length)]!;
}

function embeddingOptions(config: JarvisConfig, projectDirectory: string): EmbeddingOptions | undefined {
  if (!config.useEmbeddings || !config.embeddingEndpoint) return undefined;
  return {
    endpoint: config.embeddingEndpoint,
    model: config.embeddingModel,
    apiKey: process.env[config.embeddingApiKeyEnv],
    cacheFile: embeddingCachePath(projectDirectory, config.ideasFile),
    debug: config.debug,
  };
}

function fingerprint(title: string, summary: string): string {
  return createHash("sha256")
    .update(`${normalizeText(title)}\u0000${normalizeText(summary)}`)
    .digest("hex")
    .slice(0, 12);
}

function text(content: string, metadata?: Record<string, unknown>) {
  return { content, metadata };
}

function parseIdeaInput(raw: unknown): IdeaCandidate[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const record = item as Record<string, unknown>;
      return {
        title: typeof record.title === "string" ? record.title : undefined,
        text: typeof record.text === "string" ? record.text : "",
        signature: typeof record.signature === "string" ? record.signature : undefined,
      };
    })
    .filter((item) => item.text.trim().length > 0);
}

export async function registerTools(ctx: Ctx, deps: ToolDeps): Promise<void> {
  const { config, projectDirectory } = deps;
  const ideasFile = resolveIdeasFile(projectDirectory, config.ideasFile);

  await ctx.tool.transform((editor) => {
    editor.namespace({ name: "jarvis", description: "Ideation pipeline support tools" });

    editor.add({
      name: "dedup",
      description:
        "Compare candidate ideas against each other and against the stored ideas file. Returns the nearest match and similarity for every candidate.",
      input: {
        type: "object",
        properties: {
          ideas: {
            type: "array",
            description: "Candidate ideas. Each needs text; title and signature improve matching.",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                text: { type: "string" },
                signature: { type: "string" },
              },
              required: ["text"],
              additionalProperties: false,
            },
          },
          threshold: { type: "number", description: "Similarity at or above which two ideas are duplicates." },
          file: { type: "string", description: "Ideas file path. Defaults to the plugin configuration." },
        },
        required: ["ideas"],
        additionalProperties: false,
      },
      execute: async (input, toolContext) => {
        const record = input as {
          ideas?: unknown;
          threshold?: number;
          file?: string;
        };
        const candidates = parseIdeaInput(record.ideas);
        if (candidates.length === 0) {
          return text("No candidate ideas were supplied.", { kept: 0, dropped: 0, matches: [] });
        }
        const target = record.file
          ? resolveIdeasFile(projectDirectory, record.file)
          : ideasFile;
        const existing = (await readIdeas(target)).map((entry) => ({
          title: entry.title,
          text: entry.summary,
          signature: entry.signature,
        }));
        const result = await deduplicate(candidates, {
          existing,
          threshold: record.threshold ?? config.dedupThreshold,
          embeddings: embeddingOptions(config, projectDirectory),
          signal: toolContext.signal,
        });

        const lines = [
          `Kept ${result.kept.length}, dropped ${result.dropped.length}. Method: ${result.method}. Threshold: ${result.threshold}. Existing ideas: ${existing.length}.`,
        ];
        if (result.dropped.length > 0) {
          lines.push("", "Dropped:");
          for (const index of result.dropped) {
            const match = result.matches.find((item) => item.index === index);
            if (!match) continue;
            const where = match.best
              ? match.best.source === "existing"
                ? `stored idea ${match.best.index + 1} ("${match.best.title ?? ""}")`
                : `candidate ${match.best.index + 1} ("${match.best.title ?? ""}")`
              : "unknown";
            lines.push(
              `- #${index + 1} "${candidates[index]?.title ?? candidates[index]?.text.slice(0, 60)}": ${match.score} vs ${where} (${match.reason})`,
            );
          }
        }
        if (result.kept.length > 0) {
          lines.push("", "Kept:");
          for (const index of result.kept) {
            lines.push(`- #${index + 1}: ${candidates[index]?.title ?? candidates[index]?.text.slice(0, 60)}`);
          }
        }
        return text(lines.join("\n"), {
          kept: result.kept.length,
          dropped: result.dropped.length,
          matches: result.matches,
          method: result.method,
        });
      },
    });

    editor.add({
      name: "persist",
      description:
        "Append accepted ideas to the ideas file. Deduplicates before writing and adds a timestamp and fingerprint.",
      input: {
        type: "object",
        properties: {
          entries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                topic: { type: "string" },
                title: { type: "string" },
                summary: { type: "string" },
                signature: { type: "string" },
                novelty: { type: "number" },
                usefulness: { type: "number" },
                sources: { type: "array", items: { type: "string" } },
                fingerprint: { type: "string" },
              },
              required: ["topic", "title", "summary"],
              additionalProperties: false,
            },
          },
          file: { type: "string" },
        },
        required: ["entries"],
        additionalProperties: false,
      },
      execute: async (input, toolContext) => {
        const record = input as {
          entries?: Array<Record<string, unknown>>;
          file?: string;
        };
        const target = record.file
          ? resolveIdeasFile(projectDirectory, record.file)
          : ideasFile;
        const rawEntries = Array.isArray(record.entries) ? record.entries : [];
        const valid = rawEntries
          .map((entry) => ({
            topic: String(entry.topic ?? "untopiced"),
            title: String(entry.title ?? "").trim(),
            summary: String(entry.summary ?? "").trim(),
            signature: typeof entry.signature === "string" ? entry.signature : undefined,
            novelty: typeof entry.novelty === "number" ? entry.novelty : undefined,
            usefulness: typeof entry.usefulness === "number" ? entry.usefulness : undefined,
            sources: Array.isArray(entry.sources)
              ? entry.sources.filter((source): source is string => typeof source === "string")
              : undefined,
            fingerprint: typeof entry.fingerprint === "string" ? entry.fingerprint : undefined,
          }))
          .filter((entry) => entry.title.length > 0 && entry.summary.length > 0);

        if (valid.length === 0) {
          return text("No valid entries. Each entry needs a title and a summary.", { written: 0 });
        }

        const existing = await readIdeas(target);
        const candidates = valid.map((entry) => ({
          title: entry.title,
          text: entry.summary,
          signature: entry.signature,
        }));
        const check = await deduplicate(candidates, {
          existing: existing.map((entry) => ({
            title: entry.title,
            text: entry.summary,
            signature: entry.signature,
          })),
          threshold: config.dedupThreshold,
          embeddings: embeddingOptions(config, projectDirectory),
          signal: toolContext.signal,
        });

        const accepted: IdeaEntry[] = [];
        for (let i = 0; i < valid.length; i++) {
          if (check.dropped.includes(i)) continue;
          const entry = valid[i]!;
          accepted.push({
            timestamp: new Date().toISOString(),
            topic: entry.topic,
            title: entry.title,
            summary: entry.summary,
            signature: entry.signature,
            novelty: entry.novelty,
            usefulness: entry.usefulness,
            sources: entry.sources,
            fingerprint: entry.fingerprint ?? fingerprint(entry.title, entry.summary),
          });
        }

        const written = await appendIdeas(target, accepted);
        if (written === 0) {
          return text(`Skipped all entries as duplicates. Nothing written to ${target}.`, {
            written: 0,
            skipped: valid.length,
            path: target,
          });
        }
        const skipped = valid.length - written;
        return text(
          `Wrote ${written} idea(s) to ${target}.${skipped > 0 ? ` Skipped ${skipped} duplicate(s).` : ""}`,
          { written, skipped, path: target },
        );
      },
    });

    editor.add({
      name: "ideas",
      description: "Read a compact digest of recent stored ideas, optionally filtered by a query.",
      input: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
          file: { type: "string" },
        },
        additionalProperties: false,
      },
      execute: async (input) => {
        const record = input as { query?: string; limit?: number; file?: string };
        const target = record.file
          ? resolveIdeasFile(projectDirectory, record.file)
          : ideasFile;
        const entries = await readIdeas(target);
        const query = normalizeText(record.query ?? "");
        const filtered = query
          ? entries.filter((entry) =>
              normalizeText(`${entry.title} ${entry.summary} ${entry.signature ?? ""}`).includes(query),
            )
          : entries;
        const limit = Math.max(1, Math.min(100, record.limit ?? config.recentIdeasInContext));
        return text(
          `${filtered.length} stored idea(s)${query ? ` matching "${record.query}"` : ""}.\n\n${digest(filtered, limit)}`,
          { count: filtered.length, path: target },
        );
      },
    });

    editor.add({
      name: "stimulus",
      description:
        "Return a random surprising keyword, negative keyword, noun, opposite assumption, and extreme constraint for the stimulus phase.",
      input: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["all", "surprising", "negative", "noun", "opposite", "extreme"],
          },
        },
        additionalProperties: false,
      },
      execute: async (input) => {
        const record = input as { kind?: string };
        const kind = record.kind ?? "all";
        const payload =
          kind === "all"
            ? {
                surprising: pick(SURPRISING),
                negative: pick(NEGATIVE),
                noun: pick(NOUNS),
                opposite_assumption: pick(OPPOSITE_ASSUMPTIONS),
                extreme_constraint: pick(EXTREMES),
              }
            : kind === "surprising"
              ? { surprising: pick(SURPRISING) }
              : kind === "negative"
                ? { negative: pick(NEGATIVE) }
                : kind === "noun"
                  ? { noun: pick(NOUNS) }
                  : kind === "opposite"
                    ? { opposite_assumption: pick(OPPOSITE_ASSUMPTIONS) }
                    : { extreme_constraint: pick(EXTREMES) };
        return text(JSON.stringify(payload, null, 2), payload);
      },
    });

    editor.add({
      name: "status",
      description: "Report the jarvis configuration, the last trigger decision, and the ideas file count.",
      input: { type: "object", properties: {}, additionalProperties: false },
      execute: async (_input, toolContext) => {
        const last = await ctx.storage.get(`jarvis:session:${toolContext.sessionID}:last`);
        const entries = await readIdeas(ideasFile);
        const safeConfig = {
          enabled: config.enabled,
          autoTrigger: config.autoTrigger,
          triggerThreshold: config.triggerThreshold,
          candidateCount: config.candidateCount,
          lowProbabilityCandidates: config.lowProbabilityCandidates,
          probabilityThreshold: config.probabilityThreshold,
          personaCount: config.personaCount,
          brainwritingRounds: config.brainwritingRounds,
          brainwritingMode: config.brainwritingMode,
          consensusCount: config.consensusCount,
          dedupThreshold: config.dedupThreshold,
          useEmbeddings: config.useEmbeddings,
          selectionCount: config.selectionCount,
          researchRequired: config.researchRequired,
          ideasFile: config.ideasFile,
        };
        return text(JSON.stringify({ config: safeConfig, lastDecision: last ?? null, storedIdeas: entries.length }, null, 2), {
          lastDecision: last ?? null,
          storedIdeas: entries.length,
        });
      },
    });
  });
}

/** Used by the eval harness and tests. */
export async function readStoredIdeas(projectDirectory: string, ideasFile: string): Promise<IdeaEntry[]> {
  return readIdeas(resolveIdeasFile(projectDirectory, ideasFile));
}

export async function ensureDirectory(path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}

export async function readTextFile(path: string): Promise<string> {
  return readFile(path, "utf8");
}
