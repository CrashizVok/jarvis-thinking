# Build plan

This file tracked the build. It is not part of the user-facing documentation.

## Phase 0
- Read OpenCode 2.2.5 docs: plugins, server API, hooks, skills, agents, commands.
- Confirm the API against the installed `@opencode/plugin@2.2.5` type definitions.
- Write docs/architecture.md.

## Phase 1
- Verify every seed source.
- Write research/<technique>.md for 14 techniques plus supplementary papers.
- Mark unverifiable numbers UNVERIFIED.

## Phase 2
- Write docs/design.md from verified findings.
- Make every parameter configurable with a cited default or an explicit engineering default.

## Phase 3
- Implement trigger, skills, commands, tools, persistence, dedup.
- Ship the jarvis agent and installer.

## Phase 4
- Build eval/ harness.
- Run plain, each technique, and full pipeline on fixed tasks with repeats.
- Store raw results and write docs/results.md.

## Phase 5
- README, docs/sources.md.
- Run tests, typecheck, eval.
- Re-read docs and remove unverified claims.
