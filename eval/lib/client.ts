/**
 * Minimal model client for the evaluation harness.
 *
 * Google Generative Language is the default because it is available in this
 * environment. An OpenAI-compatible endpoint is supported for portability.
 * Every response is cached by content hash, so a re-run after a metrics change
 * costs nothing.
 */

import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export type Provider = "google" | "openai" | "local";

export interface ClientConfig {
  provider: Provider;
  model: string;
  embeddingModel: string;
  baseURL?: string;
  apiKey?: string;
  cacheDir: string;
  concurrency: number;
  noCache: boolean;
  temperature: number;
  maxOutputTokens: number;
}

export interface GenerateResult {
  text: string;
  model: string;
  cached: boolean;
  inputTokens: number;
  outputTokens: number;
}

export interface Usage {
  calls: number;
  cached: number;
  inputTokens: number;
  outputTokens: number;
  failures: number;
}

export function resolveGoogleKey(explicit?: string): string {
  const fromEnv =
    explicit ||
    process.env.JARVIS_EVAL_EMBEDDING_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.JARVIS_EVAL_API_KEY;
  if (fromEnv) return fromEnv;
  try {
    const auth = JSON.parse(
      readFileSync(join(homedir(), ".local", "share", "opencode", "auth.json"), "utf8"),
    ) as { google?: { key?: string } };
    if (auth.google?.key) return auth.google.key;
  } catch {
    // Fall through to the error.
  }
  throw new Error("No Google API key. Set JARVIS_EVAL_API_KEY or GOOGLE_API_KEY.");
}

function resolveOpenAIKey(explicit?: string): string {
  const key =
    explicit ||
    process.env.JARVIS_EVAL_API_KEY ||
    process.env.OPENAI_API_KEY;
  if (key) return key;
  try {
    const auth = JSON.parse(
      readFileSync(join(homedir(), ".local", "share", "opencode", "auth.json"), "utf8"),
    ) as { "opencode-go"?: { key?: string } };
    if (auth["opencode-go"]?.key) return auth["opencode-go"].key;
  } catch {
    // Fall through to the error.
  }
  throw new Error("No API key. Set JARVIS_EVAL_API_KEY or OPENAI_API_KEY.");
}

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Semaphore {
  private active = 0;
  private queue: Array<() => void> = [];
  private readonly limit: number;
  constructor(limit: number) {
    this.limit = limit;
  }
  async acquire(): Promise<void> {
    if (this.active < this.limit) {
      this.active++;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.active++;
  }
  release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) next();
  }
}

export class ModelClient {
  readonly usage: Usage = { calls: 0, cached: 0, inputTokens: 0, outputTokens: 0, failures: 0 };
  readonly config: ClientConfig;
  private readonly semaphore: Semaphore;
  private readonly googleKey?: string;
  private readonly openaiKey?: string;
  private readonly baseURL: string;
  private readonly sessionID: string;

  constructor(config: ClientConfig) {
    this.config = config;
    this.sessionID = `ses_eval_${randomUUID().replace(/-/g, "")}`;
    this.semaphore = new Semaphore(Math.max(1, config.concurrency));
    this.baseURL =
      config.baseURL ||
      (config.provider === "google"
        ? "https://generativelanguage.googleapis.com/v1beta"
        : "https://api.openai.com/v1");
    if (config.provider === "google") this.googleKey = resolveGoogleKey(config.apiKey);
    else if (config.provider === "openai") this.openaiKey = resolveOpenAIKey(config.apiKey);
  }

  private cachePath(key: string): string {
    return join(this.config.cacheDir, `${key}.json`);
  }

  private async readCache(key: string): Promise<GenerateResult | undefined> {
    if (this.config.noCache) return undefined;
    try {
      const raw = await readFile(this.cachePath(key), "utf8");
      const parsed = JSON.parse(raw) as GenerateResult;
      if (typeof parsed.text === "string") return { ...parsed, cached: true };
    } catch {
      // Miss.
    }
    return undefined;
  }

