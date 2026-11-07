---
name: Jarvis consensus exclusion
description: Consensus-exclusion phase of the jarvis pipeline. Write the typical answer first, then forbid semantically equivalent ideas in later phases.
---

# Consensus exclusion

Use this after research and before the main divergence phase.

The first answer a model produces is the most typical answer. Asking for more ideas after that produces variations on the same region. This phase makes the typical answer explicit so it can be excluded.

## Procedure

1. Write the {{consensusCount}} most likely answers to the question. Do not make them straw men. Write the version a competent, well-read person would give.
2. For each, write one line: the obvious customer, the obvious mechanism, and the obvious reason it is appealing.
3. Write the shared assumption behind all of them. Example: "All three assume the user wants more features, not fewer."
4. Keep this list in the working notes. It is the exclusion set.
5. In later phases, an idea is excluded if it is semantically equivalent to a consensus answer. A new name, a new adjective, or a new pricing tier is not a difference.

## Prompt

```
Before generating, write the 3 most typical answers to this question. For each,
name the obvious customer, the obvious mechanism, and why it is appealing.

Then write the assumption all three share.

Do not propose any idea that is semantically equivalent to these answers.
Do not merely rename them. Do not wrap them in a new business model. If an
idea combines two of them, say which two and why the combination is
non-obvious.
```

## Category negation

The stronger variant comes from the IDEAFix experiment:

```
List the ideas you would normally generate. Group them into categories and name
each category. Now generate ideas that fit none of those categories. If an idea
is a renamed member of a category, discard it.
```

This is the move that produced the highest novelty scores among the tested AI-specific prompts. The mechanism is not "be creative". It is "do not explore the easiest path".

## What counts as different

Different in at least one structural dimension:

- a different customer or beneficiary,
- a different mechanism of value creation,
- a different unit of exchange (time, attention, data, access),
- a different constraint that changes what is possible,
- a different failure mode the idea is designed around.

A different adjective is not a structural difference. A different channel is usually not either.

## Failure handling

- The consensus list is too weak: replace it with the answer the strongest competitor would give.
- The model treats exclusion as negation and produces the opposite of each consensus answer: stop it. The opposite of a consensus answer is still defined by the consensus. Ask for ideas from a different region.
- The consensus list is empty: the question may not be open-ended. Say so and stop.
