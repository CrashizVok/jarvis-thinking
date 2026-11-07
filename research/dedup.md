# Duplicate filtering against ideas.md

## What it is

Before critique, compare every candidate with every stored idea and with the other candidates. Drop semantic duplicates, keep the nearest match and the score, and record the drop in the rejected list.

## Mechanism

There is no controlled experiment on duplicate thresholds for LLM ideation. This file documents an engineering choice. The similarity metric is borrowed from the diversity literature, where mean pairwise cosine similarity of sentence embeddings is the standard measure.

The Verbalized Sampling paper computes diversity as 1 − mean pairwise cosine similarity of text-embedding-3-small embeddings, with negative similarities clipped to 0. The Artificial Hivemind paper uses the same embedding family and reports that average pairwise similarity above 0.8 indicates heavy repetition. Those uses are descriptive. They do not establish a duplicate threshold.

## What the plugin does

Three signals, blended:

| Signal | What it catches | Weight |
|---|---|---|
| IDF-weighted token cosine | Shared content words, down-weighted when common in the corpus | 0.60 |
| Character 4-gram Jaccard | Inflection, small edits, word-order changes | 0.25 |
| Concept signature Jaccard | Same idea with different nouns, when the model writes a good signature | 0.15 |

If an embedding endpoint is configured, the score becomes 0.65 × embedding cosine + 0.35 × the lexical blend. The lexical path remains a tie-breaker.

The default threshold is 0.82. It is an engineering default, calibrated in `docs/results.md`, not a research constant.

## Why not a single method

- Exact string match misses paraphrases. It is only useful for exact repeats.
- Levenshtein distance is sensitive to length and word order. Two long ideas that share a concept can score as distant.
- Pure TF-IDF misses synonymy ("night shift nurse" versus "nurse who works nights").
- Pure embeddings can collapse distinct ideas that share a topic, and they need a network call and a key.
- An LLM judge per pair is expensive and unstable. The novelty-judge study shows large swings from small prompt changes.

The hybrid is cheap, deterministic, and works offline. The optional embedding path adds semantic recall when a key is available.

## Threshold calibration

No paper supplies a threshold for this exact blend. The evaluation harness measures duplicate rate and false positives on a small labelled set of paraphrase pairs and distinct pairs. The default is chosen from that sweep. The exact sweep and the chosen value are reported in `docs/results.md`. If the sweep is missing, the default is `UNVERIFIED` as a research claim and stands only as an engineering default.

## Known limitations and failure modes

- Synonymy: "subscription coaching" and "membership advising" may not share tokens. The signature field is the mitigation.
- Negation: "a cup that keeps coffee hot" and "a cup that lets coffee cool" share most tokens. The signature should include the mechanism, but the model may not.
- Numbers and units: "10x cheaper" and "100x cheaper" share tokens. The score treats them as similar. That is usually correct for dedup, but not always.
- Short ideas: a five-word idea has few tokens and few character n-grams. Scores are noisier.
- Domain terms: a rare term gets a high IDF weight, which can make two ideas look more similar than they are.
- The ideas file grows. IDF changes as the corpus grows, so the same pair can score slightly differently over time.

## What counts as a duplicate

- Exact duplicate: drop the later one.
- Same mechanism, different audience: keep only if the audience change changes the first test.
- Same idea, better evidence: keep the better-evidenced one and merge the source.
- Same idea in a different category: a false negative. Keep it and make the mechanism explicit in the signature.

## Citations

- Zhang, J., et al. (2026). *Verbalized Sampling.* arXiv:2510.01171. https://arxiv.org/abs/2510.01171
- Jiang, L., et al. (2025). *Artificial Hivemind.* arXiv:2510.22954. https://arxiv.org/abs/2510.22954
- Sternlicht, N., et al. (2026). *Old Ideas, Novel Problems: The Instability of LLM-Based Novelty Evaluation.* arXiv:2610.02022. https://arxiv.org/abs/2610.02022
