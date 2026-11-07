# Explicit out-of-the-box instruction

## What it is

A short prompt that tells the model to go beyond obvious answers and beyond frequently used categories. It is not a creativity framework. It is an explicit divergence cue.

## Mechanism

The IDEAFix experiment compared 25 prompts grounded in six creativity methods plus two controls and four AI-specific strategies. The complex method prompts (C-K theory, TRIZ, Design Thinking, Prospective scenarios, SCAMPER, Brainstorming variants) did not consistently beat simple prompts with explicit divergence cues.

The authors' hypothesis: novelty is driven by explicit instructions to "think outside the box" or by keywords such as "wild" or "unconventional", and by the explicit request to go beyond frequently used categories. The structure of the creativity method adds cost without adding novelty.

This is a defixation mechanism. Fixation is the tendency to stay in a familiar solution space. A short cue that names the boundary and asks the model to cross it is enough to move some outputs.

## Experimental setup

| Item | Value |
|---|---|
| Briefs | 81: 26 products, 15 services, 26 strategies, 14 procedures |
| Attributes | 6 variants per brief: traditional, atypical, surprising; positive and negative valence; plus a no-attribute control |
| Conditions | 567 (81 briefs × 7) |
| Prompts | 25: 2 controls, 3 brainstorming, 4 C-K, 4 TRIZ, 4 Design Thinking, 3 prospective scenarios, 1 SCAMPER, 4 AI-specific |
| Input prompts | 14,350 |
| Models | Llama-3.1-70B-Instruct, Qwen3-30B-A3B-Instruct-2507, Gemini-2.5-Flash, GPT-4o, Grok-4.1-fast-reasoning |
| Temperature | 0.7 for Qwen and Grok, 1.0 for the rest |
| Max tokens | 8192 |
| Repeats | 3 independent runs per model |
| Metrics | Fluency (number of ideas), Diversity (mean pairwise embedding distance), Novelty (distance from control-generated ideas), Rarity (distance from all ideas for the task), Overlap, Perplexity |
| Statistics | t-tests; exact effect sizes for the prompt comparison are in the paper's appendix tables |

## Exact numbers

- All method-inspired prompts outperformed the control prompts, and the differences were statistically significant according to t-tests (Table 9 in the appendix).
- No single method maximized fluency, novelty, rarity, and diversity at the same time.
- The two AI-specific prompts and the third brainstorming variant scored significantly higher on both novelty metrics.
- The top-five ideas on novelty and rarity were highest for brainstorming and the AI-specific prompts, with the largest percentage increase over the average.
- TRIZ came close to or exceeded those scores on the novelty metric relative to the baseline.
- Simple prompts with explicit cues tended to outperform complex method-based prompts.
- Despite individual gains, output homogenization across models persisted. The paper's Figure 5 shows models clustering in the same semantic space and sharing digital/technology-oriented keywords.

The paper does not report a single headline effect size for the out-of-the-box prompt in the main text. The exact per-prompt values are in its appendix tables, which were not part of the HTML extraction. Do not cite a percentage that is not in the paper.

## Known limitations and conflicting results

- The study is non-iterative. Many creativity methods are meant to be applied over several guided steps; this experiment applies them in one prompt.
- Metrics are automatic embedding distances. The authors call them approximations of structural divergence, not full creativity measures.
- The study did not include human evaluation.
- The homogenization result is the important counterweight: a cue can raise an individual idea's novelty while the pool stays inside the same shared space.
- The paper's strongest claim is comparative: simple cues beat complex methods. It is not a claim that cues solve mode collapse.

## Prompt wording that produced the best results

Control prompt, from Figure 2:

```
Generate as many diverse and creative solutions as possible to address the following design challenge: [Brief context].
Instructions:
List all the solutions you find as a list.
Each solution is composed of a maximum of two sentences enabling to understand the general concept behind the solution.
All solutions should be written in English.
The solutions are:
```

Defixation prompt, from Figure 2:

```
Invent as many different and imaginative responses as possible to the following situation: [Brief context]. Go beyond obvious answers — include wild, futuristic, or playful directions that might open new ways of thinking.
Instructions:
List all the solutions you find as a list.
Each solution is composed of a maximum of two sentences enabling to understand the general concept behind the solution.
All solutions should be written in English.
The solutions are:
```

Category negation, described in §3.3:

> This strategies are oriented around category negation, where the principle is that novelty for AI can emerge by forcing models to not explore its simplest exploratory path (e.g., generating conventional ideas) by adding simple constraints (e.g., asking LLMs to generate ideas, categorize them, and then generate new ideas outside of those categories).

## Design consequence

The pipeline uses a short out-of-the-box branch and a category-negation branch. It does not wrap the prompt in a named creativity framework. It keeps the cue to one or two sentences.

## Citations

- Carichon, F., Sharma, S., Girard, M., Rampa, R., Farnadi, G. (2026). *IDEAFix: Evaluation Framework for Creative Defixation Prompting in LLMs.* arXiv:2606.00875. https://arxiv.org/abs/2606.00875
