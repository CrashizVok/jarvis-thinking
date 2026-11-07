# Architecture

## Platform facts

Verified against the installed OpenCode 2.2.5 and the official documentation on 2026-11-07.

| Fact | Source |
|---|---|
| Plugin entry is `Plugin.define({ id, setup(ctx) })`; `setup` may return a cleanup function | https://opencode.ai/docs/build/plugins/server/ |
| Plugin context is the server client plus transforms and hooks | https://opencode.ai/docs/build/plugins/server/ |
| Skills can be added with `ctx.skill.transform` and an `editor.add` call | https://opencode.ai/docs/build/plugins/server/ |
| Commands can be added with `ctx.command.transform` and an `execute` callback | https://opencode.ai/docs/build/plugins/server/ |
| Tools can be added with `ctx.tool.transform`, a namespace, and an `execute` callback | https://opencode.ai/docs/build/plugins/server/ |
| A prompt hook runs before attachment and skill resolution and can mutate `prompt.text`, `prompt.files`, and `prompt.skills` | https://opencode.ai/docs/build/plugins/server/ |
| Agent definitions are Markdown files in `.opencode/agents/<name>.md`; the agent editor has no `add` | https://opencode.ai/docs/agents/ and the `@opencode/plugin@2.2.5` type definitions |
| Plugin options arrive through the object form in `opencode.json(c)` and are read from `ctx.options` | https://opencode.ai/docs/build/plugins/ |
| Project plugins can be a local directory with a `package.json` export | https://opencode.ai/docs/build/plugins/ |
| V2 does not require a build step for a TypeScript plugin entry | Tested with a local package in OpenCode 2.2.5 |

Where the documentation left a detail open, the type definitions in `node_modules/@opencode/plugin@2.2.5` were the final authority. The documentation and the types agreed on the hook names and on the shape of the transform editors, so the implementation follows both of them rather than guessing at either.

## Mechanism choice per part

