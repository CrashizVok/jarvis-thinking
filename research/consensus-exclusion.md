# Consensus exclusion

## What it is

Write the most typical answers first, then forbid ideas that are semantically equivalent to them in later phases.

## Mechanism

The Artificial Hivemind study shows that the first plausible answer is not a random draw. Across 25 models and 100 queries, responses to the same prompt had average pairwise similarity above 0.8 in 79% of cases. The first answer sits in a dense region that every model shares.

Writing the typical answer down does two things:

1. It makes the shared region visible, so the model can name it.
2. It creates an explicit exclusion set for the difference phase.

The IDEAFix category-negation strategy is the stronger version. The model generates the ideas it would normally generate, groups them into categories, and then generates ideas outside those categories. The paper reports that the two AI-specific prompts and the third brainstorming variant scored highest on novelty and rarity. The category-negation prompt was one of them.

## Experimental setup

The Hivemind setup is described in `research/research-first.md`. The relevant numbers:

| Item | Value |
|---|---|
| Queries | 100 human-verified open-ended queries |
| Models | 25 in the main analysis, 70+ total |
| Samples | 50 responses per query per model |
| Intra-model result | 79% of cases above 0.8 average pairwise similarity |
| Inter-model result | 71% to 82% average pairwise similarity |

The IDEAFix setup:

| Item | Value |
|---|---|
| Briefs | 81 |
| Prompts | 25, including 4 AI-specific strategies |
| Models | 5 |
| Repeats | 3 |
| Input prompts | 14,350 |

## Exact numbers

- Hivemind: intra-model similarity above 0.8 in 79% of cases; inter-model similarity 71% to 82%; top-50 nearest responses come from about 8 unique models on average.
- IDEAFix: all method-inspired prompts outperformed controls; the AI-specific prompts and the third brainstorming variant had the highest top-five novelty and rarity. Exact effect sizes are in the paper's appendix and were not extracted here.
- No experiment isolates "write the consensus answer first, then exclude it" as a standalone intervention. That exact procedure is a design derived from the two findings. Mark its effect `UNVERIFIED`.

## Known limitations and conflicting results

- Exclusion can become mere negation. The opposite of a consensus answer is still defined by the consensus. The aim is a different region, not a mirror image.
- A semantic equivalence check is needed. A new name or a new pricing tier is not a difference.
- The consensus list is only as good as the model's knowledge of the field. A weak list produces weak exclusion.
- The Hivemind study is descriptive. It shows homogeneity, not that exclusion fixes it.
- The IDEAFix result is about category negation in a single prompt, not a multi-phase exclusion protocol.

## Prompt wording that produced the best results

The IDEAFix category-negation prompt, described in §3.3:

> Asking LLMs to generate ideas, categorize them, and then generate new ideas outside of those categories.

The plugin's prompt is an engineering construct:

```
Before generating, write the 3 most typical answers to this question. For each,
name the obvious customer, the obvious mechanism, and why it is appealing.

Then write the assumption all three share.

Do not propose any idea that is semantically equivalent to these answers.
Do not merely rename them. Do not wrap them in a new business model. If an
idea combines two of them, say which two and why the combination is
non-obvious.
```

## Design consequence

The pipeline runs consensus exclusion after research and before divergence, then again after dedup. It requires the difference phase to name the closest consensus answer. It does not accept a rename as a difference.

## Citations

- Jiang, L., et al. (2025). *Artificial Hivemind: The Open-Ended Homogeneity of Language Models (and Beyond).* arXiv:2510.22954. https://arxiv.org/abs/2510.22954
- Carichon, F., et al. (2026). *IDEAFix: Evaluation Framework for Creative Defixation Prompting in LLMs.* arXiv:2606.00875. https://arxiv.org/abs/2606.00875
- Zhang, J., et al. (2026). *Verbalized Sampling.* arXiv:2510.01171. https://arxiv.org/abs/2510.01171
