---
name: Jarvis critique
description: Self-critique phase of the jarvis pipeline. Attack each idea on novelty, evidence, feasibility, and specificity, then repair one structural element.
---

# Self-critique and repair

Use this after difference justification. The target is the idea, not a factual reasoning chain.

## Why the target matters

Self-Refine reports about 20% absolute average improvement across seven tasks when the feedback is specific and actionable. A separate study found that intrinsic self-correction of reasoning without external feedback often makes answers worse, and that models change correct answers to incorrect ones.

The lesson for this pipeline: critique the design against explicit criteria, not the model's chain of thought. If the critique cannot point to a concrete defect, keep the original.

## The four attacks

For each idea, write four lines:

1. Novelty. Is this a known idea with a new noun? Name the known idea. If you cannot, say "no close match found" and give the search evidence.
2. Evidence. What would have to be true for this to work? Which source supports it? Which part is `UNVERIFIED`?
3. Feasibility. What is the first blocking step? Who has to say yes? What does it cost?
4. Specificity. Could two competent teams build different things from this description? If yes, the idea is not yet a design.

## Repair

Change exactly one structural element:

- the audience,
- the mechanism,
- the constraint,
- the business model,
- the interface.

Then restate the idea in one sentence. If the repair is an adjective, a marketing angle, or a new name, it is cosmetic. Kill the idea.

## Prompt

```
Attack the idea below, not the person who wrote it. Use four headings:
Novelty, Evidence, Feasibility, Specificity. For each, name one concrete
defect. Then repair the idea by changing exactly one structural element:
audience, mechanism, constraint, business model, or interface. If the repair
is cosmetic, say "kill" and stop.
```

## Grading

Use this scale for the critique:

- 5: a defect that would change the design if fixed.
- 3: a real but minor gap.
- 1: a generic concern that applies to every idea.

A critique scored 1 does not justify a change. Keep the original.

## Failure handling

- The critique says "it depends" or "more research is needed": replace it with a falsifiable question. "What is the activation rate for the first cohort?" is actionable. "More research is needed" is not.
- Every idea gets killed: check whether the rubric is too strict. If the ideas fail on evidence only, keep the best one and mark it "evidence gap" rather than killing it.
- The repair recreates a consensus answer: send it back to consensus exclusion.
- The model critiques the writing rather than the idea: restate the four headings and ask for design defects only.

## Output

Keep a table: idea id, novelty defect, evidence defect, feasibility defect, specificity defect, repair, verdict (keep / kill / evidence gap). The rejected list at the end comes from this table.
