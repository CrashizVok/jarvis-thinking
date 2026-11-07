---
name: Jarvis personas
description: Persona phase of the jarvis pipeline. Assign several ordinary, specific expert viewpoints that push generation into different knowledge regions.
---

# Multiple personas

Use this after the consensus baseline. A persona is a sampling cue, not a costume.

## What makes a good persona set

- Ordinary, not famous. The persona study found that randomly sampled ordinary personas beat curated creative-entrepreneur personas on every diversity metric in GPT-4o. The advantage shrinks in newer models but does not reverse.
- Specific enough to imply a different daily reality: a job, a constraint, a customer, a failure they have lived through.
- Disjoint: no two personas share a profession, a customer segment, or a mechanism.
- Each persona has a goal, a constraint, and a blind spot. The blind spot is what stops the persona from becoming a generic "expert".

## Exact prompt

The persona study used this system message:

```
You are acting as this persona: {{persona}}.

Generate ideas from this persona's perspective.
```

Add the goal, constraint, and blind spot explicitly:

```
Persona: {{persona}}
Goal: {{what this persona is trying to achieve}}
Constraint: {{the limitation that shapes their choices}}
Blind spot: {{what this persona systematically undervalues}}
```

## Procedure

1. Pick {{personaCount}} personas. Write each in one compact block.
2. Run the divergent phase once per persona. Do not let a later persona see an earlier persona's list until all lists exist.
3. Tag every idea with its persona id.
4. After all personas finish, compare their first ideas. If two personas start in the same region, replace one. The value of a persona is the region it opens, not its biography.
5. Carry the persona tag into difference justification. An idea that only makes sense to its own persona is weak evidence of novelty.

## The fixation warning

In the same study, ordinary personas increased knowledge partitioning across sessions but also increased fixation within a session: the exploration slope fell from 1.023 to 0.875 on a 0 to 3 scale. Personas open a new starting region and then hold the session there.

That is why this phase must be followed by chain-of-thought revision or a structural brainwriting round. Do not run personas alone and call it diverse.

## Failure handling

- Personas collapse into job titles: add a concrete constraint ("no capital", "must work offline", "has 20 minutes a day").
- Personas reproduce stereotypes: replace the persona, not the idea. A stereotype is a consensus answer in disguise.
- The model writes in the persona's voice instead of thinking from it: tell it to keep a neutral analyst voice and use the persona only as a constraint on what counts as a good idea.
