# Research index

Every file below records one technique, the experiment behind it, the numbers that survived verification, the failure modes, and the prompt wording that produced the reported result. Numbers marked `UNVERIFIED` were not found in a primary source and are not used to set a default.

## Seed sources

| Technique | File | Primary source |
|---|---|---|
| Research first | [research-first.md](research-first.md) | Shahhosseini et al., arXiv 2511.07448; Jiang et al., arXiv 2510.22954 |
| Divergence before convergence | [divergence-convergence.md](divergence-convergence.md) | Nguyen et al., arXiv 2512.23601 |
| Verbalized sampling | [verbalized-sampling.md](verbalized-sampling.md) | Zhang et al., arXiv 2510.01171 |
| Multiple personas | [personas.md](personas.md) | Deng et al., arXiv 2602.20408 |
| Personas plus chain of thought | [cot-personas.md](cot-personas.md) | Deng et al., arXiv 2602.20408 |
| Brainwriting rounds | [brainwriting.md](brainwriting.md) | Haase and Pokutta, ICML 2026 workshop |
| Explicit out-of-the-box instruction | [out-of-box.md](out-of-box.md) | Carichon et al., arXiv 2606.00875 |
| Surprising and negative keywords | [keywords-stimuli.md](keywords-stimuli.md) | Carichon et al., arXiv 2606.00875 |
| Consensus exclusion | [consensus-exclusion.md](consensus-exclusion.md) | Jiang et al., arXiv 2510.22954; Carichon et al., arXiv 2606.00875 |
| Duplicate filtering | [dedup.md](dedup.md) | Engineering; similarity metric from Zhang et al., arXiv 2510.01171 |
| Difference justification | [difference-justification.md](difference-justification.md) | Deng et al., arXiv 2602.20408; Carichon et al., arXiv 2606.00875 |
| Self-critique | [self-critique.md](self-critique.md) | Madaan et al., arXiv 2303.17651; Huang et al., arXiv 2310.01798 |
| Selection | [selection.md](selection.md) | Yao et al., arXiv 2305.10601; Zheng et al., arXiv 2306.05685; Sternlicht et al., arXiv 2610.02022 |
| Persistence | [persistence.md](persistence.md) | Engineering; evaluation gap from Shahhosseini et al., arXiv 2511.07448 |

## Supplementary papers

| Topic | File | Why it matters |
|---|---|---|
| Self-consistency | [self-consistency.md](self-consistency.md) | Sampling several reasoning paths and voting. The accuracy-side analogue of divergence. |
| Tree of Thoughts | [tree-of-thoughts.md](tree-of-thoughts.md) | Search over candidates with an evaluator. The cost and evaluator risk are why the pipeline selects shallowly. |
| Self-Refine | [self-refine.md](self-refine.md) | The strongest evidence that specific feedback improves output, and the limits of generic feedback. |
| Multi-agent debate | [multi-agent-debate.md](multi-agent-debate.md) | Evidence for critique between agents, plus the equal-budget criticism. |
| LLM judge reliability | [llm-judge-reliability.md](llm-judge-reliability.md) | Why the evaluation harness uses several judges, random order, and a manual spot check. |
| Min-p sampling | [min-p.md](min-p.md) | Decoding-level diversity. Not usable from a prompt, but its failure under the Hivemind test is relevant. |
| Diversity metrics | [diversity-metrics.md](diversity-metrics.md) | Embedding cosine, Vendi score, category metrics, and novelty against a consensus set. |

## Verification notes

- All seed arXiv identifiers resolve to real papers as of 2026-11-07.
- The ICML 2026 brainwriting paper is a workshop paper, not a main-conference paper. Its abstract page is on the workshop site, not the ICML proceedings.
- No paper in this set tests the exact combination this plugin runs. The pipeline is a design built from separate findings. Combinations are marked as derived, not validated.
- The phrase "creativity cues reduce fluency" did not resolve to a primary source. The verified finding is that surprising and negative keywords raise novelty and rarity while lowering diversity. The plugin uses that trade-off instead of the unverified fluency claim.
