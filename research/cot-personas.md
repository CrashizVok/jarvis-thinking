# Personas plus chain of thought

## What it is

A two-step generation procedure inside a persona: first write short idea titles, then explicitly revise the titles to be bolder and more different, then expand them into full ideas.

## Mechanism

The persona paper argues that early elaboration anchors the rest of the session. A full paragraph creates many tokens that constrain later output. Short titles are cheap to replace. The explicit revision instruction pushes against typicality bias and breaks the association chain that fixation builds.

The paper treats this as two mechanisms working together:

- Personas restore knowledge partitioning between sessions.
- CoT reduces fixation within a session.

The combination targets both. In the GPT-4o study, personas plus CoT produced the highest diversity on every metric and exceeded the human benchmark on unique combinations.

## Experimental setup

Study 2, a 3 × 2 between-participants design:

| Item | Value |
|---|---|
| Ideators | Human, LLM Default, LLM Ordinary Personas |
| Procedures | Baseline, CoT |
| Human sample | 100 recruited, 83 after exclusions |
| LLM sample | 99 simulated participants per condition |
| Ideas analyzed | 830 per condition (83 participants × 10 ideas), matching the human CoT sample |
| Generator | GPT-4o (gpt-4o-2024-11-20), temperature 1.0 |
| Task | 10 fitness product ideas |
| CoT procedure | Generate 10 short titles, revise to be bolder and more different, expand to one-sentence ideas |
| Statistics | 100 bootstrap draws of 10 participants × 10 ideas; Welch t-tests |

## Exact numbers

Aggregate over 830 ideas per condition:

| Condition | Categories | Unique combinations |
|---|---|---|
| Human baseline | 28 | 196 |
| Human CoT | 28 | 184 |
| LLM Default | 23 | 85 |
| LLM Default + CoT | 27 | 152 |
| LLM Ordinary Personas | 27 | 190 |
| LLM Ordinary Personas + CoT | 27 | 240 |

The last row exceeds the human baseline by 22% on unique combinations.

Fixation slopes:

| Comparison | Baseline | CoT | Test |
|---|---|---|---|
| LLM Default | 1.023 (SE 0.017) | 1.354 (SE 0.020) | p<.001 |
| LLM Ordinary Personas | 0.875 (SE 0.028) | 1.067 (SE 0.030) | p<.001 |
| Human | 1.020 (SE 0.028) | 1.035 (SE 0.029) | p=.70 |

Bootstrapped group comparisons:

- For LLM Default, CoT increased categories, combinations, and pairwise distance (all p<.001).
- For LLM Ordinary Personas, CoT increased all three (p<.001).
- For humans, CoT slightly reduced unique categories (p<.001), while combinations (p=.366) and distance (p=.905) were unchanged.

## Known limitations and conflicting results

- CoT is not a pure diversity win. In the Gemini replication, CoT narrowed first-idea diversity (7.11 categories versus 9.14 for the default, p<.001). It reduced fixation inside a session while reducing spread across sessions. The paper reports this as a difference from GPT-4o.
- The main Study 2 CoT condition generated all ten ideas at once, while Study 1 generated them sequentially. The authors run a sequential CoT robustness check and find the direction holds, but the personas-plus-CoT gain is less pronounced.
- Human CoT did not help and slightly reduced combinations. The paper interprets this through ironic-process theory: telling people to be different can keep the primed representation active. LLMs, trained to follow instructions, behave differently.
- One task category, one main model, and LLM-generated ideas judged by category metrics.
- The CoT procedure is not a general reasoning intervention. The accuracy-side literature on chain of thought is separate; see the note below.

## Chain-of-thought background

Wei et al. (2022) introduced chain-of-thought prompting with eight exemplars. On PaLM 540B:

| Benchmark | Standard | CoT |
|---|---|---|
| GSM8K | 17.9 | 56.9 |
| SVAMP | 69.4 | 79.0 |
| ASDiv | 72.1 | 73.9 |
| AQuA | 25.2 | 35.8 |
| MAWPS | 79.2 | 93.3 |

The gain is an emergent ability of scale. It does not help small models, and it is a reasoning intervention, not a diversity intervention. The persona study's CoT is a revision loop over idea titles, not a math-style reasoning trace.

## Prompt wording that produced the best results

From Appendix J, the LLM Ordinary Personas CoT prompt:

```
You are acting as this persona: {persona}

Generate fitness product ideas from this persona's perspective using chain of thought reasoning. Follow these steps:

1. First, think about what this persona would value in fitness products based on their characteristics.

2. Generate a list of 10 fitness product ideas that align with this persona's needs and preferences (short titles only).

3. Review and refine ideas to make them bolder and more different - ensure that no two ideas are the same.

4. Consider how this persona would uniquely approach or modify each idea.

Return ONLY a JSON array with 10 objects, each with:

- "idea_number" (1-10)

- "idea_content" (one sentence description from this persona's perspective)

Return ONLY the JSON array, no other text or explanation.
```

The original De Freitas et al. (2025) CoT prompt, quoted in the same appendix:

```
Follow these steps. Do each step, even if you think you do not need to.

First, generate a list of 30 ideas (short title only).

Second, go through the list and determine whether the ideas are different and bold. Modify the ideas as needed to make them bolder and more different. No two ideas should be the same. This is important!

Next, give the ideas a name and combine each with a paper description. The name and idea are separated by a colon and followed by a description. The idea should be expressed as a paragraph of 40–80 words.

Do this step by step!
```

## Design consequence

The pipeline runs persona generation, then a CoT revision round, then brainwriting. It does not rely on CoT alone for spread, because the Gemini result shows CoT can narrow first-idea diversity. It uses personas for spread and CoT for depth.

## Citations

- Deng, Y., Brucks, M., Toubia, O. (2026). *A Cognitive Framework for Idea Diversity in Large Language Models.* arXiv:2602.20408v2. https://arxiv.org/abs/2602.20408
- Wei, J., et al. (2022). *Chain-of-Thought Prompting Elicits Reasoning in Large Language Models.* arXiv:2201.11903. https://arxiv.org/abs/2201.11903
- De Freitas, J., et al. (2025). Quoted in Deng et al. as the source of the original CoT prompt.
