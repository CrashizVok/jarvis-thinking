/**
 * Skill loading and parameter substitution.
 *
 * Each technique is a real SKILL.md file in the package, so the same text can
 * be inspected, diffed, and reused outside the plugin. At setup the plugin
 * fills the configuration placeholders, copies the rendered text into the
 * project's .jarvis/skills directory, and registers the project-local path.
 *
 * The local copy matters: OpenCode gives the model the skill's base directory,
 * and an agent that decides to read supporting files must not leave the
 * project just to inspect a prompt.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { JarvisConfig } from "./config.ts";

export interface LoadedSkill {
  id: string;
  name: string;
  description: string;
  content: string;
  path: string;
  autoinvoke: boolean;
}

interface Frontmatter {
  name?: string;
  description?: string;
  autoinvoke?: boolean;
}

function parseFrontmatter(raw: string): { meta: Frontmatter; body: string } {
  if (!raw.startsWith("---\n")) return { meta: {}, body: raw };
  const end = raw.indexOf("\n---", 4);
  if (end === -1) return { meta: {}, body: raw };
  const block = raw.slice(4, end);
  const body = raw.slice(end + 4).replace(/^\s*\n/, "");
  const meta: Frontmatter = {};
  for (const line of block.split("\n")) {
    const match = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (!match) continue;
    const key = match[1]!;
    const value = match[2]!.trim().replace(/^["']|["']$/g, "");
    if (key === "name") meta.name = value;
    if (key === "description") meta.description = value;
    if (key === "autoinvoke") meta.autoinvoke = value !== "false";
  }
  return { meta, body };
}

const ALWAYS_ADVERTISED = new Set([
  "jarvis-pipeline",
  "jarvis-research",
  "jarvis-verbalized-sampling",
  "jarvis-converge",
]);

export const SKILL_IDS = [
  "jarvis-pipeline",
  "jarvis-research",
  "jarvis-diverge",
  "jarvis-verbalized-sampling",
  "jarvis-personas",
  "jarvis-persona-cot",
  "jarvis-brainwriting",
  "jarvis-out-of-box",
  "jarvis-stimuli",
  "jarvis-consensus-exclusion",
  "jarvis-dedup",
  "jarvis-difference",
  "jarvis-critique",
  "jarvis-converge",
  "jarvis-persist",
] as const;

function placeholders(config: JarvisConfig): Record<string, string | number> {
  return {
    candidateCount: config.candidateCount,
    lowProbabilityCandidates: config.lowProbabilityCandidates,
    probabilityThreshold: config.probabilityThreshold,
    personaCount: config.personaCount,
    brainwritingRounds: config.brainwritingRounds,
    brainwritingMode: config.brainwritingMode,
    consensusCount: config.consensusCount,
    dedupThreshold: config.dedupThreshold,
    ideasFile: config.ideasFile,
    selectionCount: config.selectionCount,
    researchMinSources: config.researchMinSources,
    recentIdeasInContext: config.recentIdeasInContext,
  };
}

export function renderSkill(content: string, config: JarvisConfig): string {
  const values = placeholders(config);
  return content.replace(/\{\{(\w+)\}\}/g, (whole, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : whole,
  );
}

async function materialize(dir: string, id: string, content: string): Promise<string> {
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${id}.md`);
  let previous = "";
  try {
    previous = await readFile(path, "utf8");
  } catch {
    // First write.
  }
  if (previous !== content) await writeFile(path, content, "utf8");
  return path;
}

export async function loadSkills(
  config: JarvisConfig,
  packageRoot: URL = new URL("../", import.meta.url),
  log: (message: string) => void = () => {},
  materializeDir?: string,
): Promise<LoadedSkill[]> {
  const skills: LoadedSkill[] = [];
  for (const id of SKILL_IDS) {
    const sourcePath = fileURLToPath(new URL(`skills/${id}/SKILL.md`, packageRoot));
    try {
      const raw = await readFile(sourcePath, "utf8");
      const { meta, body } = parseFrontmatter(raw);
      const content = renderSkill(body, config);
      const path = materializeDir ? await materialize(materializeDir, id, content) : sourcePath;
      skills.push({
        id,
        name: meta.name ?? id,
        description: meta.description ?? "",
        content,
        path,
        autoinvoke: meta.autoinvoke ?? ALWAYS_ADVERTISED.has(id),
      });
    } catch (error) {
      log(`missing skill ${id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return skills;
}
