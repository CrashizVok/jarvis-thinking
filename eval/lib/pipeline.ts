/**
 * The full pipeline as a sequence of model calls.
 *
 * This is a harness reimplementation of the protocol the plugin encodes. It
 * does not run the OpenCode plugin, and it does not use the plugin's tools.
 * Deduplication uses the plugin's real similarity code.
 */

import type { ModelClient } from "./client.ts";
import { deduplicate } from "../../src/ideas/dedup.ts";
import { parseIdeas, parsePlan, type ParsedIdea } from "./parse.ts";
import {
  brainwritingBuildPrompt,
  critiqueRepairPrompt,
  IDEAS_PER_RUN,
  planPrompt,
  selectPrompt,
  vsWithPlanPrompt,
} from "./prompts.ts";
import type { EvalTask } from "../tasks.ts";

export interface FullResult {
  pool: ParsedIdea[];
  selected: ParsedIdea[];
  calls: number;
  dropped: number;
  generated: number;
}

function render(ideas: ParsedIdea[]): string {
  return ideas
    .map((idea, index) => `${index + 1}. ${idea.title}: ${idea.text}`)
    .join("\n");
}

export async function runFullPipeline(
  client: ModelClient,
  task: EvalTask,
  brief: string,
  threshold: number,
): Promise<FullResult> {
  let calls = 0;
  const planResponse = await client.generate(planPrompt(task, brief));
  calls++;
  const plan = parsePlan(planResponse.text);
  if (plan.personas.length < 2) {
    throw new Error("plan returned fewer than two personas");
  }

  const first = await client.generate(vsWithPlanPrompt(task, JSON.stringify(plan)));
  calls++;
  const round1 = parseIdeas(first.text, IDEAS_PER_RUN);

  const second = await client.generate(
    brainwritingBuildPrompt(task, render(round1)),
  );
  calls++;
  const round2 = parseIdeas(second.text, IDEAS_PER_RUN);

  const all = [...round1, ...round2];
  const dedup = await deduplicate(
    all.map((idea) => ({ title: idea.title, text: idea.text, signature: idea.signature })),
    { threshold },
  );
  const survivors = dedup.kept.map((index) => all[index]!);

  const critique = await client.generate(
    critiqueRepairPrompt(task, render(survivors)),
  );
  calls++;
  const repaired = parseIdeas(critique.text, survivors.length).filter(
    (idea) => (idea.verdict ?? "").toLowerCase() !== "kill",
  );

  const selection = await client.generate(
    selectPrompt(task, render(repaired)),
  );
  calls++;
  const selected = parseIdeas(selection.text, 2);

  return {
    pool: repaired,
    selected,
    calls,
    dropped: dedup.dropped.length,
    generated: all.length,
  };
}
