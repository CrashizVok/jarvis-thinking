# Evaluation

This harness compares plain prompting, each technique alone, and a multi-call full pipeline on six fixed open-ended tasks.

It does not run the OpenCode plugin. It reimplements the prompt protocol in `eval/lib/prompts.ts` and `eval/lib/pipeline.ts`, and it uses the plugin's real dedup code from `src/ideas/dedup.ts`. The integration between the plugin and OpenCode is tested separately with a live session.

## Design

| Item | Value |
|---|---|
| Tasks | 6: food waste, ideation research, bike-share campaign, note-taking features, remote decisions, water-testing kit |
| Conditions | 12: plain, research, diverge, vs, personas, persona_cot, brainwriting, out_of_box, keywords, consensus, critique, full |
| Repetitions | 3 per task × condition by default |
| Ideas per run | 6 for single-call conditions; the full pipeline returns a pool and 2 selected winners |
| Generation model | `deepseek-v4.1-flash` through the OpenCode Go gateway by default |
| Embeddings | `gemini-embedding-001` through Google |
| Judges | `gemini-4-argon` and `gpt-6-luna` through the Go gateway |
| Temperature | 0.8 for generation, 0 for judges |
| Max output | 8192 tokens |

## Metrics

- **Diversity**: mean pairwise cosine distance of the run's idea embeddings. 0 means identical, 1 means orthogonal.
- **Vendi**: exponential of the Shannon entropy of the normalized eigenvalues of the cosine similarity matrix. 1 means identical, N means all dissimilar. This follows CreativeDC.
- **Novelty**: mean distance from each idea to the nearest idea in the plain-prompt consensus pool for the same task, using leave-one-run-out for plain runs. This follows IDEAFix's novelty-against-control idea.
- **Duplicate rate**: fraction of ideas the plugin's dedup would drop against earlier ideas in the same run at threshold 0.82.
- **Cross-run novelty**: distance from each idea to the nearest idea from other runs of the same condition and task. Low values mean the condition converges on the same answers across runs.
- **Usefulness**: mean of five judge criteria, each 1–5: feasibility, specificity, insight, actionability, evidence. Judged on the first repetition of each task and condition by default.
- **Full selected**: novelty and usefulness of the two winners, reported separately from the pool.

## Run

```sh
# Defaults: Go gateway for generation, Google for embeddings
node --experimental-strip-types eval/run.ts --reps=3

# Google for generation instead
JARVIS_EVAL_PROVIDER=google JARVIS_EVAL_MODEL=gemini-3.5-flash node --experimental-strip-types eval/run.ts --reps=3

# Recompute metrics and the report without model calls
node --experimental-strip-types eval/run.ts --report-only
```

### Environment

| Variable | Default | Purpose |
|---|---|---|
| `JARVIS_EVAL_PROVIDER` | `openai` | `openai` for an OpenAI-compatible endpoint, `google` for Generative Language |
| `JARVIS_EVAL_BASE_URL` | `https://opencode.ai/inference/go/openai/v1` | Chat endpoint |
| `JARVIS_EVAL_MODEL` | `deepseek-v4.1-flash` | Generation model |
| `JARVIS_EVAL_API_KEY` | OpenCode auth store | API key for the chat endpoint |
| `JARVIS_EVAL_JUDGES` | `gemini-4-argon,gpt-6-luna` | Comma-separated judge models |
| `JARVIS_EVAL_EMBEDDING_MODEL` | `gemini-embedding-001` | Embedding model |
| `JARVIS_EVAL_EMBEDDING_API_KEY` | `GOOGLE_API_KEY` or auth store | Google embeddings key |
| `JARVIS_EVAL_CONCURRENCY` | `2` | Parallel requests |

The OpenCode Go gateway requires an `x-opencode-session` header. The client adds one automatically. It also adds a user agent, because the gateway rejects the default Node user agent.

### Flags

| Flag | Meaning |
|---|---|
| `--reps=N` | Repetitions per task and condition |
| `--judge-reps=N` | Repetitions to judge; default 1 |
| `--tasks=a,b` | Limit tasks |
| `--conditions=a,b` | Limit conditions |
| `--model=name` | Generation model |
| `--judges=a,b` | Judge models |
| `--concurrency=N` | Parallel requests |
| `--skip-judge` | Reuse existing judgments, do not call judges |
| `--no-cache` | Ignore the response cache |
| `--resume` | Keep existing raw files and skip completed runs |
| `--report-only` | Recompute from `eval/raw/generations.jsonl` |

## Output

| Path | Content |
|---|---|
| `eval/raw/generations.jsonl` | One record per run: task, condition, rep, model, ideas, selected winners, calls, latency, error |
| `eval/raw/judgments.jsonl` | One record per judge call: run id, judge, order, scores |
| `eval/raw/metrics.json` | Per-run metrics and the aggregate results object |
| `eval/raw/summary.csv` | Condition-level table |
| `eval/raw/metrics-by-task.csv` | Per-run table |
| `eval/raw/spot-check.csv` | Blinded sample for the manual protocol |
| `eval/raw/spot-check-map.json` | Sample id to run id, for the study lead only |
| `eval/cache/` | Content-addressed API cache; ignored by git |
| `docs/results.md` | Generated report |

## Statistical notes

- The p-value is a two-sided stratified permutation test. Labels are shuffled inside each task, so the task mix cannot explain the difference.
- The confidence interval is a percentile bootstrap over runs.
- Cohen's d uses pooled standard deviations.
- The comparison table is not corrected for multiple comparisons. Treat it as exploratory.
- The sample is 18 runs per condition at 3 repetitions, or fewer if a run fails.

## Manual spot check

`eval/raw/spot-check.csv` contains two runs per task, chosen at random, with the condition hidden. `eval/SPOT_CHECK.md` describes the protocol. Use `eval/spot-check.ts` after two raters fill in the scores:

```sh
node --experimental-strip-types eval/spot-check.ts eval/raw/spot-check.csv
```

The script reports Pearson correlation and quadratic-weighted Cohen's kappa between the two raters, and the correlation between each rater and the LLM judges.

## Limitations

- The harness reimplements the pipeline as prompts. It does not test the plugin's skill loading, hooks, tools, or agent.
- The research briefs are model-generated and not fact-checked. The research condition measures the effect of a research-shaped context, not retrieval quality.
- Usefulness is LLM-judged on a subsample. The manual protocol exists but its results depend on whether people run it.
- Six tasks are not a benchmark.
- One generation model. The results may not transfer to another model.
- The OpenCode Go gateway may route the same model name to a different backend over time. The model string and date are recorded in the report, but the backend is not.
