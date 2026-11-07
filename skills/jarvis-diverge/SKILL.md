---
name: Jarvis diverge
description: Divergence phase of the jarvis pipeline. Generate candidates without judging them, then evaluate in a separate convergent pass.
---

# Diverge before you converge

Use this when the task has more than one defensible answer. The failure mode is premature convergence: the first plausible idea anchors every later idea.

## The two passes

Pass 1, divergence:

- Produce candidates only.
- No feasibility comments.
- No ranking.
- No "this one is best".
- No deleting a candidate because it sounds strange.
- Write each candidate as a separate line or object.

Pass 2, convergence:

- Score, combine, kill, and select.
- Do this only after pass 1 is closed.
- Do not add a new candidate during pass 2 unless it is a repair of an existing one.

## Exact prompt pattern

This is the tested CreativeDC wording, adapted:

```
Apply the following thinking process.

Divergent thinking phase: Think about only the given theme and list wildly
different and underexplored elements, objects, scenarios, or situations that
are relevant. Ignore the required constraints in this phase. Push for unusual,
surprising, unconventional, and diverse ideas. Explore the creative space as
much as possible.

Convergent thinking phase: From your brainstormed ideas, select one and connect
it with the required constraints to create a concrete proposal. If it does not
work, go back to the list and try another idea.
```

The original prompt is in research/divergence-convergence.md. The experiment found that this two-stage form produced about 1.6x more distinct high-utility tasks than direct prompting or chain-of-thought alone.

## Why the separation matters

In the CreativeDC experiment, direct prompting and a plain "think step by step" prompt produced about 8 distinct high-utility tasks at K=50. The two-stage form produced about 12. The difference was not more tokens. It was not evaluating while exploring.

## Rules

1. Divergence has a quota. Do not stop at three ideas because they are good.
2. Every candidate gets an id. You will need the id in the difference and critique phases.
3. Keep a separate list for "wild" candidates. Do not mix them into the main list until synthesis.
4. If you notice yourself evaluating, write the evaluation in a separate section and continue.
5. The convergent pass must be able to say "none of these work". A forced winner is worse than an honest empty result.

## Failure handling

- The model returns one idea in a list of five: ask for the missing four with the instruction "do not repeat or paraphrase the first".
- The model returns five paraphrases: change the structural constraint (audience, mechanism, business model, interface) and rerun.
- The model refuses a wild branch: keep the refusal as a data point and move to the next branch.
