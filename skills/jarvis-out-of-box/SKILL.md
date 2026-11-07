---
name: Jarvis out of box
description: Defixation phase of the jarvis pipeline. Use short out-of-the-box cues and category negation instead of a complex creativity method.
---

# Explicit out-of-the-box instruction

Use this as a short branch, not as the whole pipeline.

The IDEAFix experiment compared 25 prompts across 5 models. Simple prompts with explicit divergence cues beat complex method-based prompts such as C-K theory and SCAMPER. The authors conclude that novelty was driven by explicit instructions to go beyond the obvious and beyond frequently used categories, not by the structure of the creativity method.

## Exact cues

Control prompt:

```
Generate as many diverse and creative solutions as possible to address the
following design challenge: {{brief}}.
Instructions:
List all the solutions you find as a list.
Each solution is composed of a maximum of two sentences.
All solutions should be written in English.
The solutions are:
```

Defixation prompt:

```
Invent as many different and imaginative responses as possible to the following
situation: {{brief}}. Go beyond obvious answers — include wild, futuristic, or
playful directions that might open new ways of thinking.
Instructions:
List all the solutions you find as a list.
Each solution is composed of a maximum of two sentences.
All solutions should be written in English.
The solutions are:
```

The second prompt is from the paper's Figure 2. Keep it short. Do not add a five-step method around it.

## Category negation

This is the stronger AI-specific move from the same paper:

```
1. Generate a list of ideas for {{brief}}.
2. Group them into categories. Name each category.
3. Generate a new list of ideas that fit none of those categories.
4. If a new idea is a rename of a category member, discard it.
```

The experiment found that the two AI-specific prompts and the third brainstorming variant scored highest on novelty and rarity. The category-negation prompt was one of them.

## The trade-off

Surprising and negative keywords increased novelty and rarity but reduced diversity. Out-of-the-box cues are a novelty lever, not a diversity lever. Run them on a separate branch and merge the branch only after the main pool exists.

## Rules

1. Use the word "wild" or "unconventional" once. Repeating it does nothing.
2. Ask for two sentences per idea. Longer answers hide weak ideas.
3. Do not combine this with a named creativity framework in the same prompt. The experiment found that the framework adds cost without adding novelty.
4. Keep the output list. The category map is useful evidence in the difference phase.

## Failure handling

- The model produces only polite variations: add "one idea must be impractical with current technology; one must be illegal in at least one country" as a boundary. Keep the boundary, not the illegal idea.
- The model treats "wild" as "silly": add "wild but defensible to a domain expert".
- The category negation returns the same ideas with new labels: increase the category granularity and rerun.
