/**
 * Manual controls.
 *
 * /jarvis forces the pipeline for one prompt, /jarvis-off disables automatic
 * triggering for the session, /jarvis-on restores it, and /jarvis-status shows
 * the last decision and the active parameters.
 */

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "@opencode/plugin";
import type { JarvisConfig } from "./config.ts";

type Ctx = Plugin.Context;

export type SessionMode = "auto" | "force" | "off";

export function modeKey(sessionID: string): string {
  return `jarvis:session:${sessionID}:mode`;
}

export async function readMode(ctx: Ctx, sessionID: string): Promise<SessionMode> {
  const value = await ctx.storage.get(modeKey(sessionID));
  return value === "force" || value === "off" ? value : "auto";
}

function stripCommand(text: string, name: string): string {
  const trimmed = text.trim();
  const pattern = new RegExp(`^\\/${name}\\b\\s*`, "i");
  return trimmed.replace(pattern, "").trim();
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export interface CommandDeps {
  config: JarvisConfig;
  projectDirectory: string;
  packageRoot?: URL;
}

export async function registerCommands(ctx: Ctx, deps: CommandDeps): Promise<void> {
  const { config, projectDirectory } = deps;
  const packageRoot = deps.packageRoot ?? new URL("../", import.meta.url);

  await ctx.command.transform((editor) => {
    editor.add({
      name: "jarvis",
      description: "Force the full jarvis ideation pipeline on a topic, even when auto-trigger would skip it.",
      execute: async ({ sessionID, prompt, delivery }) => {
        const topic = stripCommand(prompt.text, "jarvis") || "Run the jarvis pipeline on the current conversation.";
        await ctx.storage.set(modeKey(sessionID), "force");
        await ctx.session.prompt({
          ...prompt,
          sessionID,
          text: topic,
          delivery,
        });
      },
    });

    editor.add({
      name: "jarvis-off",
      description: "Disable automatic jarvis pipeline triggering for this session.",
      execute: async ({ sessionID }) => {
        await ctx.storage.set(modeKey(sessionID), "off");
        await ctx.session.synthetic({
          sessionID,
          text: "jarvis-thinking: automatic pipeline disabled for this session. /jarvis still forces a run; /jarvis-on restores automatic triggering.",
        });
      },
    });

    editor.add({
      name: "jarvis-on",
      description: "Restore automatic jarvis pipeline triggering for this session.",
      execute: async ({ sessionID }) => {
        await ctx.storage.set(modeKey(sessionID), "auto");
        await ctx.session.synthetic({
          sessionID,
          text: "jarvis-thinking: automatic pipeline enabled for this session.",
        });
      },
    });

    editor.add({
      name: "jarvis-status",
      description: "Show the jarvis mode, the last trigger decision, and the active pipeline parameters.",
      execute: async ({ sessionID }) => {
        const mode = await readMode(ctx, sessionID);
        const last = await ctx.storage.get(`jarvis:session:${sessionID}:last`);
        const summary = {
          mode,
          autoTrigger: config.autoTrigger,
          threshold: config.triggerThreshold,
          candidates: config.candidateCount,
          tailCandidates: config.lowProbabilityCandidates,
          probabilityThreshold: config.probabilityThreshold,
          personas: config.personaCount,
          brainwritingRounds: config.brainwritingRounds,
          brainwritingMode: config.brainwritingMode,
          consensusCount: config.consensusCount,
          dedupThreshold: config.dedupThreshold,
          selectionCount: config.selectionCount,
          ideasFile: config.ideasFile,
          lastDecision: last ?? null,
        };
        await ctx.session.synthetic({
          sessionID,
          text: `jarvis-thinking status:\n\n${JSON.stringify(summary, null, 2)}`,
        });
      },
    });

    editor.add({
      name: "jarvis-install-agent",
      description: "Install the jarvis agent definition into .opencode/agents/jarvis.md if it is missing.",
      execute: async ({ sessionID }) => {
        const target = join(projectDirectory, ".opencode", "agents", "jarvis.md");
        if (await exists(target)) {
          await ctx.session.synthetic({
            sessionID,
            text: `jarvis-thinking: ${target} already exists. Left it untouched.`,
          });
          return;
        }
        try {
          const source = fileURLToPath(new URL("agents/jarvis.md", packageRoot));
          const content = await readFile(source, "utf8");
          await mkdir(join(projectDirectory, ".opencode", "agents"), { recursive: true });
          await writeFile(target, content, "utf8");
          await ctx.agent.reload();
          await ctx.session.synthetic({
            sessionID,
            text: `jarvis-thinking: installed ${target}. Start a new session or select the jarvis agent to use it.`,
          });
        } catch (error) {
          await ctx.session.synthetic({
            sessionID,
            text: `jarvis-thinking: could not install the agent: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      },
    });
  });
}