  private async writeCache(key: string, value: GenerateResult): Promise<void> {
    if (this.config.noCache) return;
    try {
      await mkdir(this.config.cacheDir, { recursive: true });
      await writeFile(this.cachePath(key), JSON.stringify(value), "utf8");
    } catch {
      // A cache write failure is not fatal.
    }
  }

  async generate(prompt: string, options: { temperature?: number; json?: boolean; model?: string } = {}): Promise<GenerateResult> {
    const model = options.model ?? this.config.model;
    const temperature = options.temperature ?? this.config.temperature;
    const json = options.json ?? true;
    const key = hash({ p: this.config.provider, m: model, prompt, temperature, json });
    const cached = await this.readCache(key);
    if (cached) {
      this.usage.cached++;
      return cached;
    }

    await this.semaphore.acquire();
    try {
      const result =
        this.config.provider === "google"
          ? await this.generateGoogle(model, prompt, temperature, json)
          : await this.generateOpenAI(model, prompt, temperature, json);
      this.usage.calls++;
      this.usage.inputTokens += result.inputTokens;
      this.usage.outputTokens += result.outputTokens;
      await this.writeCache(key, result);
      return result;
    } catch (error) {
      this.usage.failures++;
      throw error;
    } finally {
      this.semaphore.release();
    }
  }

