# jarvis-thinking

An OpenCode plugin that makes cloud models ideate like researchers instead of answering from the memorized average.

Models trained on human text learn which answers are common. Ask one for ideas and the same short list tends to come back: the habit tracker, the marketplace for unused space, the dashboard that shows emissions. Researchers call this mode collapse. A 2025 study of open-ended prompts found that in 79% of cases, the average pairwise similarity between responses from the same model was above 0.8 (Jiang et al., arXiv 2510.22954). A cloud model gives you no logits and no sampler settings, so the intervention has to happen in the prompt and in the process around it.

The plugin has four parts:

- A prompt classifier that attaches a full pipeline when the request is open-ended, one that starts with research and ends with convergence.
- Fourteen technique skills, one for each intervention in that pipeline.
- Deterministic tools for deduplication, persistence, random stimuli and status.
- A `jarvis` agent and the commands that force or disable the pipeline.

It never reads logits, never sets temperature and never calls a model on its own. It works with any cloud model that has tools and file access.

## Install

From a local checkout:

```sh
git clone <this-repo> jarvis-thinking
cd jarvis-thinking
npm install
```

Add the plugin to `opencode.json` or `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    {
      "package": "/absolute/path/to/jarvis-thinking",
      "options": {
        "candidateCount": 5,
        "personaCount": 3
      }
    }
  ]
}
```

A relative path resolves from the config file that contains it. The package can also be published to npm and installed with `opencode plugin add jarvis-thinking`.

Restart OpenCode or let it reload. The plugin registers its skills, its tools and its commands during setup.

### The jarvis agent

The plugin API has no way to create an agent at runtime, so the agent is a Markdown file that the installer copies into the project.

Install it with the command:

```text
/jarvis-install-agent
```

Or copy it yourself. The destination path is relative to the root of the project.

```sh
mkdir -p .opencode/agents
cp agents/jarvis.md .opencode/agents/jarvis.md
```

Or set `installAgent: true` in the plugin options and the plugin writes it on setup if it is missing.

Start a new session and select `jarvis`, or run a command with `--agent jarvis`.

## Use

Type an open-ended request. The prompt hook classifies it and attaches the pipeline skill before the model sees it.

Examples that trigger:

- "Brainstorm ten ideas for a subscription service for busy parents."
- "How might we make onboarding less annoying?"
- "Research the literature on retrieval augmented generation for scientific ideation."
- "Design a strategy for entering the Japanese market."

Examples that do not trigger:

- "Fix the failing test in auth.test.ts"
- "Rename this function to parseConfig"
- "What is the capital of France?"
- "Run npm test"

### Commands

| Command | What it does |
|---|---|
| `/jarvis <topic>` | Forces the pipeline once, even for a prompt the classifier would skip |
| `/jarvis-off` | Disables automatic triggering for the session |
| `/jarvis-on` | Restores automatic triggering |
| `/jarvis-status` | Shows the mode, the last trigger decision, and the active parameters |
| `/jarvis-install-agent` | Writes `agents/jarvis.md` to `.opencode/agents/jarvis.md` if missing |

### Tools

| Tool | What it does |
|---|---|
| `jarvis_dedup` | Compares candidates against each other and `.jarvis/ideas.md`; returns the nearest match and score |
| `jarvis_persist` | Appends accepted ideas with timestamp, scores, sources, and fingerprint; skips duplicates |
| `jarvis_ideas` | Returns a compact digest of stored ideas, optionally filtered |
| `jarvis_stimulus` | Returns a random surprising keyword, negative keyword, noun, opposite assumption, and extreme constraint |
| `jarvis_status` | Returns the config, the last trigger decision, and the stored idea count |

## How auto-triggering works

The classifier is a weighted rule list in `src/trigger.ts`. Positive rules cover ideation verbs, requests for ideas, strategy language, requests for research, comparisons, content creation, novelty cues, and open-ended question forms. Negative rules cover mechanical edits, sessions spent debugging, paths to code and files, plus shell commands and concrete artifacts.

The score is the sum of matching weights. The default threshold is 2.5. A prompt at or above the threshold gets `jarvis-pipeline` attached to its skill list. `force` and `off` short-circuit.

The classifier is deterministic and testable. `tests/trigger.test.ts` has 33 cases. `eval/trigger-labels.ts` has 42 labelled prompts; the evaluation reports precision 1.000, recall 0.810, F1 0.895 on that set. Those labels are the author's judgment, not a human-annotated benchmark.

To change the behavior:

