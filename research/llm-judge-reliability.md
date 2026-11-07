# LLM judge reliability

## What it is

Using an LLM to score or compare outputs. The plugin uses judges in two places: the evaluation harness, and the model's own convergence scores (which are not an external judge, but share the same risks).

## Mechanism and evidence

Two papers matter.

Zheng et al. (2023) test strong LLM judges against human preferences on MT-bench and Chatbot Arena. They find that GPT-4 can match human preferences at over 80% agreement, the same level as human–human agreement. They also document three biases:

- Position bias: judges favor the first answer. Most judges showed it; only GPT-4 was consistent in more than 60% of swapped-order cases.
- Verbosity bias: judges favor longer answers. All judges were vulnerable to a repetitive-list attack; GPT-4 defended better.
- Self-enhancement bias: the study could not determine it due to limited data.

Sternlicht et al. (2026) test novelty judges specifically, on human-authored and LLM-generated research ideas. Their findings are much less encouraging:

- Small prompt changes swung pairwise accuracy by more than 50 points. On Human+Generated, a reviewer-framed prompt versus a neutral prompt produced a 52.6-point gap; the judges disagreed on 55.8% of pairs.
- The same change helped one judge and hurt another.
- Lowering reasoning effort cost at most 7 points and was usually neutral. Retrieval gave at most 16 points, only for some models.
- Two purpose-built novelty evaluators were outperformed by the cheapest prompted baseline by 8 to 29 macro-F1 points, at up to 32× lower cost.
- Strong judges tied on 35% of pairs; weaker judges tied on more than half.
- An expert spot check of 30 hard pairs agreed with the human idea in all 30 and judged none of the generated ideas novel.

## Exact numbers

| Study | Finding |
|---|---|
| Zheng et al. 2023 | GPT-4 judge >80% agreement with humans; human–human agreement is the same level |
| Zheng et al. 2023 | GPT-4 consistency under order swap 65.0%; 77.5% with few-shot examples |
| Zheng et al. 2023 | 3K controlled expert votes, 3K crowdsourced votes |
| Sternlicht et al. 2026 | 52.6-point pairwise accuracy swing from one prompt change |
| Sternlicht et al. 2026 | 55.8% disagreement on identical pairs under the two prompts |
| Sternlicht et al. 2026 | 35%+ tie rate for a strong judge; >50% for a weaker one |
| Sternlicht et al. 2026 | Dedicated novelty judges 8–29 macro-F1 points behind the cheapest prompted baseline |

## Known limitations

- Both studies use specific models and tasks. The agreement rate is not a universal constant.
- The novelty-judge study uses ICLR submissions and one simple LLM generator. The generated-idea distribution may differ from the plugin's ideas.
- The expert spot check is 30 pairs, not a full validation.
- Judge prompts can encode the evaluator's taste. A rubric reduces but does not remove this.

## What the plugin does about it

- The evaluation harness uses at least two judge models from different families.
- It randomizes the order of compared outputs and reports ties.
- It blinds the judge to the condition name.
- It reports inter-judge agreement and a manual spot-check protocol.
- The convergence phase does not rely on an external judge. It uses an explicit four-dimension rubric and returns one or two winners, not a tournament.
- High-stakes claims are marked for human review.

## Citations

- Zheng, L., et al. (2023). *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena.* arXiv:2306.05685. https://arxiv.org/abs/2306.05685
- Sternlicht, N., et al. (2026). *Old Ideas, Novel Problems: The Instability of LLM-Based Novelty Evaluation.* arXiv:2610.02022. https://arxiv.org/abs/2610.02022
