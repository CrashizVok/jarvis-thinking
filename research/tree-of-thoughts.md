# Tree of Thoughts

## What it is

Represent a problem as a tree of intermediate thoughts. At each step, propose several thoughts, evaluate them, and search with breadth-first or depth-first search, including backtracking.

## Mechanism

Chain of thought follows one path. Tree of Thoughts maintains several paths and uses the model as a state evaluator. The search can look ahead, prune, and backtrack. The mechanism requires a task where an intermediate state can be evaluated as more or less promising.

## Experimental setup

| Item | Value |
|---|---|
| Model | GPT-4 |
| Tasks | Game of 24, creative writing, 5×5 mini crosswords |
| Search | BFS with breadth b for Game of 24 and creative writing; DFS with pruning for crosswords |
| Evaluator | The model, prompted to evaluate states |
| Game of 24 | 100 tasks; success if the expression reaches 24 |
| Creative writing | 100 prompts; coherence scored by GPT-4 on a 1–10 scale, with a human comparison |

## Exact numbers

Game of 24:

| Method | Success rate |
|---|---|
| IO prompting | 7.3% |
| CoT | 4.0% |
| CoT + self-consistency | 9.0% |
| ToT, breadth 1 | 45% |
| ToT, breadth 5 | 74% |

Mini crosswords: IO and CoT below 16% word-level success; ToT 60% word-level success, solving 4 of 20 games. The oracle best DFS state solved 7 of 20.

Creative writing: ToT was preferred by humans over CoT in a pairwise comparison. The exact preference percentages are in the paper's Figure 5 and were not extracted here. The direction is the verified claim.

## Known limitations and conflicting results

- The evaluator is the same model. On tasks without a checkable goal, the evaluator is noisy.
- Search cost is a multiple of a single chain. The paper's Game of 24 runs use many model calls per task.
- The tasks are narrow and have a checkable success condition. The result does not transfer to open-ended ideation.
- A deep search over a noisy novelty judge is risky. The novelty-judge study shows large instability from small prompt changes.

## Relevance to the plugin

The plugin uses ToT as evidence that search over candidates can help when an evaluator is reliable. It does not implement a tree search, because open-ended ideas lack a reliable evaluator. It uses a shallow scored selection instead.

## Citation

- Yao, S., Yu, D., Zhao, J., Shafran, I., Griffiths, T. L., Cao, Y., Narasimhan, K. (2023). *Tree of Thoughts: Deliberate Problem Solving with Large Language Models.* arXiv:2305.10601. https://arxiv.org/abs/2305.10601
