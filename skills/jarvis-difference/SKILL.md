---
name: Jarvis difference
description: Difference-justification phase of the jarvis pipeline. Every surviving idea states how it differs from the consensus and from the closest stored idea.
---

# Difference justification

Use this after deduplication and before critique.

An idea that cannot name its difference is a variation. The naming is not decoration; it is the test.

## Sentence template

For every surviving idea:

```
Unlike the consensus answer "<closest consensus>", this idea <what it does
differently> because <the reason the difference matters>.
```

Then add the nearest stored idea:

```
The closest stored idea is "<title>" (similarity <score>). This one differs by
<structural difference>.
```

If there is no stored idea, write "No close stored idea; this is a new region."

## What counts as a reason

A reason is a mechanism, a constraint, or a piece of evidence. "It is more innovative" is not a reason. "It removes the installation step, so it can reach users who cannot modify their building" is a reason.

## Procedure

1. For each idea, name the closest consensus answer. Use the list from the consensus phase.
2. Name the closest stored or sibling idea. Use the dedup output.
3. Write the difference in one sentence. No semicolons, no lists.
4. If the difference is only a noun, kill the idea.
5. If the difference is real but small, keep the idea and mark it "incremental". Incremental ideas can still win on usefulness, but they cannot win on novelty.

## Example

Weak:

> Unlike the usual fitness app, this one uses AI.

Strong:

> Unlike the usual fitness app, which asks the user to log workouts, this one
> uses the phone's lock screen as the only interface, because the target user
> has already deleted every fitness app they installed.

The strong version names the mechanism, the removal, and the user constraint.

## Failure handling

- The model writes a difference that applies to every idea: the difference is too abstract. Ask for the first concrete design choice that changes.
- The closest consensus answer is not in the list: add it to the consensus set and rerun the comparison.
- Two ideas have the same difference sentence: they are the same idea. Send both back to dedup.
