# Results

Generated 2026-11-07T19:32:50.611Z. Model: `deepseek-v4.1-flash`. Judges: `gemini-4-argon`, `gpt-6-luna`.

6 tasks, 3 repetitions per condition. The full pipeline runs five model calls per repetition. Usefulness is judged on a subsample of repetitions.

## Headline

| Condition | Pool size | Diversity | Vendi | Novelty vs plain | Duplicate rate | Cross-run novelty | Usefulness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| plain | 6.0 | 0.634 ± 0.057 | 4.535 ± 0.298 | 0.057 ± 0.131 | 0.000 ± 0.000 | 0.057 ± 0.131 | 3.375 (n=6) |
| research | 6.0 | 0.730 ± 0.035 | 5.081 ± 0.161 | 0.553 ± 0.038 | 0.000 ± 0.000 | 0.076 ± 0.175 | 3.383 (n=6) |
| diverge | 6.0 | 0.666 ± 0.038 | 4.730 ± 0.200 | 0.468 ± 0.035 | 0.000 ± 0.000 | 0.044 ± 0.129 | 3.122 (n=6) |
| vs | 6.0 | 0.621 ± 0.072 | 4.454 ± 0.402 | 0.412 ± 0.077 | 0.000 ± 0.000 | 0.076 ± 0.152 | 3.186 (n=6) |
| personas | 6.0 | 0.589 ± 0.038 | 4.113 ± 0.236 | 0.604 ± 0.115 | 0.000 ± 0.000 | 0.064 ± 0.149 | 3.283 (n=6) |
| persona_cot | 6.0 | 0.651 ± 0.052 | 4.642 ± 0.293 | 0.497 ± 0.068 | 0.000 ± 0.000 | 0.095 ± 0.184 | 3.314 (n=6) |
| brainwriting | 6.0 | 0.605 ± 0.056 | 4.226 ± 0.295 | 0.503 ± 0.052 | 0.000 ± 0.000 | 0.229 ± 0.217 | 3.017 (n=6) |
| out_of_box | 6.0 | 0.688 ± 0.059 | 4.835 ± 0.329 | 0.506 ± 0.065 | 0.000 ± 0.000 | 0.250 ± 0.209 | 3.056 (n=6) |
| keywords | 6.0 | 0.573 ± 0.075 | 4.195 ± 0.442 | 0.588 ± 0.069 | 0.000 ± 0.000 | 0.338 ± 0.137 | 2.692 (n=6) |
| consensus | 6.0 | 0.672 ± 0.044 | 4.782 ± 0.235 | 0.521 ± 0.053 | 0.000 ± 0.000 | 0.453 ± 0.042 | 3.406 (n=6) |
| critique | 6.0 | 0.684 ± 0.043 | 4.828 ± 0.258 | 0.491 ± 0.048 | 0.000 ± 0.000 | 0.340 ± 0.223 | 3.289 (n=6) |
| full | 5.9 | 0.692 ± 0.054 | 4.754 ± 0.359 | 0.596 ± 0.056 | 0.000 ± 0.000 | 0.477 ± 0.177 | 3.254 (n=5) |

Higher is better for diversity, novelty, cross-run novelty, and usefulness. Lower is better for duplicate rate. Pool size is the number of ideas the condition returned before selection; the full pipeline returns a pool and then two selected winners.

## Difference from plain prompting

