# Design

## Intent

Make a cloud model produce ideas that are not the first typical answer. The plugin does this by changing the process around the model, not the model's weights or its decoding. It works with any model that can read a skill, call a tool and write a file.

The first typical answer is not a bug in one model. The Jiang study found that in 79% of open-ended cases, the average pairwise similarity between responses from the same model sat above 0.8 (arXiv 2510.22954). A prompt that asks for ideas without changing the process therefore samples the same dense region again and again. The plugin moves the search before it starts, then filters the pool after it exists.

## Goals

- Trigger automatically on open-ended work.
- Stay out of the way on mechanical work.
- Force research before generation when a search tool is available.
- Produce several genuinely different candidates, not paraphrases.
- Remove duplicates against a persistent record.
- Return one or two winners with a reason and a first test.
- Work with any cloud model that has tools and file access.
- Never depend on logits, decoding internals or local sampler settings.

## Non-goals

- Beat a frontier model on a benchmark.
- Replace human judgment on high-stakes decisions, because a model cannot carry the responsibility for a decision that affects people.
- Generate images, code or long-form content as the primary output, because the pipeline is built for ideas in text.
- Train or fine-tune a model, because the plugin runs entirely through prompts and tool calls at inference time.
- Guarantee novelty. The pipeline can fail, and it reports when it does.

## The pipeline

| Phase | What happens | Evidence | Why it is here |
|---|---|---|---|
| 0. Frame | One sentence that names the decision, the audience and the constraint | Engineering | A broad prompt produces broad ideas, so the frame is the first constraint. |
| 1. Research | Search primary sources, build an evidence table, then write the consensus and the strongest disagreement | Survey; Hivemind | Fresh material is not shared by every model's prior. The direct novelty effect is unverified. |
| 2. Consensus baseline | Write the three most typical answers and the assumption they share | Hivemind; IDEAFix category negation | The first answer is the mode. Naming it makes exclusion possible. |
| 3. Personas and stimuli | Three disjoint ordinary personas, surprising and negative keywords, a random stimulus, an opposite assumption and an extreme constraint | Deng et al.; Carichon et al. | Personas change the starting region. Stimuli change the local search. |
| 4. Divergent generation | Five candidates per call with probabilities, at least two below 0.10, no filtering | Zhang et al.; Nguyen et al. | Distribution prompts recover more of the base distribution than single-answer prompts. |
| 5. Brainwriting | Three rounds that invent, build, then invert or combine, followed by a synthesis | Haase and Pokutta | It was the only structured method with a significant originality gain in the ICML comparison. |
| 6. Dedup and exclusion | Compare against the ideas file and earlier candidates, then drop semantic duplicates and consensus equivalents | Engineering; Hivemind | A pool of paraphrases is not a diverse pool. |
| 7. Difference | One sentence per idea that says how it differs from the consensus and the closest stored idea | Deng et al. revision; IDEAFix | An idea that cannot name its difference is a variation. |
| 8. Critique and repair | Four attacks on novelty, evidence, feasibility and specificity, then repair one structural element | Madaan et al.; Huang et al. | Specific feedback improves output, and generic feedback does not. Critique the idea, not the reasoning chain. |
| 9. Convergence | Score novelty, usefulness, evidence and surprise, then return one or two winners with the biggest risk and the first test | Yao et al.; Zheng et al.; Sternlicht et al. | Search is only as good as the evaluator. The evaluator is noisy, so selection stays shallow. |
| 10. Persist | Append accepted ideas with a timestamp, a topic, the scores, the sources and a fingerprint | Engineering | A stable record makes cross-session dedup possible. |

## Parameters

Every parameter is configurable through plugin options or environment variables. The table gives the default value for each parameter and the reason for that choice.

| Parameter | Default | Why this default | Evidence strength |
|---|---|---|---|
| `candidateCount` | 5 | The VS experiments use k=5, and the paper reports that a larger k raises diversity while it lowers quality. Five is the tested operating point, so the default stays at five. | Strong |
| `lowProbabilityCandidates` | 2 | The count forces a tail even when every candidate looks plausible. The exact number is not from a paper. | Engineering |
| `probabilityThreshold` | 0.10 | The value sits inside the VS tuning range of 0.05 to 0.20. A lower threshold generally produces more diversity. | Moderate |
| `personaCount` | 3 | The persona study samples many personas across sessions. Three disjoint personas is the smallest set that can cover more than one region in a session. | Engineering |
| `brainwritingRounds` | 3 | The winning brainwriting configuration has three divergent roles, and the fourth role is the synthesis. | Strong |
| `brainwritingMode` | `simulated` | The single-LLM simulation captured about 70% of the multi-agent gain. The multi-agent advantage was +0.25, with d=0.69 and p=.057. | Strong |
| `consensusCount` | 3 | Three typical answers are enough to expose the shared region without turning the baseline into a straw man. | Engineering |
| `consensusExclusion` | `true` | The Hivemind result shows that the mode is dense, and IDEAFix category negation is the closest tested intervention. | Moderate |
| `dedupThreshold` | 0.82 | This is an engineering default, and the sweep that chose it is recorded in `docs/results.md`. The 0.8 figure in Hivemind is descriptive, not a duplicate threshold. | Engineering |
| `useEmbeddings` | `false` | The lexical hybrid works offline. Embeddings are opt-in because they send idea text to a third party. | Engineering |
| `selectionCount` | 2 | Two winners give the user a fallback without turning the answer into a menu. | Engineering |
| `researchMinSources` | 5 | Five sources are enough to cover the state of the art, the failures and the disagreement. The number is not from a paper. | Engineering |
| `triggerThreshold` | 2.5 | The threshold is tuned on the test table. A false trigger costs context, while a missed trigger costs one skill load. | Engineering |
| `recentIdeasInContext` | 12 | A small digest keeps the context light. Dedup uses the full file, not the digest. | Engineering |
| `researchRequired` | `true` | Research is the first defense against the shared prior. The phase is skipped with a warning when search is unavailable. | Moderate |