  private async generateGoogle(model: string, prompt: string, temperature: number, json: boolean): Promise<GenerateResult> {
    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: this.config.maxOutputTokens,
        ...(json ? { responseMimeType: "application/json" } : {}),
      },
    };
    const url = `${this.baseURL}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.googleKey!)}`;
    const data = await this.retry(async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000),
      });
      if (!response.ok) throw new HttpError(response.status, await response.text());
      return (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      };
    });
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (!text.trim()) throw new Error("empty model response");
    return {
      text,
      model,
      cached: false,
      inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }

  private openAIHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      authorization: `Bearer ${this.openaiKey}`,
      "user-agent": "opencode/2.2.5",
    };
    if (this.baseURL.includes("opencode.ai/inference")) {
      headers["x-opencode-session"] = this.sessionID;
    }
    return headers;
  }

  private async generateOpenAI(model: string, prompt: string, temperature: number, json: boolean): Promise<GenerateResult> {
    const body = {
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: this.config.maxOutputTokens,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    };
    const data = await this.retry(async () => {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: this.openAIHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000),
      });
      if (!response.ok) throw new HttpError(response.status, await response.text());
      return (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
    });
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) throw new Error("empty model response");
    return {
      text,
      model,
      cached: false,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    };
  }

  private async retry<T>(operation: () => Promise<T>, attempts = 5): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const status = error instanceof HttpError ? error.status : 0;
        if (status !== 429 && status < 500) throw error;
        const base = status === 429 ? 5000 : 1000;
        await sleep(base * 2 ** attempt + Math.floor(Math.random() * 500));
      }
    }
    throw lastError;
  }

  /**
   * Google's free tier counts each embedded text against a per-minute quota,
   * so the batches are paced instead of fired concurrently.
   */
  private embeddingWindow: number[] = [];
  private async waitForEmbeddingQuota(count: number): Promise<void> {
    if (this.config.provider !== "google") return;
    const perMinute = 90;
    for (;;) {
      const now = Date.now();
      this.embeddingWindow = this.embeddingWindow.filter((time) => now - time < 60_000);
      if (this.embeddingWindow.length + count <= perMinute) {
        for (let index = 0; index < count; index++) this.embeddingWindow.push(now);
        return;
      }
      const oldest = this.embeddingWindow[0] ?? now;
      await sleep(Math.max(500, 60_000 - (now - oldest) + 100));
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const results: number[][] = [];
    for (let start = 0; start < texts.length; start += 32) {
      const batch = texts.slice(start, start + 32);
      results.push(...(await this.embedBatch(batch)));
    }
    return results;
  }

  private localPipeline: Promise<unknown> | null = null;

  /**
   * Local embeddings keep the harness usable when the Google free tier is
   * exhausted. The model name is part of the cache key, so 384-dim vectors
   * never mix with 3072-dim Google vectors from an earlier run.
   */
  private async embedLocal(texts: string[]): Promise<number[][]> {
    const { pipeline } = await import("@huggingface/transformers");
    if (!this.localPipeline) {
      this.localPipeline = pipeline("feature-extraction", this.config.embeddingModel);
    }
    const extractor = (await this.localPipeline) as (
      input: string[],
      options: { pooling: "mean"; normalize: true },
    ) => Promise<{ data: Float32Array; dims: number[] }>;
    const output = await extractor(texts, { pooling: "mean", normalize: true });
    const rows = output.dims[0] ?? 0;
    const dims = output.dims[1] ?? 0;
    if (dims === 0) throw new Error("local embedding model returned no vector dimensions");
    const vectors: number[][] = [];
    for (let row = 0; row < rows; row++) {
      vectors.push(Array.from(output.data.slice(row * dims, (row + 1) * dims)));
    }
    return vectors;
  }

  private async embedBatch(texts: string[]): Promise<number[][]> {
    const key = hash({ p: this.config.provider, e: this.config.embeddingModel, texts });
    if (!this.config.noCache) {
      try {
        const raw = await readFile(this.cachePath(key), "utf8");
        const parsed = JSON.parse(raw) as { vectors: number[][] };
        if (Array.isArray(parsed.vectors) && parsed.vectors.length === texts.length) {
          this.usage.cached++;
          return parsed.vectors;
        }
      } catch {
        // Miss.
      }
    }

    console.log(
      `[embed] ${this.config.provider}/${this.config.embeddingModel} ${texts.length} texts`,
    );
    await this.semaphore.acquire();
    try {
      let vectors: number[][];
      if (this.config.provider === "local") {
        vectors = await this.embedLocal(texts);
      } else if (this.config.provider === "google") {
        const body = {
          requests: texts.map((text) => ({
            model: `models/${this.config.embeddingModel}`,
            content: { parts: [{ text }] },
          })),
        };
        const data = await this.retry(async () => {
          await this.waitForEmbeddingQuota(texts.length);
          const response = await fetch(
            `${this.baseURL}/models/${encodeURIComponent(this.config.embeddingModel)}:batchEmbedContents?key=${encodeURIComponent(this.googleKey!)}`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(body),
              signal: AbortSignal.timeout(120_000),
            },
          );
          if (!response.ok) throw new HttpError(response.status, await response.text());
          return (await response.json()) as { embeddings?: Array<{ values?: number[] }> };
        }, 6);
        vectors = (data.embeddings ?? []).map((item) => item.values ?? []);
      } else {
        const data = await this.retry(async () => {
          const response = await fetch(`${this.baseURL}/embeddings`, {
            method: "POST",
            headers: this.openAIHeaders(),
            body: JSON.stringify({ model: this.config.embeddingModel, input: texts }),
            signal: AbortSignal.timeout(120_000),
          });
          if (!response.ok) throw new HttpError(response.status, await response.text());
          return (await response.json()) as { data?: Array<{ embedding?: number[] }> };
        });
        vectors = (data.data ?? []).map((item) => item.embedding ?? []);
      }
      if (vectors.length !== texts.length || vectors.some((vector) => vector.length === 0)) {
        throw new Error("embedding response did not match the input");
      }
      this.usage.calls++;
      if (!this.config.noCache) {
        await mkdir(this.config.cacheDir, { recursive: true });
        await writeFile(this.cachePath(key), JSON.stringify({ vectors }), "utf8");
      }
      return vectors;
    } finally {
      this.semaphore.release();
    }
  }
}

export class HttpError extends Error {
  readonly status: number;
  readonly body: string;
  constructor(status: number, body: string) {
    super(`HTTP ${status}: ${body.slice(0, 400)}`);
    this.status = status;
    this.body = body;
  }
}
