---
name: Jarvis verbalized sampling
description: Verbalized-sampling phase of the jarvis pipeline. Ask for several candidates with explicit probabilities, including a forced tail below the probability threshold.
---

# Verbalized sampling

Use this during divergent generation. It replaces "give me one answer" with "give me a distribution of answers and say how likely each one is".

## Exact prompt

This wording is taken from the Verbalized Sampling paper, Appendix G.3:

```
Generate {{candidateCount}} responses to the input prompt.

Return the responses in JSON format with the key: "responses" (list of dicts).
Each dictionary must include:

- text: the response string only (no explanation or extra text).
- probability: the estimated probability from 0.0 to 1.0 of this response given
  the input prompt (relative to the full distribution).

Give ONLY the JSON object, with no explanations or extra text.
```

Add this constraint:

```
At least {{lowProbabilityCandidates}} of the responses must have a probability
below {{probabilityThreshold}}. These are the tail candidates. Do not make them
jokes or throwaways; make them genuine alternatives that a minority of experts
would defend.
```

## Why the tail matters

A distribution prompt still has a mode. If every candidate is likely, you have reproduced the consensus with more words. The paper's diversity-tuning ablation lowers the probability ceiling and finds diversity rises as the ceiling falls, across poems, stories, and jokes.

## With chain of thought

The paper's VS-CoT variant adds one line before the JSON:

```
First, provide a single "reasoning" field as a string, detailing your
step-by-step thought process. Then return the output in JSON format...
```

Use VS-CoT when the ideas need a mechanism, not just a name. Use plain VS when speed matters.

## Parsing and repair

1. Parse the JSON. If it is wrapped in prose, extract the first `{` to the last `}`.
2. If a probability is missing, assign `1 / number_of_candidates` and mark the record `probability: "imputed"`.
3. If probabilities do not sum to 1, do not renormalize silently. Keep the reported values and note the sum.
4. If fewer than the requested candidates arrive, ask once: "Give me the missing tail candidates, each with a probability below {{probabilityThreshold}}. Do not repeat or paraphrase the ones already listed."
5. If the second attempt still falls short, continue with what exists and record the shortfall in the process counts.

## Do not

- Do not filter the tail before the critique phase.
- Do not convert probabilities into a ranking and drop the low ones. The low ones are the point.
- Do not claim the probabilities are calibrated. The paper reports meaningful rank-order information for some answer spaces and weaker calibration for others. They are a diversity device, not a forecast.
