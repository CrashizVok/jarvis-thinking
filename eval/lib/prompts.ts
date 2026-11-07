/**
 * Condition prompts for the evaluation harness.
 *
 * Each single-call condition returns six ideas in the same JSON shape, so the
 * metrics see the same unit. The full pipeline uses several calls and is
 * orchestrated in run.ts.
 */

import type { EvalTask } from "../tasks.ts";

export const IDEAS_PER_RUN = 6;

export function schema(count = IDEAS_PER_RUN): string {
  return `Return ONLY JSON in this shape:
{"ideas":[{"title":"short name","text":"one or two sentences","signature":"3 to 5 concept words"}]}
Return exactly ${count} ideas. No prose outside the JSON.`;
}

export function finalSchema(count = IDEAS_PER_RUN): string {
  return `Return ONLY JSON in this shape:
{"ideas":[{"title":"short name","text":"one or two sentences","signature":"3 to 5 concept words"}]}
Return exactly ${count} ideas. No prose outside the JSON.`;
}

export function plainPrompt(task: EvalTask): string {
  return `Task: ${task.prompt}

Generate ${IDEAS_PER_RUN} ideas. Make them specific and useful.

${schema()}`;
}

export function researchPrompt(task: EvalTask, brief: string): string {
  return `Task: ${task.prompt}

Here is a research brief:
${brief}

Generate ${IDEAS_PER_RUN} ideas that use the brief. At least three ideas must
build on a specific claim or failure named in the brief. Do not repeat the
brief's examples.

${schema()}`;
}

export function divergePrompt(task: EvalTask): string {
  return `Task: ${task.prompt}

Phase 1, divergent thinking: list 15 wildly different directions first. Ignore
feasibility in this phase. Push for unusual, surprising, and underexplored
directions.

Phase 2, convergent thinking: select ${IDEAS_PER_RUN} of those directions and
develop each into a concrete idea. Connect each one to the task's constraints.
If a direction does not work, choose another.

${schema()}`;
}

export function vsPrompt(task: EvalTask): string {
  return `Task: ${task.prompt}

Generate ${IDEAS_PER_RUN} responses to the input prompt.

At least 2 of the responses must have a probability below 0.10. These are the
tail candidates. Make them genuine alternatives that a minority of experts
would defend, not jokes.

Return ONLY JSON in this shape:
{"ideas":[{"title":"short name","text":"one or two sentences","signature":"3 to 5 concept words","probability":0.0}]}
The probability is the estimated probability from 0.0 to 1.0 of this response
given the input prompt, relative to the full distribution. Return exactly
${IDEAS_PER_RUN} ideas.`;
}

export function personasPrompt(task: EvalTask): string {
  return `Task: ${task.prompt}

Pick 3 deliberately different expert viewpoints. Make them ordinary and
specific, not famous. Each persona needs a goal, a constraint, and a blind spot.
Do not let two personas share a profession, a customer, or a mechanism.

Generate 2 ideas from each persona's perspective. Tag each idea with its persona
in the text, then remove the tag from the final title.

${schema()}`;
}

export function personaCotPrompt(task: EvalTask): string {
  return `Task: ${task.prompt}

Pick 3 deliberately different ordinary expert personas. For each persona:

1. Generate 2 short idea titles only.
2. Review the titles and make them bolder and more different from one another.
   No two ideas should be the same.
3. Expand each title into one or two sentences.

Return the final ${IDEAS_PER_RUN} ideas.

${schema()}`;
}

export function brainwritingPrompt(task: EvalTask): string {
  return `Task: ${task.prompt}

Run three brainwriting rounds in one response.

Round 1, Bold Inventor: generate 2 fresh ideas. Do not evaluate them.
Round 2, Builder: generate 2 new ideas. For each, name the prior idea it
extends and add a new mechanism, audience, or constraint. A rephrasing is not
an extension.
Round 3, Lateral Thinker: generate 2 new ideas. For each, invert an assumption,
combine two ideas that share no mechanism, or push one variable to an extreme.
Name the operation.

Return the ${IDEAS_PER_RUN} new ideas from the three rounds, not the parents.

${schema()}`;
}

export function outOfBoxPrompt(task: EvalTask): string {
  return `Task: ${task.prompt}

Invent as many different and imaginative responses as possible to the
situation. Go beyond obvious answers — include wild, futuristic, or playful
directions that might open new ways of thinking.

List the solutions as a list. Each solution is at most two sentences.

Then return the best ${IDEAS_PER_RUN} as JSON.

${schema()}`;
}

