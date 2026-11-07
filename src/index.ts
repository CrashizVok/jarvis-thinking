/**
 * jarvis-thinking
 *
 * The plugin has one job: when a prompt is open-ended, attach the pipeline
 * skill before the model sees it. Everything else is tools, commands, and a
 * shipped agent. It never reads logits, never changes sampling parameters, and
 * never calls a model on its own.
 */

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Plugin, Skill } from "@opencode/plugin";
import type { Registration } from "@opencode/plugin/promise/registration";
import { registerCommands, readMode } from "./commands.ts";
import { resolveConfig } from "./config.ts";
import { registerTools } from "./tools.ts";
import { classifyPrompt } from "./trigger.ts";
import { loadSkills } from "./skills.ts";

const PIPELINE_SKILL = "jarvis-pipeline";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export default Plugin.define({
  id: "jarvis-thinking",

  async setup(ctx) {
    const config = resolveConfig(ctx.options ?? {});
    const projectDirectory = ctx.location.directory;
    const packageRoot = new URL("../", import.meta.url);
    const log = (message: string) => {
      if (config.debug) console.error(`[jarvis-thinking] ${message}`);
    };

    const registrations: Registration[] = [];
    const disposeAll = async () => {
      for (const registration of registrations.splice(0)) {
        try {
          await registration.dispose();
        } catch {
          // Disposal is best effort.
        }
      }
    };

    if (!config.enabled) {
      log("disabled by configuration");
      return disposeAll;
    }

    const skills = await loadSkills(
      config,
      packageRoot,
      log,
      join(projectDirectory, ".jarvis", "skills"),
    );
    const pipelineAvailable = skills.some((skill) => skill.id === PIPELINE_SKILL);
    if (!pipelineAvailable) log("pipeline skill is missing; automatic triggering will not attach it");

    if (skills.length > 0) {
      registrations.push(
        await ctx.skill.transform((editor) => {
          for (const skill of skills) {
            editor.add({
              id: Skill.ID.make(skill.id),
              name: Skill.Name.make(skill.name),
              description: skill.description,
              autoinvoke: skill.autoinvoke,
              path: Skill.Info.fields.path.make(skill.path),
              content: skill.content,
            });
          }
        }),
      );
    }

    await registerTools(ctx, { config, projectDirectory });
    await registerCommands(ctx, { config, projectDirectory, packageRoot });

    registrations.push(
      await ctx.session.hook("prompt", async (event) => {
        // A subagent is already inside a task. Attaching the pipeline again
        // would make the researcher re-run the whole ideation protocol.
        try {
          const session = await ctx.session.get({ sessionID: event.sessionID });
          if (session.parentID) {
            if (config.debug) log("skip: child session");
            return;
          }
        } catch (error) {
          log(`could not read session: ${error instanceof Error ? error.message : String(error)}`);
        }

        const mode = await readMode(ctx, event.sessionID);
        const decision = classifyPrompt(event.prompt.text, config, mode);

        try {
          await ctx.storage.set(`jarvis:session:${event.sessionID}:last`, {
            trigger: decision.trigger,
            score: decision.score === Number.POSITIVE_INFINITY ? "forced" : decision.score,
            threshold: decision.threshold,
            mode: decision.mode,
            reason: decision.reason,
            matched: decision.matched,
            at: new Date().toISOString(),
            preview: event.prompt.text.slice(0, 240),
          });
        } catch (error) {
          log(`could not store decision: ${error instanceof Error ? error.message : String(error)}`);
        }

        if (!decision.trigger || !pipelineAvailable) {
          if (config.debug) log(`skip: ${decision.reason}`);
          return;
        }

        const attached = event.prompt.skills ?? [];
        if (!attached.some((skill) => String(skill.id) === PIPELINE_SKILL)) {
          event.prompt.skills = [...attached, { id: Skill.ID.make(PIPELINE_SKILL) }];
        }
        if (config.debug) {
          log(`trigger: ${decision.reason} (score ${decision.score.toFixed(1)} >= ${decision.threshold})`);
        }
      }),
    );

    if (config.installAgent) {
      const target = join(projectDirectory, ".opencode", "agents", "jarvis.md");
      if (!(await exists(target))) {
        try {
          const source = fileURLToPath(new URL("agents/jarvis.md", packageRoot));
          const content = await readFile(source, "utf8");
          await mkdir(join(projectDirectory, ".opencode", "agents"), { recursive: true });
          await writeFile(target, content, "utf8");
          await ctx.agent.reload();
          log(`installed agent at ${target}`);
        } catch (error) {
          log(`agent install failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return disposeAll;
  },
});
