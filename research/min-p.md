# Min-p sampling

## What it is

A decoding method. At each token step, keep tokens whose probability is at least `min_p × p_top`, where `p_top` is the probability of the most likely token. The threshold adapts to model confidence.

## Mechanism

When the model is confident, `p_top` is high and the threshold cuts aggressively. When the model is uncertain, `p_top` is low and more tokens survive. The claimed result is better coherence at high temperature than top-p, with comparable or better diversity.

## Experimental setup

| Item | Value |
|---|---|
| Benchmarks | GPQA, GSM8K, AlpacaEval Creative Writing |
| Models | Mistral and Llama 3 families |
| Sizes | 1B to 123B parameters |
| Baselines | Top-p, top-k, eta-sampling, temperature scaling |
| Human evaluation | Preference for quality and creativity |

## Exact numbers

The abstract reports that min-p improves quality and diversity across model families and sizes, especially at higher temperatures, and that human evaluators preferred it for quality and creativity. The abstract does not give a single headline effect size. Do not invent one.

The Artificial Hivemind study tested min-p directly:

| Setting | Result |
|---|---|
| top-p 1.0, min-p 0.1, temperature 2.0 | 81% of response pairs above 0.7 similarity; 61.2% above 0.8 |
| top-p 0.9, temperature 1.0 (baseline) | 79% of cases above 0.8 average pairwise similarity |

Min-p reduced extreme repetition (fewer pairs above 0.9) but did not remove mode collapse.

## Known limitations and conflicting results

- Decoding-level. A cloud model behind an API may not expose min-p, top-p, temperature, or logits. The plugin cannot set it reliably.
- The Hivemind result shows that even a diversity-oriented decoder leaves most pairs above 0.8 similarity on open-ended queries.
- The method is better suited to creative tasks and less effective on close-ended ones, according to the Hivemind authors.
- Its benefit depends on the model and the temperature. It is not a universal fix.

## Prompt-level analogue

The plugin cannot change decoding. It uses the closest prompt-level analogue: verbalized sampling with a probability ceiling. The Verbalized Sampling paper's diversity-tuning ablation uses a threshold `p` and finds diversity rises as the ceiling falls. That is not the same mechanism as min-p, but it is the same idea of forcing the tail into the output.

The VS paper also tests VS under different top-p values and reports that VS is orthogonal to decoding settings and improves the diversity-quality Pareto front under each.

## Design consequence

The plugin does not set temperature or top-p. It does not claim decoding control. It uses verbalized sampling and tail quotas. If a user can set min-p in their provider, the plugin's prompt-level method composes with it, but the plugin does not depend on it.

## Citations

- Nguyen, M. N., Baker, A., Neo, C., Roush, A., Kirsch, A., Shwartz-Ziv, R. (2024). *Min-p Sampling for High-Quality and Diverse Text Generation.* arXiv:2407.01082. https://arxiv.org/abs/2407.01082
- Jiang, L., et al. (2025). *Artificial Hivemind.* arXiv:2510.22954. https://arxiv.org/abs/2510.22954
- Zhang, J., et al. (2026). *Verbalized Sampling.* arXiv:2510.01171. https://arxiv.org/abs/2510.01171
