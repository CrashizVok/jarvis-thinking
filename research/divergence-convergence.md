# Divergence before convergence

## What it is

Split ideation into two passes. Pass one produces candidates without judging them. Pass two selects, combines, and kills. The passes are separate in time and in the output.

## Mechanism

Direct prompting commits to a single region of the idea space early. CreativeDC's authors describe the failure as premature convergence: the model settles on an idea that satisfies the technical requirements but offers little variety. Separating exploration from evaluation lets the model traverse a broader space before constraints prune it.

The brainwriting result points at the same mechanism from a different angle. The method that front-loads divergence (three divergent roles, one convergent role) produced a significant originality gain. The two methods with more convergent phases (Disney is D-C-C-C; Double Diamond alternates D-C-D-C) did not. The paper's conclusion is that process structure, not agent count, drives the gain.

## Experimental setup: CreativeDC

| Item | Value |
|---|---|
| Task | Generate Python programming tasks from a theme and a concept |
| Contexts | 20, from 4 themes × 5 concepts |
| Tasks per context | K from 10 to 50 |
| Model | Qwen3-235B-A22B |
| Temperature | 1.0 |
| Baselines | Base (direct), CoT ("Think step by step") |
| Diversity metric | Vendi Score on Qwen3-Embedding-0.6B embeddings |
| Utility judge | Gemini 2.5 Flash-Lite, different family from the generator |
| Expert study | 3 programming-education experts, 66 tasks each, 20 pairwise novelty comparisons each |

## Exact numbers: CreativeDC

At K=50:

- CreativeDC: about 13 distinct tasks across all tasks, about 12 when restricted to high-utility tasks.
- CoT and Base: about 8 distinct high-utility tasks each.
- The paper reports about 1.6× more distinct high-utility tasks overall.
- CreativeDC significantly outperformed both baselines at every K (p<0.001, Bonferroni-corrected paired Wilcoxon signed-rank tests). CoT and Base were statistically indistinguishable.

Expert evaluation:

- About 16 clusters at K=50 for CreativeDC versus about 9 for CoT, restricted to high-utility tasks.
- CreativeDC preferred in 96.67% of pairwise novelty comparisons.
- Interestingness 0.81 versus 0.50 on the mapped 0-to-1 scale.
- The three experts evaluated different themes, so inter-rater agreement is not applicable.

## Experimental setup: brainwriting

| Item | Value |
|---|---|
| Conditions | 8: baseline, baseline repeated twice, Brainwriting M/S, Disney M/S, Double Diamond M/S |
| Generators | Claude Haiku 4.5, Claude Opus 4.6, GPT-5.4 |
| Tasks | 5 applied creative briefs |
| Judges | Claude Haiku 4.5, Claude Opus 4.6, GPT-5.4, Gemini 2.5 Pro, Gemini 3.1 Pro Preview |
| Ratings | 600 total, 5 per run |
| Analysis unit | per-run mean, n=15 per method |
| Generation runs | one per method × model × task cell |

## Exact numbers: brainwriting

Originality on a 0-to-5 judge scale:

| Method | Mean ± SD | Gain vs baseline | Test |
|---|---|---|---|
| Brainwriting multi-agent | 4.29 ± 0.43 | +0.85 | t(22)=5.53, p<.001, d=2.0 |
| Brainwriting simulated | 4.05 ± 0.53 | +0.60 | t(27)=3.50, p<.001, d=1.3 |
| Disney multi-agent | 3.54 ± 0.76 | +0.10 | d=0.18, p=.62 |
| Double Diamond multi-agent | 3.66 ± 0.69 | +0.22 | d=0.40, p=.27 |
| Double Diamond simulated | 3.49 ± 0.70 | +0.05 | d=0.10, p=.79 |
| Baseline repeated twice | 3.53 ± 0.72 | +0.09 | d=0.17, p=.64 |
| Baseline | 3.44 ± 0.71 | — | — |

Usefulness did not differ significantly across conditions. The multi-agent advantage over the simulated version was +0.25, d=0.69, p=.057, so it did not meet the pre-specified significance threshold.

## Known limitations and conflicting results

- CreativeDC used one model and introductory Python tasks. The authors list domain generalizability as future work.
- The expert sample was three people, and each evaluated a different theme.
- The brainwriting study generated one output per cell. All reported variance is judge disagreement, not sampling variance. The authors say this explicitly.
- Brainwriting's judges were LLMs, not humans. The paper's originality metric is LLM-judged originality.
- The two-stage form can still converge if the divergent list is short. A quota is needed.

## Prompt wording that produced the best results

CreativeDC, from Table 1 of the paper:

```
Apply the following thinking process to generate a problem.

Divergent thinking phase: Think about only the given theme and list down wildly
different and underexplored elements, objects, scenarios, or situations that are
relevant. Ignore the required programming concepts in this phase. Push for
unusual, surprising, unconventional, and diverse ideas. Explore the creative
space related to the theme as much as possible.

Convergent thinking phase: From your brainstormed ideas, select one and connect
it with the required programming concepts to create a creative programming
problem. Make sure the problem does not require any other programming concepts
other than the given programming concepts. If it does not work, feel free to go
back to select another idea and try again.
```

## Design consequence

The pipeline has a divergence phase and a separate convergence phase. It runs three divergent brainwriting rounds before any scoring. It does not run Disney or Double Diamond, because neither produced a significant originality gain in the tested configuration.

## Citations

- Nguyen, M. H., Tschiatschek, S., Singla, A. (2026). *Enhancing Diversity of LLM-Generated Educational Tasks.* arXiv:2512.23601. https://arxiv.org/abs/2512.23601
- Haase, J., Pokutta, S. (2026). *Structured Creativity Methods for Multi-Agent LLMs: Brainwriting Outperforms Disney and Double Diamond on LLM-Judged Originality.* ICML 2026 Workshop on Human-AI Co-Creativity. https://genaicreativity.org/icml2026/files/7/7_paper.pdf