export function keywordsPrompt(task: EvalTask): string {
  return `Task: ${task.prompt}

Generate ${IDEAS_PER_RUN} ideas. Every idea must combine the surprising keyword
"${task.keywords.surprising}" and the negative keyword "${task.keywords.negative}".
The keywords must change the mechanism or the constraint, not the marketing.
One idea must satisfy this extreme constraint: ${task.extreme}.

${schema()}`;
}

export function consensusPrompt(task: EvalTask): string {
  return `Task: ${task.prompt}

First write the 3 most typical answers to this question. For each, name the
obvious customer, the obvious mechanism, and why it is appealing. Then write the
assumption all three share.

Do not propose any idea that is semantically equivalent to those answers. Do
not merely rename them. If an idea combines two of them, say which two and why
the combination is non-obvious.

Return ${IDEAS_PER_RUN} ideas that survive the exclusion.

${schema()}`;
}

export function critiquePrompt(task: EvalTask): string {
  return `Task: ${task.prompt}

Generate ${IDEAS_PER_RUN} ideas. Then attack each one on four axes: novelty,
evidence, feasibility, and specificity. For each axis, name one concrete defect.
Repair each idea by changing exactly one structural element: audience,
mechanism, constraint, business model, or interface. If a repair is cosmetic,
replace the idea instead.

Return the ${IDEAS_PER_RUN} repaired ideas. Put only the repaired idea in the
text field; put the four defects in a separate "critique" field.

${schema()}`;
}

// ---------------------------------------------------------------------------
// Full pipeline calls
// ---------------------------------------------------------------------------

export function planPrompt(task: EvalTask, brief: string): string {
  return `Task: ${task.prompt}

Research brief:
${brief}

Do three things and return JSON.

1. Write the 3 most typical answers to the task. For each, name the obvious
customer, mechanism, and appeal. Then write the assumption they share.
2. Pick 3 ordinary, specific expert personas. Each needs a name, goal,
constraint, and blind spot. No two may share a profession, customer, or
mechanism.
3. Produce a surprising keyword, a negative keyword, a random noun, an opposite
assumption, and an extreme constraint.

Return JSON:
{"consensus":["..."],"shared_assumption":"...","personas":[{"name":"","goal":"","constraint":"","blind_spot":""}],"stimuli":{"surprising":"","negative":"","noun":"","opposite":"","extreme":""}}`;
}

export function vsWithPlanPrompt(task: EvalTask, plan: string): string {
  return `Task: ${task.prompt}

Use this plan:
${plan}

Generate ${IDEAS_PER_RUN} ideas from the three personas. At least 2 ideas must
be tail candidates with a probability below 0.10. At least one idea must use the
random noun as a structural analogy. At least one must reverse the shared
assumption.

Return ONLY JSON:
{"ideas":[{"title":"","text":"","signature":"","probability":0.0,"persona":""}]}
Return exactly ${IDEAS_PER_RUN} ideas.`;
}

export function brainwritingBuildPrompt(task: EvalTask, parents: string): string {
  return `Task: ${task.prompt}

Here are the first-round ideas:
${parents}

Run two more brainwriting rounds.

Builder: generate 3 new ideas. Each must name the prior idea it extends and add
a new mechanism, audience, or constraint.

Lateral Thinker: generate 3 new ideas. Each must invert an assumption, combine
two ideas that share no mechanism, or push one variable to an extreme. Name the
operation.

Return ONLY JSON:
{"ideas":[{"title":"","text":"","signature":"","parent":"","operation":""}]}
Return exactly ${IDEAS_PER_RUN} new ideas.`;
}

export function critiqueRepairPrompt(task: EvalTask, ideas: string): string {
  return `Task: ${task.prompt}

Ideas:
${ideas}

For each idea, attack it on four axes: novelty, evidence, feasibility, and
specificity. Name one concrete defect per axis. Then repair it by changing
exactly one structural element: audience, mechanism, constraint, business
model, or interface. If the repair is cosmetic, mark the idea "kill".

Return ONLY JSON:
{"ideas":[{"title":"","text":"the repaired idea only, one or two sentences","signature":"","critique":"four short defect labels","verdict":"keep"}]}
The text field must contain only the repaired idea. Put the four defects in the
critique field. Keep at most ${IDEAS_PER_RUN} ideas.`;
}

export function selectPrompt(task: EvalTask, ideas: string): string {
  return `Task: ${task.prompt}

Candidates:
${ideas}

Score each candidate from 1 to 5 on novelty, usefulness, evidence, and surprise.
Novelty is relative to the typical answers for this task, not to your taste.
Return the best 2. For each winner include the scores, the biggest risk, and the
cheapest first test.

Return ONLY JSON:
{"ideas":[{"title":"","text":"","signature":"","novelty":0,"usefulness":0,"evidence":0,"surprise":0,"risk":"","first_test":""}]}
Return exactly 2 ideas.`;
}
