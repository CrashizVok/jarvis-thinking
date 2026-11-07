---
name: Jarvis persist
description: Persistence phase of the jarvis pipeline. Write accepted ideas to .jarvis/ideas.md with timestamp, topic, summary, scores, sources, and a fingerprint.
---

# Persist accepted ideas

Use this last. Only accepted ideas go in. Rejected ideas stay in the conversation, not in the file.

## Procedure

1. Build one entry per winner.
2. Call `jarvis_persist` with the entries and the file `{{ideasFile}}`.
3. If the tool fails, print the exact Markdown block and tell the user where to paste it. Do not pretend the write succeeded.
4. Re-read the file only if the user asks. The tool returns the path and the count.

## Entry

```json
{
  "topic": "the decision this idea serves",
  "title": "short name",
  "summary": "one or two sentences",
  "signature": "3 to 5 concept words",
  "novelty": 4,
  "usefulness": 5,
  "sources": ["https://..."],
  "fingerprint": "optional short hash"
}
```

The tool adds the timestamp. If the fingerprint is missing, the tool computes one from the normalized title and summary.

## Markdown shape

```markdown
## 2026-11-07T12:00:00.000Z — topic

- Title: short name
- Summary: one or two sentences.
- Signature: concept words
- Novelty: 4/5 · Usefulness: 5/5
- Sources: https://...
- Fingerprint: a1b2c3d4
```

## Dedup on write

The tool runs the same similarity check before appending. If an entry is a duplicate of something already in the file, it is skipped and reported. Do not bypass this by writing the file by hand unless the tool is unavailable.

## Failure handling

- File is read-only: print the block and the error. Do not retry in a loop.
- The directory does not exist: the tool creates it.
- The entry has no sources: allow it, but write `Sources: none` so the gap is visible.
- The user does not want persistence: skip this phase and say that nothing was written.

## What not to store

- Raw conversation.
- Rejected ideas.
- Personal data from the user's prompt.
- Anything the user asked to keep out of the repository.