- Add a rule in `src/trigger.ts` and a test in `tests/trigger.test.ts`.
- Add `extraTriggerPatterns` or `extraNegativePatterns` in the plugin options for project-specific vocabulary.
- Change `triggerThreshold`.

A false negative costs one manual `/jarvis`. A false positive costs a phase 0 paragraph before the model says the task is mechanical.

## Configuration

All options are optional. Values are read from `ctx.options` and can be overridden by environment variables where noted.

| Option | Default | What it controls |
|---|---|---|
| `enabled` | `true` | The master switch for the whole plugin. Setting `JARVIS_DISABLED=1` turns the plugin off. |
| `autoTrigger` | `true` | Attach the pipeline to a matching prompt automatically. The commands still work when this is false. |
| `triggerThreshold` | `2.5` | The score at or above which a prompt counts as open-ended. The default threshold is 2.5. |
| `extraTriggerPatterns` | `[]` | Regular expressions that add 3 points to the score each time one of them matches. |
| `extraNegativePatterns` | `[]` | Regular expressions that subtract 3 points from the score each time one of them matches. |
| `candidateCount` | `5` | The number of candidate ideas that the model returns in each verbalized-sampling call. |
| `lowProbabilityCandidates` | `2` | The number of candidates that must sit below the probability threshold in each call. |
| `probabilityThreshold` | `0.10` | The probability ceiling that the tail candidates must sit below. |
| `personaCount` | `3` | The number of deliberately different expert viewpoints that the model uses. |
| `brainwritingRounds` | `3` | The number of divergent rounds that come before the synthesis. |
| `brainwritingMode` | `"simulated"` | Use `"simulated"` when one model plays every role, or `"multi-agent"` when the roles are real subagents. |
| `outOfBox` | `true` | Use the short defixation branch in the divergence phase of the pipeline. |
| `stimuli` | `true` | Use surprising and negative keywords plus a random stimulus in the divergence phase. |
| `extremeConstraints` | `true` | Use an opposite assumption and an extreme constraint in the divergence phase. |
| `consensusExclusion` | `true` | Write the typical answers first, then exclude them from the pool of candidates. |
| `consensusCount` | `3` | The number of typical answers that the model records before it generates. |
| `dedupThreshold` | `0.82` | The similarity at or above which two ideas count as duplicates. `JARVIS_DEDUP_THRESHOLD` overrides it. |
| `useEmbeddings` | `false` | Use an embedding endpoint for dedup. Setting `JARVIS_EMBEDDING_URL` turns it on. |
| `embeddingEndpoint` | unset | The URL of an OpenAI-compatible `/embeddings` endpoint that the plugin calls. |
| `embeddingModel` | `text-embedding-3-small` | The name of the embedding model that the endpoint serves. |
| `embeddingApiKeyEnv` | `JARVIS_EMBEDDING_API_KEY` | The name of the environment variable that holds the key for the endpoint. |
| `ideasFile` | `.jarvis/ideas.md` | The path to the file where accepted ideas are stored. `JARVIS_IDEAS_FILE` overrides it. |
| `recentIdeasInContext` | `12` | The number of stored ideas in the digest that `jarvis_ideas` returns. |
| `selectionCount` | `2` | The number of winners that the convergence phase returns to the user. |
| `researchRequired` | `true` | Require a research phase before the model starts to generate ideas. |
| `researchMinSources` | `5` | The minimum number of sources that the research phase needs when search works. |
| `persist` | `true` | Write the accepted ideas to the ideas file at the end of the pipeline. |
| `installAgent` | `false` | Write `agents/jarvis.md` to the project on setup if it is missing. |
| `debug` | `false` | Log the trigger decisions to stderr when the plugin runs. |

### Embeddings

The default dedup is lexical and works offline. It blends IDF-weighted token cosine, character 4-gram Jaccard, and the model-supplied concept signature. It catches paraphrases that keep the same content words. It misses deep synonymy.

For semantic matching, point the plugin at an OpenAI-compatible embeddings endpoint:

```jsonc
{
  "plugins": [
    {
      "package": "/absolute/path/to/jarvis-thinking",
      "options": {
        "useEmbeddings": true,
        "embeddingEndpoint": "https://api.openai.com/v1/embeddings",
        "embeddingModel": "text-embedding-3-small",
        "embeddingApiKeyEnv": "OPENAI_API_KEY"
      }
    }
  ]
}
```

The endpoint receives the title, the summary and the signature of each idea. The vectors are cached at `.jarvis/embeddings.json`. If the call fails, dedup falls back to the lexical score and says so in the result.

## The pipeline

The pipeline is a skill, not a tool. The model reads it and follows it. It has eleven phases:

