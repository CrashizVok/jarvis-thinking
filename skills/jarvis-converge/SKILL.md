---
name: Jarvis converge
description: Convergence phase of the jarvis pipeline. Score survivors on novelty, usefulness, evidence, and surprise, then return only the best one or two.
---

# Convergence and selection

Use this after critique. The output is a decision, not a menu.

## Score four dimensions

Score every survivor from 1 to 5.

Novelty. Relative to the consensus list and `.jarvis/ideas.md`, not to your taste.

- 5: a new region; no close stored or consensus idea.
- 4: a structural change to a known idea.
- 3: a new combination of two known ideas with a non-obvious reason.
- 2: a known idea with a new audience.
- 1: a rename.

Usefulness. Would a real user change behavior because this exists?

- 5: solves a painful, frequent problem with a clear first user.
- 3: plausible value, unclear urgency.
- 1: interesting but nobody would switch.

Evidence. How much of the claim is supported?

- 5: primary source plus a documented mechanism.
- 3: analogy plus partial evidence.
- 1: pure conjecture.

Surprise. Would a domain expert say "I did not expect that"?

- 5: violates a shared assumption and survives the critique.
- 3: unexpected combination.
- 1: the expected answer.

## Selection rule

Return the best {{selectionCount}} by the sum of the four scores. Break ties in this order: evidence, usefulness, novelty, surprise. Do not return a third idea as a "bonus". A short list is the point.

If the top idea scores below 12 out of 20, say so. An honest weak result is better than a confident mediocre one.

## For each winner

Write:

1. Title.
2. One paragraph: what it is, who it is for, why now.
3. The difference sentence from the previous phase.
4. The four scores with one clause each.
5. The biggest risk.
6. The cheapest first test: one experiment, one metric, one threshold that would change your mind.

## Why this is not a search tree

Tree-of-Thoughts reports a large gain on Game of 24 (74% versus 4% for chain of thought) by searching over intermediate states with an evaluator. This pipeline does not have a reliable evaluator for open-ended ideas. The evidence on LLM novelty judges is that small prompt changes swing pairwise accuracy by more than 50 points. A deep search over a noisy evaluator would amplify the noise.

So the convergence phase is shallow on purpose: score once, break ties with evidence, return one or two. If you need a search, build it around a human or a real experiment, not another model's opinion.

## Failure handling

- All scores are 3: the rubric is not discriminating. Force a ranking and name the worst idea first.
- Novelty and usefulness conflict: prefer usefulness for a near-term decision, novelty for a research direction. State which decision this is.
- The winner is a consensus answer with a high score: send it back to consensus exclusion. A high usefulness score does not make a typical idea novel.