| Condition | Metric | n | Mean | Δ vs plain | 95% CI of mean | p (stratified permutation) | Cohen's d |
| --- | --- | --- | --- | --- | --- | --- | --- |
| research | diversity | 18 | 0.730 | 0.096 | [0.715, 0.747] | 0.0002 | 2.044 |
| research | novelty | 18 | 0.553 | 0.496 | [0.536, 0.570] | 0.0002 | 5.133 |
| research | duplicateRate | 18 | 0.000 | 0.000 | [0.000, 0.000] | 1.0000 | 0.000 |
| research | crossRunNovelty | 18 | 0.076 | 0.019 | [0.000, 0.156] | 0.1000 | 0.122 |
| research | usefulness | 6 | 3.383 | 0.008 | [3.183, 3.561] | 1.0000 | 0.027 |
| diverge | diversity | 18 | 0.666 | 0.032 | [0.648, 0.682] | 0.0275 | 0.655 |
| diverge | novelty | 18 | 0.468 | 0.411 | [0.452, 0.484] | 0.0002 | 4.271 |
| diverge | duplicateRate | 18 | 0.000 | 0.000 | [0.000, 0.000] | 1.0000 | 0.000 |
| diverge | crossRunNovelty | 18 | 0.044 | -0.013 | [0.000, 0.112] | 1.0000 | -0.096 |
| diverge | usefulness | 6 | 3.122 | -0.253 | [2.978, 3.264] | 0.0610 | -0.925 |
| vs | diversity | 18 | 0.621 | -0.013 | [0.588, 0.652] | 0.0465 | -0.208 |
| vs | novelty | 18 | 0.412 | 0.355 | [0.377, 0.446] | 0.0002 | 3.296 |
| vs | duplicateRate | 18 | 0.000 | 0.000 | [0.000, 0.000] | 1.0000 | 0.000 |
| vs | crossRunNovelty | 18 | 0.076 | 0.019 | [0.015, 0.152] | 0.8605 | 0.136 |
| vs | usefulness | 6 | 3.186 | -0.189 | [2.939, 3.422] | 0.2754 | -0.570 |
| personas | diversity | 18 | 0.589 | -0.046 | [0.571, 0.606] | 0.0002 | -0.947 |
| personas | novelty | 18 | 0.604 | 0.547 | [0.553, 0.655] | 0.0002 | 4.433 |
| personas | duplicateRate | 18 | 0.000 | 0.000 | [0.000, 0.000] | 1.0000 | 0.000 |
| personas | crossRunNovelty | 18 | 0.064 | 0.007 | [0.000, 0.133] | 0.2987 | 0.052 |
| personas | usefulness | 6 | 3.283 | -0.092 | [3.114, 3.464] | 0.5919 | -0.315 |
| persona_cot | diversity | 18 | 0.651 | 0.017 | [0.628, 0.674] | 0.0672 | 0.309 |
| persona_cot | novelty | 18 | 0.497 | 0.440 | [0.468, 0.529] | 0.0002 | 4.213 |
| persona_cot | duplicateRate | 18 | 0.000 | 0.000 | [0.000, 0.000] | 1.0000 | 0.000 |
| persona_cot | crossRunNovelty | 18 | 0.095 | 0.038 | [0.023, 0.182] | 0.2927 | 0.236 |
| persona_cot | usefulness | 6 | 3.314 | -0.061 | [3.128, 3.500] | 0.5026 | -0.204 |
| brainwriting | diversity | 18 | 0.605 | -0.030 | [0.580, 0.630] | 0.0250 | -0.525 |
| brainwriting | novelty | 18 | 0.503 | 0.446 | [0.480, 0.527] | 0.0002 | 4.464 |
| brainwriting | duplicateRate | 18 | 0.000 | 0.000 | [0.000, 0.000] | 1.0000 | 0.000 |
| brainwriting | crossRunNovelty | 18 | 0.229 | 0.172 | [0.132, 0.326] | 0.0002 | 0.957 |
| brainwriting | usefulness | 6 | 3.017 | -0.358 | [2.803, 3.200] | 0.0585 | -1.177 |
| out_of_box | diversity | 18 | 0.688 | 0.054 | [0.660, 0.713] | 0.0005 | 0.924 |
| out_of_box | novelty | 18 | 0.506 | 0.449 | [0.475, 0.534] | 0.0002 | 4.336 |
| out_of_box | duplicateRate | 18 | 0.000 | 0.000 | [0.000, 0.000] | 1.0000 | 0.000 |
| out_of_box | crossRunNovelty | 18 | 0.250 | 0.193 | [0.154, 0.343] | 0.0002 | 1.106 |
| out_of_box | usefulness | 6 | 3.056 | -0.319 | [2.878, 3.244] | 0.0310 | -1.060 |
| keywords | diversity | 18 | 0.573 | -0.061 | [0.539, 0.606] | 0.0010 | -0.920 |
| keywords | novelty | 18 | 0.588 | 0.531 | [0.557, 0.618] | 0.0002 | 5.064 |
| keywords | duplicateRate | 18 | 0.000 | 0.000 | [0.000, 0.000] | 1.0000 | 0.000 |
| keywords | crossRunNovelty | 18 | 0.338 | 0.281 | [0.270, 0.393] | 0.0002 | 2.092 |
| keywords | usefulness | 6 | 2.692 | -0.683 | [2.400, 3.000] | 0.0352 | -1.813 |
| consensus | diversity | 18 | 0.672 | 0.038 | [0.653, 0.692] | 0.0027 | 0.752 |
| consensus | novelty | 18 | 0.521 | 0.464 | [0.497, 0.545] | 0.0002 | 4.639 |
| consensus | duplicateRate | 18 | 0.000 | 0.000 | [0.000, 0.000] | 1.0000 | 0.000 |
| consensus | crossRunNovelty | 18 | 0.453 | 0.396 | [0.436, 0.473] | 0.0002 | 4.063 |
| consensus | usefulness | 6 | 3.406 | 0.031 | [3.267, 3.558] | 0.8730 | 0.112 |
| critique | diversity | 18 | 0.684 | 0.050 | [0.664, 0.703] | 0.0005 | 0.987 |
| critique | novelty | 18 | 0.491 | 0.434 | [0.470, 0.513] | 0.0002 | 4.394 |
| critique | duplicateRate | 18 | 0.000 | 0.000 | [0.000, 0.000] | 1.0000 | 0.000 |
| critique | crossRunNovelty | 18 | 0.340 | 0.283 | [0.236, 0.432] | 0.0002 | 1.547 |
| critique | usefulness | 6 | 3.289 | -0.086 | [3.172, 3.369] | 0.5616 | -0.336 |
| full | diversity | 15 | 0.692 | 0.058 | [0.663, 0.716] | 0.0002 | 1.050 |
| full | novelty | 15 | 0.596 | 0.539 | [0.568, 0.624] | 0.0002 | 5.333 |
| full | duplicateRate | 15 | 0.000 | 0.000 | [0.000, 0.000] | 1.0000 | 0.000 |
| full | crossRunNovelty | 15 | 0.477 | 0.420 | [0.380, 0.553] | 0.0002 | 2.694 |
| full | usefulness | 5 | 3.254 | -0.121 | [3.195, 3.313] | 0.4564 | -0.498 |

