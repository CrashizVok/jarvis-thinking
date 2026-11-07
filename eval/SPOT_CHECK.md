# Manual spot-check protocol

## Purpose

The evaluation uses two LLM judges for usefulness. LLM judges are unstable; the novelty-judge literature shows large swings from small prompt changes. This protocol checks whether the judge scores track human judgment on a small sample. It does not validate the whole benchmark.

## Sample

`eval/raw/spot-check.csv` contains two runs per task, chosen at random, with the condition hidden. Each row has:

- `sample_id`, `task`, `ideas`
- `judge1_usefulness`, `judge2_usefulness`
- blank `human_usefulness_r1`, `human_usefulness_r2`, `human_novelty_r1`, `human_novelty_r2`
- `notes`

The mapping from sample id to condition is in `eval/raw/spot-check-map.json`. Do not give that file to the raters until both have finished.

## Raters

Two raters. They should not be the person who wrote the prompts or the plugin. They should not see the condition, the model, or the judge scores before rating. Rate independently; do not discuss a row before both scores are recorded.

## Scales

Use integers from 1 to 5.

Usefulness:

| Score | Anchor |
|---|---|
| 1 | Would not help anyone; no plausible user or value |
| 2 | A theme, not a concrete idea; the user or mechanism is vague |
| 3 | Plausible but unclear; the first step is not obvious |
| 4 | Clear user, plausible value, a first step exists |
| 5 | Clear user, clear value, a first step that could be run next week |

Novelty:

| Score | Anchor |
|---|---|
| 1 | The obvious answer, or a rename of it |
| 2 | A known idea with a new audience or channel |
| 3 | A new combination of known ideas with a reason |
| 4 | A structural change to a known idea |
| 5 | A new region; no close consensus or stored idea |

Rate the run as a set, not the best idea in it. A set with one good idea and five paraphrases is not a 5.

## Procedure

1. Copy `eval/raw/spot-check.csv` to a working file. Keep the judge columns; the script needs them.
2. Rater 1 fills `human_usefulness_r1` and `human_novelty_r1`.
3. Rater 2 fills `human_usefulness_r2` and `human_novelty_r2` without seeing rater 1's scores.
4. Run:

```sh
node --experimental-strip-types eval/spot-check.ts eval/raw/spot-check.csv
```

5. The script reports:
   - mean human usefulness and novelty,
   - Pearson correlation between the two raters,
   - quadratic-weighted Cohen's kappa between the two raters,
   - Pearson correlation between each rater and the mean judge score,
   - the mean absolute difference.

6. Record the result in `docs/results.md` under "Manual spot check". If the correlations are below 0.6 or kappa is below 0.4, say that the judge is not validated on this sample and treat the usefulness numbers as exploratory.

## What counts as agreement

There is no universal threshold. For this protocol:

- Pearson r ≥ 0.6 between raters: acceptable for a small sample.
- Quadratic-weighted kappa ≥ 0.4: moderate agreement.
- Pearson r ≥ 0.6 between the mean judge score and the mean human score: the judge tracks the raters on this sample.
- A mean absolute difference above 1 point: the scores are not interchangeable even if they correlate.

Report the numbers, not just the verdict.

## Known limits

- Twelve runs is a spot check, not a validation study.
- Two raters from one organization share a viewpoint.
- The ideas are short; a rater may need domain knowledge to judge feasibility.
- The protocol does not test novelty against the literature. It tests whether people and judges agree on this sample.
- The sample is drawn from one model and one date.
