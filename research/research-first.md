# Research first

## What it is

Do a source search before generating ideas. Collect the current state of the art, documented failures, and the strongest opposing view, then use that material as the starting context for ideation.

## Mechanism

The survey of LLM scientific idea generation groups methods into five families: knowledge and retrieval augmentation, prompt-based distributional steering, inference-time search, multi-agent collaboration, and parameter adaptation. Knowledge augmentation is the family that changes the model's input with external material. It grounds claims and supplies new combinations that the model's training prior does not contain.

The Artificial Hivemind study supplies the reason this matters. Across 25 models and 100 real open-ended queries, responses from different models had average pairwise sentence-embedding similarity between 71% and 82%. DeepSeek-V3 and qwen-max-2025-01-25 reached 0.82; DeepSeek-V3 and gpt-4o-2024-11-20 reached 0.81. The authors argue that model ensembles cannot produce true diversity when the constituents share training and alignment priors. A fresh source is one input that is not shared by every model.

This is a design inference, not a measured effect. No paper in this set isolates "web search before ideation" and reports a novelty gain against a no-search control. The direct effect size is `UNVERIFIED`.

## Experimental setup

The survey is a structured synthesis, not an experiment. It organizes existing methods and evaluates their expected creativity level using Boden's taxonomy (combinatorial, exploratory, transformational) and Rhodes' 4Ps (person, process, press, product).

The Hivemind experiment:

| Item | Value |
|---|---|
| Dataset | Infinity-Chat, 26,070 open-ended queries mined from WildChat |
| Query subset | Infinity-Chat100, 100 human-verified open-ended queries |
| Models | 70+ total, 25 detailed in the main paper |
| Samples | 50 responses per query per model |
| Decoding | top-p 0.9, temperature 1.0; min-p run at top-p 1.0, min-p 0.1, temperature 2.0 |
| Embeddings | OpenAI text-embedding-3-small |
| Human annotations | 31,250 ratings, 25 annotators per example |

## Exact numbers

From Jiang et al. 2025, §3 and Figure 4:

- In 79% of cases, the average pairwise similarity among responses from the same model exceeded 0.8.
- Under min-p decoding, 81% of response pairs still exceeded 0.7 similarity and 61.2% exceeded 0.8.
- Average pairwise similarity between responses from different models ranged from 71% to 82%.
- For the top 50 most similar responses per query, an average of about 8 unique models contributed, with some queries above 10.

From the survey, no effect size is reported for knowledge augmentation as a novelty intervention. The survey states that current methods tend to remain at the combinatorial or exploratory level, and that transformational creativity remains elusive.

## Known limitations and conflicting results

- Shared training data is not the only cause of homogeneity. The Hivemind authors explicitly say their study does not establish the mechanism, listing pretraining data, alignment, memorization, contamination, and generalization as candidates.
- Research can anchor as easily as it can liberate. Reading the same five popular sources as every competitor produces the same consensus.
- The survey notes that evaluation of scientific ideas lacks standardized metrics, so a "more novel" claim from a research-first pipeline is hard to compare across studies.
- Search results can be wrong, stale, or paywalled. A source is not evidence until it is read.

## Prompt wording that produced the best results

No paper in this set reports a prompt for research-first ideation. The prompt in `skills/jarvis-research/SKILL.md` is an engineering construct. It asks for state of the art, documented failures, and the strongest criticism, and it requires a title, URL, date, and one claim per source.

## Design consequence

The pipeline runs research before the consensus baseline. If search is unavailable, it says so and marks claims `UNVERIFIED`. It does not treat research as a guarantee of novelty; it treats it as a way to change the raw material.

## Citations

- Shahhosseini, F., Marioriyad, A., Momen, A., Soleymani Baghshah, M., Rohban, M. H., Haghjooy Javanmard, S. (2026). *Large Language Models for Scientific Idea Generation: A Creativity-Centered Survey.* arXiv:2511.07448. https://arxiv.org/abs/2511.07448
- Jiang, L., Chai, Y., Li, M., Liu, M., Fok, R., Dziri, N., Tsvetkov, Y., Sap, M., Albalak, A., Choi, Y. (2025). *Artificial Hivemind: The Open-Ended Homogeneity of Language Models (and Beyond).* arXiv:2510.22954. https://arxiv.org/abs/2510.22954