1. Frame the decision.
2. Research primary sources.
3. Write the consensus baseline.
4. Pick personas and stimuli.
5. Divergent generation with verbalized sampling.
6. Three brainwriting rounds.
7. Deduplicate against `.jarvis/ideas.md`.
8. Justify the difference from the consensus.
9. Critique and repair.
10. Score and select one or two winners.
11. Persist the winners.

The orchestrator is `skills/jarvis-pipeline/SKILL.md`. Each technique is a separate skill in `skills/`, and each one carries a description precise enough for the model to load it on its own. The pipeline names the skill to load at each phase, so the model never has to guess which instruction applies.

## ideas.md

Accepted ideas are stored as plain Markdown:

```markdown
## 2026-11-07T12:00:00.000Z — reusable packaging

- Title: Deposit-free crate pool
- Summary: A shared crate pool for small grocers that replaces deposits with a
  per-trip fee and a pickup route.
- Signature: shared crates small grocers pickup
- Novelty: 4/5 · Usefulness: 4/5
- Sources: https://example.com/a
- Fingerprint: a1b2c3d4e5f6
```

Add `.jarvis/` to your project `.gitignore` if you do not want the record in version control. The plugin does not edit your `.gitignore`.

The dedup tool compares against the full file, not only the recent digest. The persist tool deduplicates before appending. Both use the same threshold.

## Failure handling

| Failure | Behavior |
|---|---|
| Search unavailable | The model says so and marks unsupported claims `UNVERIFIED` |
| Malformed model output | The skill asks for one repair, then records the shortfall |
| Dedup tool fails | The model compares manually and says it did |
| Embedding endpoint fails | Lexical fallback, reported in the tool result |
| Ideas file missing | No existing matches; persist creates the file |
| Persist fails | The exact Markdown block is printed; no false success |
| Nothing survives critique | An honest empty result and the constraint that killed the pool |

## Extending

### Add a technique skill

1. Create `skills/<id>/SKILL.md` with frontmatter `name` and `description`.
2. Add the id to `SKILL_IDS` in `src/skills.ts`.
3. Add a test in `tests/skills.test.ts`.
4. If the pipeline should load it, add a line to `skills/jarvis-pipeline/SKILL.md`.

### Add a trigger rule

1. Add a `TriggerRule` to `RULES` in `src/trigger.ts`.
2. Add positive and negative examples to `tests/trigger.test.ts`.
3. Run `npm run test:run`.

### Add a tool

1. Add an `editor.add` block in `src/tools.ts`.
2. Add a test for the pure logic in `tests/`.
3. Run `npm run typecheck`.

### Change a default

Edit `src/config.ts` and update the table in `docs/design.md` with the reason. If the default comes from a paper, cite the paper. If it is an engineering choice, say so.

## Development

```sh
npm install
npm run typecheck
npm run test:run
npm run eval -- --reps=1
```

The plugin targets OpenCode 2.x and `@opencode/plugin@2.2.5`, and it does not implement the V1 `server()` export. The V1 API is different enough that a dual implementation would double the surface for no benefit in this environment.

## Limits

- The trigger classifier is English-centric. A multilingual version needs its own test table.
- The full pipeline has not been tested as a unit against a human baseline. In the 2026 run it raised embedding diversity (0.692 against 0.634 for plain) and cross-run novelty (0.477 against 0.057), and it did not raise judged usefulness (3.254 pooled, 3.480 selected, against 3.375). `docs/results.md` reports the measured numbers and the caveats. In that run it raised embedding diversity from 0.634 to 0.692 and cross-run novelty from 0.057 to 0.477, and judged usefulness stayed flat (3.254 against 3.375), so no result here supports a usefulness claim.
- Keyword stimuli, the out-of-box instruction and brainwriting raised cross-run novelty and lowered judged usefulness in the same run. They stay in the pipeline because a brief that asks for range wants them, and the cost is measured rather than hidden.
- The default dedup is lexical. It misses synonymy. Use embeddings if that matters.
- LLM novelty judges are unstable. The evaluation uses two judges and a manual spot-check protocol, not a single score.
- The plugin does not set temperature or top-p. If a provider exposes them, set them yourself. The pipeline is designed to work without them.

## Documentation

- `docs/architecture.md`: the OpenCode mechanisms and why each was chosen.
- `docs/design.md`: the evidence-based design, parameter defaults, and interactions.
- `docs/sources.md`: every source and the decision it supports.
- `docs/results.md`: the evaluation summary and caveats.
- `research/`: one file per technique with the setup, the statistics, the limitations and the prompt wording.
- `eval/README.md`: how to run the evaluation and the manual spot check.
