---
name: Jarvis brainwriting
description: Brainwriting phase of the jarvis pipeline. Run iterative rounds where each round builds on, combines, or inverts the previous round's ideas.
---

# Brainwriting rounds

Use this after the first divergent pass. Brainwriting is the only structured creativity method in the ICML 2026 comparison that produced a significant originality gain: 4.29 versus 3.44 on a 0 to 5 scale, d=2.0. Disney and Double Diamond did not.

The mechanism is iterative building, not the number of agents. The single-LLM simulation captured about 70% of the multi-agent gain.

## Round structure

Run {{brainwritingRounds}} rounds. Each round has a different job.

Round 1, Bold Inventor:

```
Generate {{candidateCount}} ideas that are new to this problem. Do not evaluate
them. Each idea gets a short title, one sentence of mechanism, and the
assumption it depends on.
```

Round 2, Builder:

```
Take the ideas below. For each of {{candidateCount}} new ideas, name the prior
idea you are extending. Add one new mechanism, one new audience, or one new
constraint. A rephrasing is not an extension. If you cannot name what you
added, do not submit the idea.
```

Round 3, Lateral Thinker:

```
Take the ideas below. Produce {{candidateCount}} new ideas by doing one of:
(1) invert the strongest assumption in a prior idea,
(2) combine two ideas that share no mechanism,
(3) push one variable to an extreme (10x users, zero budget, one day, no
    software).
Name the prior idea and the operation for every new idea.
```

Synthesis, not a fourth divergence round:

```
Cluster the ideas into themes. Name each theme. For each theme, state the
shared assumption. Mark the theme with the fewest ideas as the unexplored
region.
```

## Multi-agent mode

When `{{brainwritingMode}}` is `multi-agent`, run each round in a subagent with fresh context. Give the subagent only the prior round's output, not the whole conversation. The paper's multi-agent configuration was slightly better than the single-LLM simulation (+0.25, p=.057), but the difference was not significant. Use multi-agent when the cost is acceptable and the task is high-value.

When the mode is `simulated`, do all rounds in one session. Label each round. Do not let round 2 see your evaluation of round 1.

## Quality checks

1. Every idea in round 2 and 3 must name its parent. An orphan idea is a fresh idea, not brainwriting.
2. Count structural changes, not words. If round 2 changes only adjectives, it failed.
3. Keep a kill list. An idea that was inverted into a better idea is a success, not a loss.
4. Do not run more than five rounds. The paper's gains come from three divergent passes plus synthesis. More rounds add cost and drift.

## Failure handling

- Round 2 collapses into paraphrases: rerun with the instruction "change the customer or the mechanism, not the wording".
- A subagent returns a summary instead of ideas: ask for the idea list only, one per line.
- The model refuses to invert a sacred assumption: record the refusal and invert a smaller assumption. Do not force it.