| Part | Mechanism | Why this one | Alternatives rejected |
|---|---|---|---|
| Automatic trigger | `ctx.session.hook("prompt")` and an explicit classifier | The hook runs before the model sees the prompt, can attach a skill without rewriting the user's text, and runs for commands that submit through `session.prompt` | A system-prompt hook (cannot tell one prompt from the next cleanly); a custom tool the model must remember to call (not automatic); an event listener (no admission point) |
| Technique instructions | One skill per technique, registered from real `SKILL.md` files | Skills are the documented reusable-instruction unit, they can be advertised by description, and the model can load them at the phase where they apply | One giant skill (hard to maintain, hard to load partially); a single system prompt (no phase control) |
| Pipeline orchestration | One pipeline skill that names the phase skills | Keeps the automatically attached context small, gives the model a precise order, and lets each technique stay independently testable | Attaching all 15 skills to every prompt (context cost, attention dilution); a custom tool that calls the model internally (would bypass the session's tools and context) |
| Manual controls | `ctx.command.transform` with `/jarvis`, `/jarvis-off`, `/jarvis-on`, `/jarvis-status`, `/jarvis-install-agent` | Commands are the documented manual entry point and can write session state | Editing config files per run; a tool the model must call |
| Dedup, persistence, randomness, status | Custom tools under the `jarvis` namespace | These need deterministic code and file access, not model judgment | Asking the model to compare strings (unreliable); a separate CLI (breaks the flow) |
| Custom agent | Shipped `agents/jarvis.md`, installed by `/jarvis-install-agent` or the `installAgent` option | The V2 agent editor has no `add`, and Markdown is the documented definition format | Pretending a plugin can register an agent at runtime; a hidden system prompt only |
| Session mode | `ctx.storage` keys scoped by session | Survives the turn, does not touch the user's config, and is readable from the prompt hook and the commands | A file per session (more I/O); an environment variable (not session-scoped) |
| Persistence | Plain Markdown at `.jarvis/ideas.md` | Human-readable, diffable, no database, easy to inspect and back up | SQLite (overkill, opaque); JSONL (less pleasant to read) |
| Similarity | Hybrid lexical score plus optional embeddings | Works offline with no key; embeddings add recall when configured | Embeddings only (network dependency); exact match only (misses paraphrases); LLM judge per pair (slow and unstable) |

## Trigger path

```
user prompt
  -> session.hook("prompt")
     -> read session mode from storage (auto / force / off)
     -> skip if child session
     -> classifyPrompt(text, config, mode)
        -> weighted rule list
        -> score >= threshold
     -> if trigger and the pipeline skill exists:
           append { id: "jarvis-pipeline" } to event.prompt.skills
     -> store the decision for /jarvis-status
  -> OpenCode resolves the skill and adds its body to the conversation
  -> model runs the pipeline
```

The classifier is a pure function with no model call, no randomness and no hidden state. That matters for testing: given the same prompt, the same configuration and the same session mode, it returns the same decision every time. The rules and their weights live in `src/trigger.ts`, and the test table that pins them down lives in `tests/trigger.test.ts`.

## Why the hook does not rewrite the prompt

The hook can edit `prompt.text`. The plugin does not, for three reasons:

1. Rewriting the user's text makes the transcript lie about what was asked.
2. A skill attachment is visible in the session export and can be removed by the user.
3. The skill content is versioned in the package; a text injection would be a second copy.

The only mutation is the skill attachment, which leaves the transcript honest about what the user typed. The docs say skills added by a hook follow the normal resolution and validation path, and the tested session export showed the pipeline body in the `skills` array of the user message. A reader of that export can see exactly which instructions the model received, and a user who does not want them can turn the plugin off for the session.

## Why the plugin does not call a model

`ctx.experimental.generate.text` exists and could run a separate pipeline. The plugin does not use it:

- It would double the model cost.
- It would lose the session's tools and research context.
- It would make the pipeline a black box instead of visible work.

The only model calls are the ones the session already makes. The plugin's tools are deterministic.

## Skill paths

Skills are registered with `content` inline and a `path` that points to a materialized copy at `.jarvis/skills/<id>.md`. The first version pointed at the package directory, and in a real session the model tried to read the package files. That read sat outside the project, so it triggered `external_directory` permission prompts in the middle of the pipeline. Materializing the rendered copy inside the project keeps every skill file readable without leaving the project or asking the user for permission. The copy is regenerated whenever the rendered content changes, so a stale file cannot outlive an edit to the source skill.

## Agent registration

`ctx.agent.transform` exposes `list`, `get`, `update`, `remove`, and `default`. It has no `add`. A plugin cannot create an agent at runtime through the documented API. The plugin ships `agents/jarvis.md` and provides:

- `installAgent: true` to write it into `.opencode/agents/jarvis.md` during setup when missing,
- `/jarvis-install-agent` to do the same on demand,
- a manual copy instruction in the README.

The agent is optional. The pipeline works without it because the prompt hook attaches the pipeline skill.

## Failure boundaries

| Failure | Behavior |
|---|---|
| Skill file missing | The plugin logs it (debug mode), skips that skill, and does not attach the pipeline if the pipeline itself is missing |
| Agent install fails | The command reports the error in a synthetic message; setup logs it and continues |
| Storage unavailable | The trigger still classifies and attaches; the decision record is skipped |
| Session read fails | The child-session check is skipped; the prompt is treated as a top-level prompt |
| Ideas file missing | Dedup returns no existing matches; persist creates the directory and header |
| Embedding endpoint fails | Dedup falls back to the lexical score and says so in the result |
| Invalid user regex | That rule is ignored; the rest of the classifier still runs |
| Malformed model output | The skill tells the model to repair once, then record the shortfall; the plugin itself does not parse model output |

A tool failure does not stop the prompt hook, and a missing skill does not stop a command. The prompt hook still classifies the prompt and still attaches the skills that exist. The pipeline skill then tells the model what to do when a tool is unavailable, which is why a run can finish with a lexical comparison after an embedding endpoint fails. That separation is also why the prompt hook and the pipeline skill can be tested apart from each other.

## Version target

The package targets OpenCode 2.x, specifically `@opencode/plugin@2.2.5`. It does not implement the V1 `server()` export. The V1 API is different enough that a dual implementation would double the surface for no benefit in this environment.

## Two invariants

Two rules hold across the whole plugin. The prompt hook only decides, and the pipeline skill only instructs. The prompt hook never rewrites the user's words, and the pipeline skill never runs code. Everything else is a command, a tool or a stored record, and each of those stays outside the model's context until the model asks for it. That split is what keeps the trigger cheap, the pipeline auditable, and a failure in one part from taking down the other.
