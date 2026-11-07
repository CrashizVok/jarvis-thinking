---
name: Jarvis research
description: Research phase of the jarvis pipeline. Search primary sources, build an evidence table, and find the consensus view before any idea is generated.
---

# Research first

Use this before generating ideas. The point is to replace the model's memorized average with current, citable evidence.

## Procedure

1. Write the question as a decision, not a topic: "Which <approach> should <audience> use to <outcome> under <constraint>?"
2. Run at least three searches:
   - state of the art: `<topic> survey 2025 2026`
   - failed attempts: `<topic> failure limitations postmortem`
   - opposing view: `<topic> criticism does not work`
3. Open the most relevant results. Prefer papers, official docs, standards, and primary data over listicles.
4. For each source, record: title, URL, publication date, source type, and the one claim you will use.
5. Write the consensus in three sentences. This becomes the exclusion set in phase 2.
6. Write the strongest disagreement with the consensus. This becomes a candidate branch.

## Evidence table

Keep this table in your working notes. Do not show it unless the user asks.

| Claim | Source | Date | Type | Confidence |
|---|---|---|---|---|
| ... | URL | ... | paper / docs / data / news | high / medium / low |

A claim with no source is `UNVERIFIED`. Do not use it to justify a design choice.

## Search prompt

Use this wording when the search tool accepts a query:

```
Find primary sources about <topic>. I need: (1) the current state of the art,
(2) documented failures and limitations, (3) the strongest criticism of the
mainstream view. Prefer papers, official documentation, and primary data.
Return title, URL, date, and one relevant claim per source.
```

## Failure handling

- Search unavailable: say "Search is unavailable, so the following claims come from model memory and are unverified" in one line. Continue, but mark claims.
- No results: broaden the query once, then record the gap. A gap is a finding.
- Paywalled source: use the abstract or the official summary and say which you used.
- Conflicting sources: report both and name the disagreement. Do not average them into a false consensus.

## What this buys

The survey of LLM scientific ideation groups knowledge augmentation as one of five method families, and notes that retrieval grounds outputs and supplies material for recombination. The Artificial Hivemind study found cross-model output similarity of 71% to 82%, which is what a shared training prior looks like. Fresh sources are one of the few inputs that can move an idea outside that shared region.

Do not claim that research alone guarantees novelty. It does not. It changes the raw material.
