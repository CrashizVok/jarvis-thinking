---
name: Jarvis stimuli
description: Stimulus phase of the jarvis pipeline. Add surprising and negative keywords, a random stimulus, an opposite assumption, and an extreme constraint as separate branches.
---

# Surprising keywords, random stimuli, opposite assumptions, extremes

Use this after the first divergent pass. Each stimulus is a separate branch, not a global instruction.

## Why separate branches

The IDEAFix experiment found that surprising keywords increased novelty and rarity, and negative keywords amplified the effect. The same experiment found that these cues reduced diversity. A global "be surprising" instruction makes every idea strange in the same way. A branch keeps the strange ideas together and leaves the main pool intact.

## The four stimuli

1. Surprising keyword. Pick an adjective that is unexpected for this domain. Example from the paper: a traditional, atypical, or surprising attribute attached to a product brief. Use a surprising one, not a random one.
2. Negative keyword. Pick a word with negative valence that still makes sense for the domain: "fragile", "slow", "illegal", "unpaid", "lonely". The paper found negative keywords produced the most novel and rare outputs, especially combined with surprising ones.
3. Random stimulus. Call `jarvis_stimulus` if it is available. Otherwise pick a noun from the list below using the last digit of the current minute. Force a connection between the noun and the problem.
4. Opposite assumption. Name the assumption every competitor shares. Reverse it. Generate ideas under the reversal even if it sounds wrong.

Then one extreme constraint. Use one of: 10x the budget, zero budget, 10x the users, one tenth of the time, no software, no electricity, one country only.

## Prompts

Surprising and negative branch:

```
Generate {{candidateCount}} ideas for {{brief}}.
Every idea must combine one surprising keyword and one negative keyword from
the list below. The keywords must change the mechanism, not the marketing.
Surprising: {{surprising}}
Negative: {{negative}}
```

Random stimulus branch:

```
Stimulus: {{random_noun}}
Generate {{candidateCount}} ideas for {{brief}} that borrow the stimulus's
structure, not its vocabulary. Explain the borrowed structure in one clause.
```

Opposite assumption branch:

```
The shared assumption is: {{assumption}}
Reverse it: {{reversal}}
Generate {{candidateCount}} ideas that only make sense if the reversal is true.
```

Extreme branch:

```
Constraint: {{extreme}}
Generate {{candidateCount}} ideas that survive this constraint. Do not soften
the constraint. If an idea needs an exception, it fails.
```

## Fallback nouns

Use the last digit of the current minute to pick one: lighthouse, compost, choir, passport, scaffolding, tide, archive, switchboard, orchard, mask.

## Rules

1. One stimulus per branch. Combining four stimuli in one prompt produces noise.
2. Keep the stimulus label on every idea. You need it in the difference phase.
3. Do not let a stimulus branch outvote the main branch. The main branch carries feasibility; the stimulus branch carries novelty.
4. If a branch produces only puns, discard the branch and record why.

## Failure handling

- The model ignores the keyword: put the keyword in the first sentence of the instruction and repeat it in the output schema.
- The random stimulus is too abstract ("justice"): replace it with a physical object.
- The opposite assumption is a straw man: restate it as the strongest version of the shared assumption before reversing it.
