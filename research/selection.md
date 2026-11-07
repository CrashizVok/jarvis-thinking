# Selection

## What it is

Score the survivors on novelty, usefulness, evidence, and surprise, then return only the best one or two with a rationale and a first test.

## Mechanism

Selection is convergence. The evidence on how to do it well is mixed.

Tree of Thoughts shows that searching over candidate states with an evaluator can produce a large gain on a narrow reasoning task: Game of 24 success rose from 4% with chain of thought to 74% with breadth 5. That result depends on a reliable state evaluator and a task with a checkable goal.

Open-ended ideas do not have a reliable evaluator. The novelty-judge study finds that small prompt changes swing pairwise accuracy by more than 50 points, that the same prompt can help one judge and hurt another, and that stronger retrieval and more reasoning help little. A deep search over a noisy evaluator would amplify the noise.

So the pipeline selects shallowly: one scoring pass, a tie-break rule, and one or two winners. It uses explicit criteria instead of a single "which is best" judgment.

## Experimental setup: Tree of Thoughts

| Item | Value |
|---|---|
| Model | GPT-4 |
| Tasks | Game of 24, creative writing, mini crosswords |
| Search | BFS with breadth b, or DFS with pruning |
| Evaluator | The model itself, prompted to evaluate states |
| Game of 24 | 100 tasks; success if the expression reaches 24 |

## Exact numbers: Tree of Thoughts

Game of 24 success:

| Method | Success |
|---|---|
| IO prompting | 7.3% |
| CoT | 4.0% |
| CoT + self-consistency | 9.0% |
| ToT, breadth 1 | 45% |
| ToT, breadth 5 | 74% |

Mini crosswords: IO and CoT below 16% word-level success; ToT 60% word-level success, solving 4 of 20 games. The oracle best DFS state solved 7 of 20.

## Experimental setup: LLM judges

Zheng et al. (2023) introduce MT-bench and Chatbot Arena and compare strong LLM judges with human preferences.

| Item | Value |
|---|---|
| Judge models | GPT-4, GPT-3.5, Claude-v1 |
| Benchmarks | MT-bench (controlled), Chatbot Arena (crowdsourced) |
| Human votes | 3K controlled expert votes, 3K crowdsourced votes |
| Agreement metric | Pairwise agreement with human preference |

## Exact numbers: LLM judges

- GPT-4 judge agreement with humans exceeded 80%, the same level as human–human agreement.
- Position bias: all judges showed it; most favored the first position. Only GPT-4 produced consistent results in more than 60% of cases when the order was swapped.
- Few-shot judging raised GPT-4's consistency from 65.0% to 77.5%.
- Verbosity bias: all judges were vulnerable to a "repetitive list" attack; GPT-4 defended better than the others.
- Self-enhancement bias: the study could not determine it due to limited data and small differences.

## Exact numbers: novelty judges

Sternlicht et al. (2026) run a controlled study of six judge backbones, pointwise and pairwise, on human-authored and LLM-generated ideas.

- Small prompt changes swung pairwise accuracy by more than 50 points. On Human+Generated, swapping a reviewer-framed prompt for a neutral one produced a 52.6-point gap; the judges disagreed on 55.8% of pairs.
- The same change helped one judge and hurt another.
- Lowering reasoning effort cost at most 7 points and was usually neutral. Retrieval gave at most 16 points and only for some models.
- Two purpose-built novelty evaluators were outperformed by the cheapest prompted baseline by 8 to 29 macro-F1 points, at up to 32× lower cost.
- Even strong judges tied on 35% of pairs; weaker judges tied on more than half.
- An expert spot check of 30 hard pairs agreed with the human idea in all 30 and judged none of the generated ideas novel.

## Known limitations and conflicting results

- Tree of Thoughts is a search method for tasks with a checkable goal. Its 74% does not transfer to open-ended ideation.
- LLM judges are unstable on novelty. A single judge score is weak evidence.
- Pairwise judging is more stable than pointwise on human-authored ideas, but the instability persists on generated ideas.
- The pipeline's four-dimension rubric is an engineering construct. It is not a validated psychometric scale.
- Selection can still pick the consensus answer if usefulness dominates. The novelty score is relative to the consensus list, which limits that failure but does not remove it.

## Prompt wording that produced the best results

The plugin's scoring rubric is in `skills/jarvis-converge/SKILL.md`. It defines each dimension from 1 to 5, with novelty anchored to the consensus list and the stored ideas. It is an engineering construct, not a quoted prompt.

The ToT paper's propose/evaluate/search prompts are task-specific and are in its appendix. They are not reproduced here.

## Design consequence

The pipeline scores once and returns one or two winners. It breaks ties in the order evidence, usefulness, novelty, surprise. It reports the biggest risk and the cheapest first test. It does not run a multi-round tournament over LLM judges.

## Citations

- Yao, S., Yu, D., Zhao, J., Shafran, I., Griffiths, T. L., Cao, Y., Narasimhan, K. (2023). *Tree of Thoughts: Deliberate Problem Solving with Large Language Models.* arXiv:2305.10601. https://arxiv.org/abs/2305.10601
- Zheng, L., et al. (2023). *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena.* arXiv:2306.05685. https://arxiv.org/abs/2306.05685
- Sternlicht, N., Shahid, S., Jansen, P., Weld, D. S., Siangliulue, P., Hope, T. (2026). *Old Ideas, Novel Problems: The Instability of LLM-Based Novelty Evaluation.* arXiv:2610.02022. https://arxiv.org/abs/2610.02022
