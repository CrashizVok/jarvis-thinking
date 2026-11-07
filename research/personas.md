# Multiple personas

## What it is

Assign the model several deliberately different viewpoints and generate ideas from each. A persona is a sampling cue that changes where in the knowledge space the model starts.

## Mechanism

The persona paper identifies two mechanisms behind LLM idea convergence: lost knowledge partitioning and fixation.

Human populations partition knowledge across many minds. Each person occupies a different region of the space. LLMs aggregate the corpus into one distribution and then align to a single preference signal, so independent sessions start in the same region. A persona is a cue that pushes a session toward a different region.

The paper's key prediction is counterintuitive: ordinary, randomly sampled personas should beat curated "creative" personas. Creative personas such as famous founders are densely interconnected in the model's knowledge space, so they do not move the session far. Ordinary personas carry heterogeneous, everyday cues and reach more distant regions.

The second finding is a cost. A persona stays in context, and autoregressive conditioning keeps every later token under its influence. The persona opens a new starting region but increases fixation inside the session.

## Experimental setup

Study 1, a four-condition between-participants design:

| Item | Value |
|---|---|
| Human sample | 121 recruited, 99 after excluding external-source use |
| LLM sample | 99 simulated participants per condition, matching the human sample |
| Generator | GPT-4o (gpt-4o-2024-11-20), temperature 1.0 |
| Task | Generate 10 fitness product ideas, one at a time, with prior ideas visible |
| Conditions | Human, LLM Default, LLM Creative Personas, LLM Ordinary Personas |
| Creative personas | 99 curated fitness entrepreneurs |
| Ordinary personas | 99 randomly selected from Ge et al. (2024) |
| Diversity metrics | Accumulated categories (max 28), accumulated category combinations (max 810), average pairwise distance (max 3.0) |
| Statistics | 100 bootstrap draws of 10 participants × 10 ideas; Welch t-tests on the bootstrap distributions |

## Exact numbers

Full-sample idea pools (99 participants × 10 ideas):

| Condition | Categories | Unique combinations |
|---|---|---|
| Human | 28 | 208 |
| LLM Default | 23 | 89 |
| LLM Creative Personas | 27 | 164 |
| LLM Ordinary Personas | 27 | 208 |

Bootstrapped groups of 10 participants × 10 ideas:

| Condition | Categories (SE) | Combinations (SE) | Pairwise distance (SE) |
|---|---|---|---|
| Human | 26.34 (0.11) | 59.22 (0.45) | 2.40 (0.01) |
| LLM Default | 18.76 (0.11) | 39.54 (0.32) | 2.05 (0.01) |
| LLM Creative | 22.98 (0.11) | 50.40 (0.45) | 2.28 (0.01) |
| LLM Ordinary | 24.35 (0.13) | 57.37 (0.58) | 2.36 (0.01) |

First ideas only (knowledge partitioning):

| Condition | Categories (SE) | Combinations (SE) | Distance (SE) |
|---|---|---|---|
| Human | 14.29 (0.16) | 8.99 (0.10) | 2.39 (0.01) |
| LLM Default | 8.71 (0.11) | 5.98 (0.12) | 1.55 (0.02) |
| LLM Creative | 12.32 (0.17) | 8.51 (0.11) | 2.16 (0.02) |
| LLM Ordinary | 14.05 (0.16) | 9.47 (0.07) | 2.34 (0.02) |

Fixation slopes (0 to 3 scale; higher means less fixation):

| Condition | Slope |
|---|---|
| Human | 1.020 |
| LLM Default | 1.023 (p=.90 vs human) |
| LLM Creative | 0.985 (p=.25 vs default) |
| LLM Ordinary | 0.875 (p<.001 vs default) |

All ordinary-versus-creative comparisons favored ordinary personas on the three bootstrapped metrics (p<.001). Ordinary personas matched humans on categories (14.05 vs 14.29, p=.30) and slightly exceeded humans on first-idea combinations (9.47 vs 8.99, p<.001).

## Known limitations and conflicting results

- One product category: fitness products. The authors list other ideation domains as future work.
- GPT-4o was the main generator. The paper replicates with gpt-5.6-sol and gemini-3.1-pro-preview and finds the same ranking, but the ordinary-persona advantage shrinks.
- In newer models, creative personas lead on pairwise distance (gpt-5.6-sol: 2.29 vs 2.26, p=.019; Gemini: 2.31 vs 2.25, p<.001). The advantage of ordinary personas is not stable across model generations.
- Personas increase fixation. The paper is explicit that personas alone are not enough.
- The ordinary persona set comes from a public persona dataset. It is not a random sample of the human population.
- The study compares category-based metrics and embedding metrics. Embedding-based measures exaggerate the human–LLM gap by roughly 2 to 3 times, according to the appendix.

## Prompt wording that produced the best results

From Appendix J:

```
system_message = f"You are acting as this persona: {profile}. Generate ideas from this persona's perspective."
```

The persona block itself is a short profile with a job, a daily constraint, and an everyday context. The paper's design criterion is that a persona is valuable to the extent that it drops a session into a region other sessions do not reach.

## Design consequence

The pipeline uses at least 3 personas. It requires them to differ in profession, customer, and mechanism, and it gives each a goal, a constraint, and a blind spot. It follows personas with CoT revision or a structural brainwriting round, because personas increase fixation.

## Citations

- Deng, Y., Brucks, M., Toubia, O. (2026). *A Cognitive Framework for Idea Diversity in Large Language Models.* arXiv:2602.20408v2. https://arxiv.org/abs/2602.20408
- Ge, Y., et al. (2024). *Scaling Synthetic Data Creation with 1,000,000,000 Personas.* Quoted in Deng et al. as the ordinary-persona source.
