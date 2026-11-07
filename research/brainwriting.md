# Brainwriting rounds

## What it is

A structured group ideation method adapted to LLMs. Four roles run in sequence: Bold Inventor, Builder, Lateral Thinker, Synthesizer. The first three are divergent; the last is convergent. The pattern is D-D-D-C.

The key mechanism is iterative building. Each later role receives the accumulated output of all earlier roles. The Builder must add to a named prior idea. The Lateral Thinker must combine, invert, or push an idea to an extreme.

## Mechanism

Human brainwriting reduces production blocking and social loafing by having participants write ideas and pass them on. The proposed LLM analogue is associative chaining: a later role sees earlier ideas and generates combinations that a single pass would not reach.

The ICML 2026 comparison tested this against two other structured methods:

- Disney Method: Dreamer, Realist, Critic, Observer. Pattern D-C-C-C, convergence-heavy.
- Double Diamond: Discover, Define, Develop, Deliver. Pattern D-C-D-C, balanced alternation.

The paper's conclusion is that process structure matters more than agent architecture. The multi-agent configuration was slightly better than a single LLM simulating all roles, but the difference was not significant.

## Experimental setup

| Item | Value |
|---|---|
| Conditions | 8: baseline, baseline repeated twice, Brainwriting multi-agent, Brainwriting simulated, Disney multi-agent, Disney simulated, Double Diamond multi-agent, Double Diamond simulated |
| Generators | Claude Haiku 4.5, Claude Opus 4.6, GPT-5.4 |
| Tasks | 5 applied creative briefs: birthday party, comedy movie treatment, dinosaur presentation, book-reading app, vacuum cleaner marketing |
| Judges | Claude Haiku 4.5, Claude Opus 4.6, GPT-5.4, Gemini 2.5 Pro, Gemini 3.1 Pro Preview |
| Ratings | 600 total, 5 per run |
| Analysis unit | per-run mean, n=15 per method (3 models × 5 tasks) |
| Generation runs | one per method × model × task cell |
| Rubric | seven task-specific criteria, then two aggregate scores on 0–5: originality and usefulness |
| Statistics | Welch's t-tests; Bonferroni correction for seven method-vs-baseline comparisons, α=.007; Mann-Whitney U agrees |

## Exact numbers

Originality, 0–5:

| Method | Mean ± SD | Gain vs baseline | Effect |
|---|---|---|---|
| Brainwriting multi-agent | 4.29 ± 0.43 | +0.85 | t(22)=5.53, p<.001, d=2.0 |
| Brainwriting simulated | 4.05 ± 0.53 | +0.60 | t(27)=3.50, p<.001, d=1.3 |
| Disney simulated | 3.67 ± 0.69 | +0.23 | d=0.45, p=.22 |
| Double Diamond multi-agent | 3.66 ± 0.69 | +0.22 | d=0.40, p=.27 |
| Disney multi-agent | 3.54 ± 0.76 | +0.10 | d=0.18, p=.62 |
| Baseline repeated twice | 3.53 ± 0.72 | +0.09 | d=0.17, p=.64 |
| Double Diamond simulated | 3.49 ± 0.70 | +0.05 | d=0.10, p=.79 |
| Baseline | 3.44 ± 0.71 | — | — |

Per-model Brainwriting gain: Claude Haiku 4.5 +0.93 (3.31 → 4.24), Claude Opus 4.6 +0.79 (3.78 → 4.57), GPT-5.4 +0.82 (3.25 → 4.07). Brainwriting multi-agent scored higher than baseline in all 15 pairwise comparisons (3 models × 5 judges).

Multi-agent versus simulated: +0.25, d=0.69, p=.057. The paper calls this "real but modest added value" that did not meet the pre-specified threshold. The simulated version captured about 70% of the multi-agent gain (0.60 / 0.85 = 70.6%).

Usefulness: no significant difference across conditions in any configuration.

## Known limitations and conflicting results

- One generation run per cell. All reported variance is evaluator disagreement, not generative sampling variance. The authors state this explicitly.
- The judges are LLMs. The originality metric is LLM-judged originality, and the paper on novelty judges shows that LLM novelty judgments are unstable under small prompt changes.
- Five tasks, all applied creative briefs. No scientific or strategic ideation.
- The multi-agent advantage is not significant. A single-LLM simulation is a reasonable default.
- Disney and Double Diamond did not produce significant gains. A complex method is not automatically better.
- The paper's prompts are in its appendix, which was not available in the public PDF used for this analysis. The role prompts in `skills/jarvis-brainwriting/SKILL.md` are derived from the role descriptions in the main text, not quoted from the appendix.

## Prompt wording that produced the best results

The paper describes the prompt structure for each phase as:

1. a system instruction defining the agent's role,
2. the creative brief, identical across conditions,
3. for non-initial phases, the accumulated output of all prior phases.

The multi-agent runs pass only prior phases' output, not other agents' instructions. The simulated runs put all four role descriptions in one prompt and instruct the model to produce output for each phase sequentially.

The paper does not reproduce the full role prompts in the main text. The closest direct quote is the role description:

> Brainwriting adapts the classical brainwriting mechanism through sequential building on accumulated prior output and differentiated role assignment: Bold Inventor (generates fresh, creative initial ideas), Builder (expands and elaborates on prior ideas, adding new angles), Lateral Thinker (finds unexpected connections and pushes ideas in surprising directions), and Synthesizer (combines and refines all ideas into a coherent, polished proposal).

## Design consequence

The pipeline runs three divergent rounds plus a synthesis. It defaults to the simulated mode because the multi-agent advantage was not significant and the cost is lower. It allows `multi-agent` as a configuration option for high-value tasks.

## Citations

- Haase, J., Pokutta, S. (2026). *Structured Creativity Methods for Multi-Agent LLMs: Brainwriting Outperforms Disney and Double Diamond on LLM-Judged Originality.* ICML 2026 Workshop on Human-AI Co-Creativity. https://genaicreativity.org/icml2026/files/7/7_paper.pdf
- Sternlicht, N., et al. (2026). *Old Ideas, Novel Problems: The Instability of LLM-Based Novelty Evaluation.* arXiv:2610.02022. https://arxiv.org/abs/2610.02022
