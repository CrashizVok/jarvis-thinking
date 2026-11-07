# Self-consistency

## What it is

Sample several reasoning paths for the same problem, then take the majority final answer. It replaces greedy decoding in chain-of-thought prompting.

## Mechanism

A complex reasoning problem usually has several valid routes to one answer. If the routes disagree, the majority is more likely to be correct than any single route. The method marginalizes over the sampled paths.

## Experimental setup

| Item | Value |
|---|---|
| Models | PaLM 540B, GPT-3 175B, LaMDA 137B, UL2 20B |
| Benchmarks | GSM8K, SVAMP, AQuA, AddSub, MultiArith, ASDiv, StrategyQA, ARC-challenge, CSQA |
| Sampling | Temperature sampling, 40 samples in the main experiments |
| Aggregation | Unweighted majority vote (the best variant in Table 1) |
| Baselines | Greedy chain of thought, sample-and-rank, beam search |

## Exact numbers

PaLM 540B, greedy chain of thought versus self-consistency:

| Benchmark | Greedy CoT | Self-consistency | Gain |
|---|---|---|---|
| GSM8K | 56.5 | 74.4 | +17.9 |
| SVAMP | 79.0 | 86.6 | +7.6 |
| AQuA | 35.8 | 48.3 | +12.2 |
| StrategyQA | — | — | +6.4 |
| ARC-challenge | 85.2 | 88.7 | +3.9 |

The abstract reports GSM8K +17.9%, SVAMP +11.0%, AQuA +12.2%, StrategyQA +6.4%, ARC-challenge +3.9%. The SVAMP gain differs between the abstract and the PaLM 540B row of Table 1 (+7.6). The abstract aggregates across models; the table row is PaLM 540B. Cite the abstract for the headline and the table for the PaLM 540B row, and do not present the two as the same number.

## Known limitations and conflicting results

- The method needs multiple samples, so the cost is a multiple of a single chain.
- It helps when the reasoning paths converge on the same answer. On open-ended tasks there is no single answer to vote on.
- The weighted aggregation variants were much worse than the unweighted majority in Table 1.
- A majority can be confidently wrong. The method improves accuracy, not correctness guarantees.
- Huang et al. (2024) show that multi-agent debate is not better than self-consistency when compared at an equal number of responses. That is a critique of debate, not of self-consistency.

## Relevance to the plugin

Self-consistency is the accuracy-side analogue of divergence: sample several paths, then aggregate. The plugin borrows the shape but not the vote. Ideas do not have a correct answer, so the aggregation step is a scored selection, not a majority.

## Citations

- Wang, X., Wei, J., Schuurmans, D., Le, Q., Chi, E., Narang, S., Chowdhery, A., Zhou, D. (2022). *Self-Consistency Improves Chain of Thought Reasoning in Language Models.* arXiv:2203.11171. https://arxiv.org/abs/2203.11171
- Huang, J., et al. (2024). *Large Language Models Cannot Self-Correct Reasoning Yet.* arXiv:2310.01798. https://arxiv.org/abs/2310.01798