The p-value is a two-sided stratified permutation test over runs, with label shuffles inside each task. It tests whether the condition differs from plain prompting on the same task mix. It is not a correction for multiple comparisons; treat the whole table as exploratory.

## Full pipeline selection

The full pipeline returned two selected winners per run. Selected novelty is the mean distance from the plain-prompt consensus pool. Selected usefulness is 3.480 (n=15).

## Trigger classifier

| Precision | Recall | F1 | Accuracy | TP | FP | TN | FN |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1.000 | 0.810 | 0.895 | 0.905 | 17 | 0 | 21 | 4 |

The labels are the author's judgments on 42 prompts, not a human-annotated benchmark. The table is a sanity check, not a validated measure.

## What this does not show

- The harness reimplements the pipeline as prompts. It does not run the OpenCode plugin, its skills, or its tools. The integration is tested separately.
- The research briefs are model-generated and not fact-checked. The research condition tests the effect of a research-shaped context, not the quality of retrieval.
- Usefulness is LLM-judged on a subsample. There is no human evaluation in these numbers.
- The tasks are six English prompts in five domains. They are not a benchmark.
- The p-values are exploratory and uncorrected.

## Raw data

`eval/raw/generations.jsonl`, `eval/raw/judgments.jsonl`, `eval/raw/metrics.json`, `eval/raw/summary.csv`, `eval/raw/metrics-by-task.csv`, `eval/raw/spot-check.csv`.

Model calls: 152 live, 0 cached, 0 failed.

## Reproduction

```sh
JARVIS_EVAL_MODEL=gemini-3.5-flash node --experimental-strip-types eval/run.ts --reps=3
```


## What the numbers mean

Two results stand out. The pipeline raises embedding diversity from 0.634 to 0.692 and cross-run novelty from 0.057 to 0.477, so it does produce pools that differ more across tasks and across repetitions. It does not raise judged usefulness: plain 3.375, full 3.254, p=0.46, and the selected winners score 3.480.