## How to read the evidence

The evidence column tells you what kind of support a default actually has behind it in practice. It does not tell you how confident the author is. A strong label means that a controlled experiment measured the effect, and that the plugin uses the value that was tested. A moderate label means that the direction is supported, but that the exact number is a choice. An engineering label means that no paper tested the parameter, and that the value comes from the limits of the session.

The difference matters when you change a default. If a strong default moves, the change needs a new measurement, because the old number came from a setup that the plugin no longer matches. If an engineering default moves, the reason can be local: a smaller context window, a cheaper model, or a project that needs more candidates. Write the reason in this file so that the next reader does not have to guess what you knew.

The plugin does not hide this distinction in the output. The process section names the evidence for each phase, and the results file reports which defaults were measured and which were not. That is slower to read than a single confidence score, and it is the honest version. The label is not a verdict on the model.

None of these labels is a promise about a different model. A value that was strong on one family can be weak on another one. The plugin cannot measure that for you. The label describes the evidence that is there, and the user decides whether it applies.

It is not a score of how good the default is, and it is not a promise that the default will work for you. It is a description of the support that is there, and that is all that the label claims. If the support is thin, the label says so, and the default is still a choice that you can change.

## Interactions the design has to respect

### Personas increase fixation

The persona study found that ordinary personas opened a new starting region but lowered the within-session exploration slope from 1.023 to 0.875 (p<.001). A persona is a lamp, not a wider room. The pipeline follows personas with the CoT revision and with brainwriting. It does not run personas alone.

### CoT narrows first-idea diversity in some models

In the Gemini replication, CoT reduced first-idea category coverage from 9.14 to 7.11 (p<.001), even though it reduced fixation inside a session. The pipeline uses personas for spread and CoT for depth. It does not use CoT as the only diversity intervention, because the first idea would then come from a narrower region.

### Keywords trade diversity for novelty

Surprising and negative keywords raised novelty and rarity but lowered diversity in IDEAFix. The pipeline keeps them in separate branches so they cannot flatten the main pool. The main branch carries feasibility, and the stimulus branch carries novelty.

### Complex creativity methods underperform simple cues

IDEAFix found that C-K theory or SCAMPER or another named method did not consistently beat short prompts with explicit divergence cues. The pipeline does not wrap the prompt in a named framework. It uses short cues and category negation instead.

### Self-critique is unreliable on reasoning

Self-Refine gains on preference-style tasks, but intrinsic self-correction of reasoning often degrades accuracy (Huang et al.). The pipeline critiques ideas against a rubric, not a chain of thought. It keeps the original idea when the critique is generic.

### Debate is not free

Multi-agent debate improves reasoning in its own paper, but the Huang study shows that it is no better than self-consistency at an equal number of responses. The pipeline does not run a debate by default. Multi-agent brainwriting is the only multi-agent option, because it is the one that was tested directly against a simpler baseline.

### LLM novelty judges are unstable

Small prompt changes swing pairwise novelty accuracy by more than 50 points. The pipeline selects shallowly and does not run a tournament over judge calls. The evaluation harness uses two judges and a manual spot check.

### Verbalized probabilities are not calibrated

The VS paper reports meaningful rank-order information for some answer spaces and weaker calibration for others. The pipeline treats probabilities as a diversity device, not a forecast. It does not renormalize the numbers silently.

## The trigger

The trigger is a weighted rule list. Positive rules cover ideation, research, design, content creation and open-ended question forms. Negative rules cover mechanical edits, debugging, code context, file paths, shell commands and concrete artifacts. The score is the sum of the matching weights, and the default threshold is 2.5. A `force` or `off` mode short-circuits the list.

Why a rule list, not a model classifier:

- It is deterministic and testable.
- It adds no latency and no cost.
- It can explain its decision in one line.
- It can be extended with user regexes.

The trade-off is that it is English-centric and literal. A prompt that is open-ended but phrased as a mechanical task may be missed. The `/jarvis` command exists for that case. A false positive is cheaper than a false negative in this design, because the pipeline can say "this is mechanical" and stop after phase 0, while a false negative needs a manual command before the process starts at all.

## Deduplication

