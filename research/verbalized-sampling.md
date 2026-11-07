# Verbalized sampling

## What it is

Ask the model for several candidate responses and a probability for each, instead of asking for one response. The probabilities are verbalized, not read from logits.

Example from the paper: "Generate 5 jokes about coffee and their corresponding probabilities."

## Mechanism

The paper's causal story is typicality bias in preference data. Annotators prefer familiar, fluent, predictable text. Post-training sharpens the model toward that preference, so a single-answer prompt returns the mode of the aligned model. A distribution prompt changes the target: the modal response to "give me a distribution" is a distribution that looks like the pretraining distribution, not a single prototype. The paper formalizes this with a reward model that combines true task utility, a typicality term, and noise, then shows that a positive typicality weight sharpens the policy.

The paper separates three prompt levels:

| Level | Example | What it returns |
|---|---|---|
| Instance | "Tell a joke about coffee" | one sample from the aligned mode |
| List | "Tell 5 jokes about coffee" | the top 5 modes, a bestseller list |
| Distribution | "Tell 5 jokes with their probabilities" | a verbalized distribution with a tail |

The authors argue that list prompts still collapse to the top-k modes, while distribution prompts recover more of the base model's spread.

## Experimental setup

| Item | Value |
|---|---|
| Tasks | Poem continuation, story generation, joke writing |
| Data | 100 data points per task; PoemHunter poems, BookMIA stories, 100 Reddit r/DadJokes themes |
| Samples | k=5 candidates per call, N=30 total samples per data point |
| Models | GPT-4.1-mini, GPT-4.1, Gemini-2.5-Flash, Gemini-2.5-Pro, Claude-3.7-Sonnet, Claude-4-Sonnet, Llama-3.1-70B-Instruct, Qwen3-235B-A22B-Instruct-2507, OpenAI o3, DeepSeek R1 |
| Baselines | Direct, CoT, Sequence, Multi-turn, VS-Standard, VS-CoT, VS-Multi |
| Diversity | 1 − mean pairwise cosine similarity of text-embedding-3-small embeddings; negative similarities clipped to 0; reported as a percentage |
| Quality | Claude-3.7-Sonnet judge; Creative Writing v3 rubric for poem/story, HumorBench rubric for jokes |
| Human study | 90 annotators, 30 per task, 90 output pairs per task, 4-point Likert, Gwet's AC1 0.49–0.87 |
| Additional tasks | PersuasionForGood dialogue simulation (1,017 dialogues), synthetic math question generation, 40 open-ended QA questions, 50 GSM8K questions, dice rolls, safety on 353 StrongReject prompts |

## Exact numbers

From the abstract, introduction, §5, Figure 3, Figure 4, and Table 2:

- Creative writing diversity increased 1.6–2.1× over direct prompting.
- Human evaluation scores improved by 25.7% (reported in the introduction; Table 2 shows poem 1.90 → 2.39, story 2.74 → 3.06, joke 1.83 → 3.01 on a 1-to-4 diversity scale).
- VS recovered 66.8% of the base model's diversity (Figure 4).
- Larger models (GPT-4.1, Gemini-2.5-Pro) achieved diversity gains 1.5 to 2 times greater than smaller models (GPT-4.1-Mini, Gemini-2.5-Flash).
- On the dice-roll task, direct prompting reached KL divergence 0.926, direct with CoT 1.163, multi-turn 0.119, sequence 0.058. VS-Standard had the lowest KL divergence.
- On synthetic negative GSM8K solutions, VS-CoT reached the highest incorrect-answer rate (0.89) and coverage (0.57); direct prompting produced incorrect answers only 34% of the time.
- On the U.S. state distribution task, VS-Standard had the lowest KL divergence against a RedPajama-derived pretraining proxy, compared with direct and sequence prompting.
- Probability tuning used p ∈ {1.0, 0.9, 0.5, 0.2, 0.05, 0.005, 0.001}; lower thresholds generally produced higher diversity.
- VS was orthogonal to temperature, top-p, and min-p in the ablation: it improved the diversity-quality Pareto front under each setting.

## Known limitations and conflicting results

- The verbalized probabilities are not calibrated. The paper reports meaningful rank-order information for U.S. states and countries, weaker calibration for programming languages, and says the diversity gains do not depend on exact numerical calibration.
- VS-Standard and Sequence caused a quality drop, attributed to cognitive burden. VS-CoT and VS-Multi mitigated it, and on larger models sometimes improved quality. The benefit depends on model capability; smaller models occasionally degraded.
- The main experiments are English creative writing. The paper adds dialogue, synthetic data, QA, and safety, but not scientific or strategic ideation.
- A distribution prompt still has a mode. If every candidate has a high probability, the output is a bestseller list with more words.
- The paper's diversity metric is embedding cosine. The persona study argues that embedding similarity overstates human–LLM gaps because phrasing differs. That critique applies to any embedding-based diversity claim, including this one.
- Cross-model homogeneity is not solved by VS. Every model trained on similar data can still put its tail in the same region. The paper does not test cross-model tail overlap. This is a design inference, not a reported result.

## Prompt wording that produced the best results

From Appendix G.3, verbatim:

```
Generate {num_samplings} responses to the input prompt. Each response should be approximately {target words} words.

Return the responses in JSON format with the key: "responses" (list of dicts). Each dictionary must include:

• text: the response string only (no explanation or extra text).
• probability: the estimated probability from 0.0 to 1.0 of this response given the input prompt (relative to the full distribution).

Give ONLY the JSON object, with no explanations or extra text.
```

VS-CoT adds:

```
First, provide a single "reasoning" field as a string, detailing your step-by-step thought process.
Then, return the output in JSON format with the key "responses" (list of dicts)...
```

Probability tuning adds:

```
[Randomly sample the responses from the distribution, with the probability of each response must be below {probability_tuning}.]
```

## Design consequence

The pipeline asks for 5 candidates per call by default and requires at least 2 below probability 0.10. It does not renormalize or claim calibration. It treats the probabilities as a diversity device. It uses VS-CoT when the idea needs a mechanism.

## Citations

- Zhang, J., Yu, S., Chong, D., Sicilia, A., Tomz, M. R., Manning, C. D., Shi, W. (2026). *Verbalized Sampling: How to Mitigate Mode Collapse and Unlock LLM Diversity.* arXiv:2510.01171v4. https://arxiv.org/abs/2510.01171
- Jiang, L., et al. (2025). *Artificial Hivemind.* arXiv:2510.22954. https://arxiv.org/abs/2510.22954
