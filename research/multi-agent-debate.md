# Multi-agent debate

## What it is

Several model instances answer the same question, then read each other's answers and revise over several rounds. The final answer is the converged response.

## Mechanism

Each agent verifies the others' reasoning and refines its own. The paper argues that this reduces hallucinations and improves reasoning because inconsistent facts get challenged. The procedure uses black-box access only: no logits or gradients.

## Experimental setup

| Item | Value |
|---|---|
| Model | ChatGPT-based model |
| Agents | 3 in the main experiments |
| Rounds | 2 in the main experiments |
| Tasks | Arithmetic expression evaluation, GSM8K, chess move prediction |
| Factual tasks | Biographies of 524 computer scientists, MMLU |
| Baselines | Single agent, single agent with reflection, multi-agent majority vote |
| Prompting | Zero-shot; also combined with zero-shot chain of thought |

## Exact numbers

Table 1:

| Method | Arithmetic (%) | GSM8K (%) | Chess (Δ pawn score) |
|---|---|---|---|
| Single agent | 67.0 ± 4.7 | 77.0 ± 4.2 | 91.4 ± 10.6 |
| Single agent + reflection | 72.1 ± 4.5 | 75.0 ± 4.3 | 102.1 ± 11.9 |
| Multi-agent majority | 69.0 ± 4.6 | 81.0 ± 3.9 | 102.2 ± 6.2 |
| Multi-agent debate | 81.8 ± 2.3 | 85.0 ± 3.5 | 122.9 ± 7.6 |

The paper reports further gains with more agents and more rounds (Figure 10). On factual tasks, debate improved accuracy and consistency; reflection-based approaches performed poorly. The biography benchmark is 524 well-known computer scientists.

## Known limitations and conflicting results

- Cost: multiple agents and rounds multiply the number of calls.
- Huang et al. (2024) compare debate with self-consistency at an equal number of responses. Debate is only slightly better than self-consistency with the same number of agents, and significantly worse than self-consistency with an equal number of responses. The apparent gain is partly a compute gain.
- Debate can converge on a shared error. The paper shows cases where all agents start wrong and debate recovers, but the opposite is also possible.
- The evaluation uses the same model family for agents and judges in several places. Self-preference bias is a risk.
- The tasks have checkable answers. Open-ended ideation has no equivalent ground truth.

## Relevance to the plugin

The pipeline does not run a debate by default. It uses a single critique pass with an explicit rubric. Multi-agent brainwriting is available as an option, because the brainwriting paper tested it directly and found a small, non-significant advantage over a single-LLM simulation.

## Citations

- Du, Y., Li, S., Torralba, A., Tenenbaum, J. B., Mordatch, I. (2023). *Improving Factuality and Reasoning in Language Models through Multiagent Debate.* arXiv:2305.14325. https://arxiv.org/abs/2305.14325
- Huang, J., et al. (2024). *Large Language Models Cannot Self-Correct Reasoning Yet.* arXiv:2310.01798. https://arxiv.org/abs/2310.01798
