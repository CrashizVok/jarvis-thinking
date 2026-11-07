/**
 * ideas.md is the persistent record of accepted ideas.
 *
 * The format is deliberately plain Markdown so a human can read and edit it
 * with no tooling. Parsing is tolerant: missing fields are fine, unknown
 * bullets are ignored, and a hand-written entry without a timestamp still
 * loads.
 */

import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

export interface IdeaEntry {
  timestamp: string;
  topic: string;
  title: string;
  summary: string;
  signature?: string;
  novelty?: number;
  usefulness?: number;
  sources?: string[];
  fingerprint?: string;
}

const HEADER = "# Ideas\n\nAccepted ideas, newest last. Written by jarvis-thinking.\n";

function oneLine(text: string): string {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function field(block: string, names: string[]): string | undefined {
  for (const name of names) {
    const match = block.match(new RegExp(`^-\\s*${name}\\s*:\\s*(.+)$`, "im"));
    if (match) return match[1]!.trim();
  }
  return undefined;
}

function numberField(block: string, names: string[]): number | undefined {
  for (const name of names) {
    const match = block.match(new RegExp(`${name}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`, "i"));
    if (match) {
      const value = Number(match[1]);
      if (Number.isFinite(value)) return value;
    }
  }
  return undefined;
}

export function parseIdeas(markdown: string): IdeaEntry[] {
  const entries: IdeaEntry[] = [];
  const blocks = String(markdown ?? "").split(/^##\s+/m).slice(1);
  for (const block of blocks) {
    const heading = block.split("\n", 1)[0] ?? "";
    const headingMatch = heading.match(/^(\S+)\s*[—–-]\s*(.+)$/);
    const timestamp = headingMatch?.[1] ?? "";
    const topic = (headingMatch?.[2] ?? heading).trim();
    const title = field(block, ["title", "idea", "name"]);
    const summary = field(block, ["summary", "description", "content"]);
    if (!title && !summary) continue;
    const sourcesRaw = field(block, ["sources", "source"]);
    const sources = sourcesRaw
      ? sourcesRaw
          .split(/[;,]\s*|\s+\|\s+/)
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined;
    entries.push({
      timestamp,
      topic,
      title: oneLine(title ?? topic),
      summary: oneLine(summary ?? title ?? ""),
      signature: field(block, ["signature", "concepts"]),
      novelty: numberField(block, ["novelty"]),
      usefulness: numberField(block, ["usefulness", "utility"]),
      sources,
      fingerprint: field(block, ["fingerprint", "hash"]),
    });
  }
  return entries;
}

export async function readIdeas(file: string): Promise<IdeaEntry[]> {
  try {
    return parseIdeas(await readFile(file, "utf8"));
  } catch {
    return [];
  }
}

function renderEntry(entry: IdeaEntry): string {
  const lines = [
    `## ${entry.timestamp} — ${oneLine(entry.topic)}`,
    `- Title: ${oneLine(entry.title)}`,
    `- Summary: ${oneLine(entry.summary)}`,
  ];
  if (entry.signature) lines.push(`- Signature: ${oneLine(entry.signature)}`);
  if (entry.novelty !== undefined || entry.usefulness !== undefined) {
    lines.push(`- Novelty: ${entry.novelty ?? "?"}/5 · Usefulness: ${entry.usefulness ?? "?"}/5`);
  }
  if (entry.sources?.length) lines.push(`- Sources: ${entry.sources.map(oneLine).join("; ")}`);
  if (entry.fingerprint) lines.push(`- Fingerprint: ${entry.fingerprint}`);
  return `${lines.join("\n")}\n`;
}

export async function appendIdeas(file: string, entries: IdeaEntry[]): Promise<number> {
  if (entries.length === 0) return 0;
  await mkdir(dirname(file), { recursive: true });
  let existing = "";
  try {
    existing = await readFile(file, "utf8");
  } catch {
    await writeFile(file, HEADER, "utf8");
  }
  if (!existing.trim()) await writeFile(file, HEADER, "utf8");
  const payload = entries.map(renderEntry).join("\n");
  await appendFile(file, `\n${payload}`, "utf8");
  return entries.length;
}

export function resolveIdeasFile(projectDirectory: string, configured: string): string {
  return resolve(projectDirectory, configured);
}

export function digest(entries: IdeaEntry[], limit: number): string {
  if (limit <= 0 || entries.length === 0) return "No stored ideas yet.";
  return entries
    .slice(-limit)
    .map((entry) => {
      const score =
        entry.novelty !== undefined || entry.usefulness !== undefined
          ? ` [novelty ${entry.novelty ?? "?"}, usefulness ${entry.usefulness ?? "?"}]`
          : "";
      return `- ${entry.timestamp || "undated"} — ${entry.title}: ${entry.summary}${score}`;
    })
    .join("\n");
}

export function ideasPathLabel(projectDirectory: string, configured: string): string {
  return join(projectDirectory, configured);
}
