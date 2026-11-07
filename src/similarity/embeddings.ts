/**
 * Optional embedding backend for deduplication.
 *
 * The default similarity is lexical because it works offline and needs no key.
 * When JARVIS_EMBEDDING_URL is set, the plugin calls an OpenAI-compatible
 * /embeddings endpoint and uses cosine similarity on the vectors, which catches
 * synonymy the lexical path misses. Vectors are cached by content hash so a
 * repeated dedup pass costs one request per new idea, not per comparison.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface EmbeddingOptions {
  endpoint: string;
  model: string;
  apiKey?: string;
  cacheFile: string;
  timeoutMs?: number;
  debug?: boolean;
}

type Cache = Record<string, number[]>;

async function readCache(file: string): Promise<Cache> {
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Cache;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeCache(file: string, cache: Cache): Promise<void> {
  try {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(cache), "utf8");
  } catch {
    // A cache write failure must not fail dedup.
  }
}

function key(model: string, text: string): string {
  return createHash("sha256").update(`${model}\u0000${text}`).digest("hex");
}

async function requestBatch(options: EmbeddingOptions, texts: string[], signal: AbortSignal): Promise<number[][]> {
  const response = await fetch(options.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {}),
    },
    body: JSON.stringify({ input: texts, model: options.model }),
    signal,
  });
  if (!response.ok) throw new Error(`embedding endpoint returned ${response.status}`);
  const payload = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
  const rows = payload.data ?? [];
  if (rows.length !== texts.length || rows.some((row) => !Array.isArray(row.embedding))) {
    throw new Error("embedding endpoint returned malformed data");
  }
  return rows.map((row) => row.embedding!);
}

/**
 * Return a vector for every text, or undefined when the backend is not
 * configured or the request fails. Callers fall back to lexical similarity.
 */
export async function embedTexts(
  texts: string[],
  options: EmbeddingOptions | undefined,
  signal?: AbortSignal,
): Promise<number[][] | undefined> {
  if (!options?.endpoint || texts.length === 0) return undefined;
  const cache = await readCache(options.cacheFile);
  const result: Array<number[] | undefined> = texts.map((text) => cache[key(options.model, text)]);
  const missing = texts.map((text, i) => ({ text, i })).filter(({ i }) => !result[i]);

  if (missing.length > 0) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);
    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    try {
      for (let start = 0; start < missing.length; start += 64) {
        const batch = missing.slice(start, start + 64);
        const vectors = await requestBatch(options, batch.map((item) => item.text), controller.signal);
        for (let j = 0; j < batch.length; j++) {
          const vector = vectors[j]!;
          result[batch[j]!.i] = vector;
          cache[key(options.model, batch[j]!.text)] = vector;
        }
      }
      await writeCache(options.cacheFile, cache);
    } catch (error) {
      if (options.debug) {
        console.error(`[jarvis] embedding fallback: ${error instanceof Error ? error.message : String(error)}`);
      }
      return undefined;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onAbort);
    }
  }

  if (result.some((vector) => !vector)) return undefined;
  return result as number[][];
}

export function embeddingCachePath(projectDirectory: string, ideasFile: string): string {
  return join(projectDirectory, dirname(ideasFile), "embeddings.json");
}
