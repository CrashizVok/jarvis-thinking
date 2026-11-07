# Sources

Every source below was opened during the build. The table records what the source says, which design decision it supports, and how strong the evidence is for that use. A source can support a mechanism without supporting the exact combination the plugin runs.

## Primary sources

| Source | Identifier | Supports | Evidence strength |
|---|---|---|---|
| Zhang et al., *Verbalized Sampling* | arXiv:2510.01171, https://arxiv.org/abs/2510.01171 | `candidateCount=5`, `probabilityThreshold=0.10`, the VS prompt, the tail requirement, VS-CoT, the claim that no logit access is needed | Strong for creative-writing diversity; moderate for other domains |
| Jiang et al., *Artificial Hivemind* | arXiv:2510.22954, https://arxiv.org/abs/2510.22954 | The trigger on open-ended work, consensus exclusion, duplicate filtering, cross-run novelty, the argument that decoding alone is insufficient | Strong descriptive evidence; the mitigation effect is not tested |
| Carichon et al., *IDEAFix* | arXiv:2606.00875, https://arxiv.org/abs/2606.00875 | The out-of-the-box cue, category negation, surprising and negative keyword branches, the choice of short prompts over complex methods | Moderate; automatic metrics, no human evaluation |
| Haase and Pokutta, *Structured Creativity Methods for Multi-Agent LLMs* | ICML 2026 workshop, https://genaicreativity.org/icml2026/files/7/7_paper.pdf | Three brainwriting rounds, the simulated default, the rejection of Disney and Double Diamond | Strong for the tested tasks; one generation per cell, LLM judges |
| Nguyen et al., *CreativeDC* | arXiv:2512.23601, https://arxiv.org/abs/2512.23601 | Divergence before convergence, the Vendi score, the separate convergent pass | Strong for educational task generation; one model, one domain |
| Deng, Brucks, Toubia, *A Cognitive Framework for Idea Diversity in LLMs* | arXiv:2602.20408, https://arxiv.org/abs/2602.20408 | `personaCount=3`, ordinary personas, the persona prompt, the CoT revision prompt, the fixation warning, the interaction between personas and CoT | Strong for fitness product ideation; category metrics, one main model |
| Shahhosseini et al., *LLMs for Scientific Idea Generation: A Creativity-Centered Survey* | arXiv:2511.07448, https://arxiv.org/abs/2511.07448 | Research-first as knowledge augmentation, the evaluation gap, the combinatorial/exploratory framing | Survey, not an experiment |
| Madaan et al., *Self-Refine* | arXiv:2303.17651, https://arxiv.org/abs/2303.17651 | The critique-and-repair step, the requirement for specific feedback, the diminishing returns of extra iterations | Strong for preference-style tasks; weak for math reasoning |
| Huang et al., *LLMs Cannot Self-Correct Reasoning Yet* | arXiv:2310.01798, https://arxiv.org/abs/2310.01798 | Critique ideas, not reasoning chains; no multi-agent debate by default; the equal-budget criticism | Strong counter-evidence |
| Yao et al., *Tree of Thoughts* | arXiv:2305.10601, https://arxiv.org/abs/2305.10601 | Shallow selection; the warning that search needs a reliable evaluator | Strong for Game of 24; not transferable to open-ended ideation |
| Zheng et al., *Judging LLM-as-a-Judge* | arXiv:2306.05685, https://arxiv.org/abs/2306.05685 | Two judges, randomized order, position and verbosity bias, the manual spot check | Strong for the biases; agreement depends on task |
| Sternlicht et al., *Old Ideas, Novel Problems* | arXiv:2610.02022, https://arxiv.org/abs/2610.02022 | Why the evaluation does not use a single novelty judge; the 52.6-point swing; tie rates; retrieval limits | Strong controlled study |
| Du et al., *Improving Factuality and Reasoning through Multiagent Debate* | arXiv:2305.14325, https://arxiv.org/abs/2305.14325 | The multi-agent option, the debate evidence, the cost warning | Moderate; equal-budget critique applies |
| Wang et al., *Self-Consistency* | arXiv:2203.11171, https://arxiv.org/abs/2203.11171 | Background for sampling several paths before aggregating | Strong for reasoning benchmarks; not a diversity method |
| Wei et al., *Chain-of-Thought Prompting* | arXiv:2201.11903, https://arxiv.org/abs/2201.11903 | Background for the CoT revision; the scale dependency | Strong for math reasoning; separate from idea revision |
| Nguyen et al., *Min-p Sampling* | arXiv:2407.01082, https://arxiv.org/abs/2407.01082 | Why the plugin does not control decoding; the prompt-level analogue | Strong for decoding; not usable from a prompt |

## Secondary and contextual sources

| Source | Used for |
|---|---|
| Ge et al., persona dataset, cited in Deng et al. | The ordinary-persona sampling cue |
| De Freitas et al. (2025), cited in Deng et al. | The original chain-of-thought revision prompt |
| RedPajama, cited in Zhang et al. | The pretraining-distribution proxy in the VS calibration experiment |
| Creative Writing v3 and HumorBench rubrics, cited in Zhang et al. | The quality judge rubrics in the VS paper |
| StrongReject, cited in Zhang et al. | The safety check in the VS paper |

## Claims that are not used

| Claim | Status | What the plugin does instead |
|---|---|---|
| "Creativity cues reduce fluency" | No primary source found | Uses the verified trade-off: surprising and negative keywords raise novelty and rarity while lowering diversity |
| Random stimulus improves novelty | Not tested in the IDEAFix experiment | Keeps it as an optional branch, marked `UNVERIFIED` |
| Opposite assumption improves novelty | Not tested in the IDEAFix experiment | Keeps it as an optional branch, marked `UNVERIFIED` |
| Extreme constraint improves novelty | Not tested in the IDEAFix experiment | Keeps it as an optional branch, marked `UNVERIFIED` |
| The full pipeline beats plain prompting | Not tested as a unit before this build | Reports the measured numbers in `docs/results.md` and the caveats |
| The dedup threshold 0.82 is optimal | No paper supplies it | Calibrated in `docs/results.md`; marked as an engineering default |
| A single LLM judge can score novelty reliably | Contradicted by Sternlicht et al. | Uses two judges, randomized order, and a manual spot-check protocol |
| Multi-agent debate is better than self-consistency at equal cost | Contradicted by Huang et al. | Does not run debate by default |

## Verification notes

- The seed arXiv identifiers all resolve. The ICML 2026 brainwriting paper is a workshop paper; its PDF is on the workshop site, not the main proceedings.
- The numbers in `research/` were taken from the arXiv HTML or the workshop PDF. Where a number could not be extracted, the file says so.
- The `research/` files quote prompt wording from the papers where the appendix or figure was available. The plugin's own prompts are marked as engineering constructs where they differ.
- The evaluation harness uses model-generated research briefs. They are not fact-checked. The research condition measures the effect of a research-shaped context, not retrieval quality.
