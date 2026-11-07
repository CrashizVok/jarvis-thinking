# Difference justification

## What it is

Every surviving idea states, in one sentence, how it differs from the consensus answer and from the closest stored idea.

## Mechanism

The persona study's CoT procedure includes an explicit revision instruction: make the ideas "bolder and more different", and ensure "no two ideas are the same". That instruction is part of the condition that produced the highest diversity in Study 2. The revision is not just a request for more text; it is a request to compare the current set and move away from it.

The IDEAFix category-negation strategy is a stronger form: generate the normal ideas, name their categories, then generate outside the categories. The comparison is explicit.

The plugin adds a written justification. The purpose is to make the comparison inspectable. An idea that cannot name its difference is probably a variation.

## Experimental setup

The relevant experiment is Study 2 in Deng et al. (2026). Setup and numbers are in `research/cot-personas.md`.

The exact revision step in the LLM CoT prompt:

```
2. Review and refine ideas to make them bolder and more different - ensure that no two ideas are the same.
```

The human CoT condition used the same idea: participants generated ten short summaries, then revised each to differ as much as possible from its initial version. The human condition did not improve; the LLM condition did. The paper interprets this as LLMs being more responsive to explicit revision instructions.

The IDEAFix category-negation prompt is described in `research/consensus-exclusion.md`.

## Exact numbers

- LLM Default + CoT: 27 categories, 152 unique combinations, versus 23 and 85 for the default. Humans: 28 and 196.
- LLM Ordinary Personas + CoT: 27 categories, 240 unique combinations, 22% above the human baseline.
- Human CoT: 28 categories, 184 combinations, slightly below the human baseline of 196.
- The revision instruction is part of a bundle. No experiment isolates the sentence "state how your idea differs" as a standalone intervention. That exact template is `UNVERIFIED` as a causal technique.

## Known limitations and conflicting results

- A written difference can be a rationalization. A model can invent a distinction that does not change the design.
- The justification can be gamed by choosing a weak consensus answer. The consensus list must be the strongest version, not a straw man.
- The instruction can push toward superficial novelty: a new noun, a new audience label, a new pricing tier.
- The persona study's revision step operates on a whole set. It does not test pairwise justification against a stored corpus.

## Prompt wording that produced the best results

The revision wording from the persona study:

```
Review and refine ideas to make them bolder and more different - ensure that no two ideas are the same.
```

The plugin's sentence template is an engineering construct:

```
Unlike the consensus answer "<closest consensus>", this idea <what it does
differently> because <the reason the difference matters>.
```

and

```
The closest stored idea is "<title>" (similarity <score>). This one differs by
<structural difference>.
```

## Design consequence

The pipeline requires the difference sentence before critique. It kills ideas whose only difference is a noun. It carries the sentence into the final result, so the user can judge the claim.

## Citations

- Deng, Y., Brucks, M., Toubia, O. (2026). *A Cognitive Framework for Idea Diversity in Large Language Models.* arXiv:2602.20408. https://arxiv.org/abs/2602.20408
- Carichon, F., et al. (2026). *IDEAFix.* arXiv:2606.00875. https://arxiv.org/abs/2606.00875
