---
name: Jarvis pipeline
description: Full research-then-diverge-then-converge ideation pipeline. Use for brainstorming, ideation, research, strategy, design, naming, or any open-ended "what should we build/do" request.
---

# Jarvis pipeline

You are running an open-ended ideation task. The deliverable is a small number of genuinely novel, useful ideas with evidence, not a list of typical answers.

## Rules that override convenience

1. Research before you generate. If a search tool is available, use it. Record the source for every factual claim.
2. Diverge before you converge. Do not evaluate an idea while you are still producing ideas.
3. Never invent a source, number, date, or quotation. If you cannot verify it, write `UNVERIFIED`.
4. Keep an audit trail. The user must be able to see how many candidates you generated, what you removed, and why.
5. Do not stop at the first plausible answer. The first answer is the consensus answer.
6. Load every named skill with the `skill` tool. Do not read the skill files from disk. The tool returns the current text and the correct base directory.

## Phase 0. Frame

Write one sentence: the decision this work informs, the audience, and the constraint that matters most. If the request is too broad to fit one sentence, narrow it and state the narrowing.

## Phase 1. Research

Load `jarvis-research`. Search for:

- the current state of the art,
- what has already been tried and what failed,
- the strongest opposing view,
- one adjacent field with the same structure.

Collect at least {{researchMinSources}} sources when search works. For each: title, URL, date, and the one claim you will use. Prefer primary sources. If search is unavailable, say so in one line and mark every claim that comes from model memory as `UNVERIFIED`.

## Phase 2. Consensus baseline

Before generating, write the {{consensusCount}} most typical answers a generic model would give. For each, one line on why it is typical: the obvious customer, the obvious mechanism, the obvious example. This list is the exclusion set. Do not skip this phase.

## Phase 3. Personas and stimuli

Load `jarvis-personas` and `jarvis-stimuli`.

Pick {{personaCount}} deliberately different expert viewpoints. Make them ordinary and specific, not famous. Each persona needs a goal, a constraint, and a blind spot. Do not let two personas share a profession, a customer, or a mechanism.

Generate one surprising keyword, one negative keyword, one random stimulus, one opposite assumption, and one extreme constraint. Keep them in a separate branch so they cannot flatten the whole idea pool.

## Phase 4. Divergent generation

Load `jarvis-verbalized-sampling` and `jarvis-diverge`.

Generate at least {{candidateCount}} candidates per persona. Use the verbalized-sampling format: every candidate carries a probability, and at least {{lowProbabilityCandidates}} candidates per call must be below {{probabilityThreshold}}. No filtering in this phase. No "that won't work" comments.

If the model cannot produce valid probabilities, use ranks and say so. If it produces fewer candidates than asked, ask once for the missing tail. If it still falls short, record the shortfall and continue.

## Phase 5. Brainwriting

Load `jarvis-brainwriting`. Run {{brainwritingRounds}} rounds in `{{brainwritingMode}}` mode.

- Round 1, Bold Inventor: fresh ideas, no criticism.
- Round 2, Builder: every new idea names the prior idea it extends and adds a new mechanism, audience, or constraint.
- Round 3, Lateral Thinker: every new idea inverts an assumption, combines two unrelated ideas, or pushes one variable to an extreme.
- Synthesis: cluster the surviving ideas into themes. Synthesis is convergence, not another divergence round.

A round that only rewords the previous round is not a round. If that happens, discard it and rerun with a structural change.

## Phase 6. Dedup and consensus exclusion

Load `jarvis-dedup` and `jarvis-consensus-exclusion`.

Call `jarvis_dedup` with every candidate, its title, and a 3-5 word concept signature. Use threshold {{dedupThreshold}}. Drop duplicates against `.jarvis/ideas.md` and against earlier candidates. Then drop ideas semantically equivalent to the consensus baseline. A rename is not a difference. A combination of two consensus ideas is allowed only if you can state why the combination is non-obvious.

If the tool fails, compare manually and say that you did.

## Phase 7. Difference justification

Load `jarvis-difference`. For every surviving idea, write one sentence:

"Unlike the consensus answer <X>, this idea <Y> because <Z>."

Name the closest consensus idea and the closest stored idea. If you cannot name a real difference, kill the idea.

## Phase 8. Self-critique and repair

Load `jarvis-critique`. Attack every idea on four axes:

- Novelty: is this a known idea with a new noun?
- Evidence: what would have to be true, and what source supports it?
- Feasibility: what is the first blocking step?
- Specificity: could two teams build different things from this description?

Then repair one structural element: audience, mechanism, constraint, business model, or interface. If the repair is cosmetic, kill the idea. Keep the original when the critique is generic. Self-critique is unreliable on factual reasoning; this phase evaluates ideas against a rubric, not a proof.

## Phase 9. Convergence

Load `jarvis-converge`. Score each survivor from 1 to 5 on novelty, usefulness, evidence, and surprise. Novelty is relative to the consensus list and `.jarvis/ideas.md`, not to your taste. Return only the best {{selectionCount}}. For each winner: title, one paragraph, the difference sentence, the scores, the biggest risk, and the cheapest first test.

## Phase 10. Persist

Load `jarvis-persist`. Call `jarvis_persist` with the accepted ideas. Include timestamp, topic, title, summary, signature, novelty, usefulness, sources, and a fingerprint. If the tool fails, print the exact Markdown entry and tell the user where to paste it.

## Output contract

End with these sections, in this order:

1. `## Result` — the {{selectionCount}} winner(s).
2. `## Why these are not the obvious answers` — the difference sentences.
3. `## What I rejected` — one line per killed idea and the reason.
4. `## Process` — counts only: sources read, candidates generated, duplicates removed, ideas killed in critique.
5. `## Sources` — URLs actually opened.
6. `## Next step` — the cheapest experiment that would change your mind.

Do not add a summary of the summary. Do not pad the result with runner-up ideas. If nothing survives, say so and explain which constraint killed the pool.