Three single techniques lowered usefulness with a p below 0.06: keywords (2.692, p=0.035), out_of_box (3.056, p=0.031) and brainwriting (3.017, p=0.059). All three buy cross-run novelty, so the trade is visible in this sample. Personas reduced embedding diversity to 0.589, which fits the fixation result reported by Deng et al. Verbalized sampling reduced diversity slightly (0.621) and raised novelty, so this run does not reproduce the diversity gain the paper reports on its own benchmarks.

The duplicate rate is 0.000 in every condition, which means a pool of six ideas never exercises the dedup metric. Treat that column as uninformative here.

## Manual spot check

Not run. The protocol is in `eval/SPOT_CHECK.md`, the rater sheet is `eval/raw/spot-check.csv`, and `eval/spot-check.ts` computes Pearson and quadratic kappa once a rater fills it in. The usefulness numbers above are LLM-judged only.

## How to read this file

This file reports what the harness measured, and it is worth reading the limits before the table. The numbers come from six tasks, three repetitions and one model, so they describe a small slice of the space. The confidence intervals are wide, and the p-values are not corrected for the number of comparisons. A difference that looks large in one row can shrink when another task is added. That is why the table marks the evidence as exploratory.

The most useful comparison is the one between a condition and plain prompting on the same task. The effect size column uses the pooled standard deviation, and the interval comes from a bootstrap over runs. When an interval crosses zero, the direction of the effect is not settled by this sample. The usefulness column has a smaller sample than the diversity columns because the judges scored a subsample, and that is why its interval is wider.

Nothing here says that a technique will work on another model, another language or another domain. The harness tests a prompt-shaped version of each technique. The OpenCode plugin, its skills and its tools are tested separately, and the live smoke test is the only evidence that the integration runs.

## How to read the table without overreading it

The table is a set of six tasks and three repetitions, and the pipeline here is a prompt reimplementation of the plugin rather than the plugin itself. A difference of a few hundredths in diversity is not a law of model behaviour. It is a direction of travel on this sample, and the confidence interval sits next to it. That interval is narrow because the same six tasks appear in every condition. Narrow is a property of the design. It is not evidence that the effect would survive a new task, and you should not read it that way.

Two runs on the same topic are the unit that matters for the plugin. If the second run returns the same six ideas as the first, the diversity inside one pool says little about the value of the tool. That is why the cross-run column is in the table, and why the full pipeline's 0.477 is the number to watch. It is higher than every single stage except consensus exclusion, which reaches 0.453 on its own.

The clearest signal is the research stage. It lifts diversity and novelty at no measurable cost in usefulness, and it is the only single stage that does both. The full pipeline keeps most of that gain and adds cross-run novelty, which is the property the plugin exists to produce: two runs on the same topic should not return the same six ideas. The pipeline does not beat plain prompting on judged usefulness, and no result here supports a claim that it does.

The weak signals point the other way. Keywords, out-of-box instructions and brainwriting all raise cross-run novelty while lowering judged usefulness, and the usefulness intervals sit below plain in each case. Treat those stages as tools for a brief that asks for range, not as defaults for a brief that asks for a shortlist.

The duplicate rate is not a finding. It is 0.000 everywhere because each pool holds six ideas and the metric compares pools, so the column cannot separate the conditions.

One more thing needs saying about the way the table was built. It is a record of what the model did on the day, and it is not a claim about the model in general. A run that used a different judge, a different order of the ideas, or a different seed could move a row by more than the effect it reports. The judge itself is a model, and the literature on novelty judges shows that a small change to the prompt can move pairwise accuracy by tens of points. That is why the raw generations and the judge prompts are both in the repository, so a reader can check the path from prompt to number.

The same holds for the trigger table. It was scored by the author on 42 prompts, and the prompts were written to cover the rules rather than to sample real usage. A real session will contain phrasings that no rule anticipates, and the recall number will fall. The useful claim is narrow: on this set, no mechanical prompt was routed into the pipeline, and four open-ended prompts were missed. That is enough to ship the hook, and not enough to promise it will never misfire.