The default is a hybrid of three cheap signals: IDF-weighted token cosine at 0.60, character 4-gram Jaccard at 0.25, and concept-signature Jaccard at 0.15. If an OpenAI-compatible embedding endpoint is configured, the score becomes 0.65 times the embedding cosine plus 0.35 times the lexical blend.

Why not embeddings only:

- The default must work offline and without a key.
- Embedding calls send idea text to a third party.
- Embeddings can collapse distinct ideas that share a topic.

Why not string match:

- It misses paraphrases, which are the main failure mode after a model is asked for five candidates.

The model supplies a concept signature of three to five words for each idea, and the signature travels with the idea into the store. The signature is the semantic normalization step that costs no extra call. It is not as robust as an embedding, and the documentation says so.

The threshold is an engineering default, and it is not derived from a paper. `docs/results.md` records the sweep used to pick it. If the sweep is missing or inconclusive, the threshold is marked as uncalibrated rather than presented as evidence-based.

## What the plugin deliberately does not do

- It does not set temperature, top-p, top-k or min-p. Cloud providers may not expose them, and the Hivemind results show that decoding alone does not fix mode collapse.
- It does not read logits or token probabilities.
- It does not call a model during setup or during a tool call.
- It does not create an agent through the plugin API, because the V2 agent editor has no `add` method.
- It does not run Disney or Double Diamond or C-K or TRIZ or SCAMPER or a multi-agent debate. Each was either tested and failed to beat a simpler baseline, or lacks an equal-budget comparison.
- It does not persist rejected ideas. They stay in the transcript.
- It does not claim novelty. It reports the difference and the evidence, and the user decides.

## Failure handling

| Failure | What the user sees | What the plugin does |
|---|---|---|
| Search unavailable | One line saying search is unavailable, and claims marked `UNVERIFIED` | Continues with local knowledge |
| Malformed VS JSON | A repair request once, then a shortfall count | Continues with the valid candidates |
| Fewer candidates than asked | A shortfall count in the process section | Does not pad with paraphrases |
| Dedup tool fails | A manual comparison note | Continues with the main pool |
| Embedding endpoint fails | A note that lexical fallback was used | Continues |
| Ideas file unreadable | No existing matches | Persist creates a new file |
| Persist fails | The exact Markdown block and the error | Does not claim success |
| Nothing survives critique | An honest empty result and the constraint that killed the pool | Stops |

## Security and privacy

- The plugin writes only to `.jarvis/` and, when the user asks, to `.opencode/agents/jarvis.md`.
- The ideas file can contain user-provided context. The skill tells the model not to store personal data, but that is an instruction, not a filter.
- The optional embedding endpoint receives the idea title, the summary and the signature. It is off by default, and the README says this explicitly.
- No secrets are logged. The status output omits the API key and the endpoint credentials.
- The plugin does not execute shell commands.

## Alternatives considered

| Alternative | Why it lost |
|---|---|
| A single system prompt | No phase control, no automatic trigger, no dedup and no persistence |
| A custom tool that runs the whole pipeline internally | Hides the work, loses session tools and doubles cost |
| A model-based trigger classifier | Cost, latency, nondeterminism and harder testing |
| A vector database for ideas | Overkill for a Markdown file, and opaque to the user |
| Fine-tuning a model on diverse ideas | Out of scope, model-specific and not a plugin |
| Multi-agent debate | Cost, and no equal-budget advantage over self-consistency |
| Deep tree search | No reliable evaluator for open-ended ideas |

## Open questions

- No experiment tests the full pipeline as a unit. The evaluation in `docs/results.md` is the first attempt.
- The trigger rules are English-centric. A multilingual version needs its own test table.
- The dedup threshold is calibrated on a small set. A larger paraphrase set would improve it.
- Cross-model tail overlap is untested. Two models using VS may still pick the same tail.
- The usefulness rubric is an engineering construct. It has not been validated against human ratings at scale.

## What the evaluation changed

The full run did not justify removing a stage, and it did not justify a numeric default change. Every stage is required by the brief, and the measured costs are small enough that the honest move is to document them rather than to hide them behind a new default.

Two findings did change the docs. Research stays first and stays mandatory: it was the only single stage that raised both diversity (0.730 against 0.634 for plain) and novelty (0.553 against 0.057), and its usefulness score was flat (3.383 against 3.375). Keyword stimuli, the out-of-box instruction and brainwriting each raised cross-run novelty and lowered judged usefulness (2.692, 3.056 and 3.017 against 3.375). They remain, because a brief that asks for range needs them, and the README now names the trade.

The persona count stays at three. Personas reduced within-run diversity to 0.589, which is the fixation effect the literature predicts, and adding more personas would likely make that worse. The requirement sets a floor of three, so three is the default.

The pipeline is not more useful than plain prompting in this sample. Selected ideas scored 3.480 and plain prompting 3.375, while the pooled pipeline score was 3.254 with an interval that crosses zero. No claim in this repository says otherwise. A stronger claim would need more tasks, a second model and human ratings; the protocol for the last one is in `eval/SPOT_CHECK.md`.
