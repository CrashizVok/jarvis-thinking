---
name: Jarvis dedup
description: Deduplication phase of the jarvis pipeline. Compare candidates against each other and against .jarvis/ideas.md with semantic similarity, not string matching.
---

# Deduplication against ideas.md

Use this after brainwriting and before critique.

## Procedure

1. Build the candidate array. Every candidate needs `title`, `text`, and a 3 to 5 word `signature` that names the concept, not the phrasing. Example: "subscription sleep coaching for shift nurses".
2. Call `jarvis_dedup` with the candidates and the threshold `{{dedupThreshold}}`.
3. Read the result. For every dropped candidate, keep the nearest match and the score. Do not delete the record; it goes into "What I rejected".
4. If the tool is unavailable, compare manually: normalize the wording, remove stop words, and ask whether two ideas would be built by the same team with the same first step. Say that you did it manually.
5. Re-run the check after any repair in the critique phase. A repair can accidentally recreate an existing idea.

## Tool input

```json
{
  "ideas": [
    {
      "title": "short name",
      "text": "one or two sentences",
      "signature": "concept words"
    }
  ],
  "threshold": {{dedupThreshold}},
  "file": "{{ideasFile}}"
}
```

The tool compares against the stored ideas file and against earlier candidates in the same call.

## What the score means

The default score blends three signals:

- IDF-weighted token cosine: shared content words, down-weighted when a word is common in the corpus.
- Character 4-gram Jaccard: catches inflection and small edits.
- Concept signature overlap: catches the same idea described with different nouns.

When an embedding endpoint is configured, the tool also uses vector cosine and blends it in. The default is lexical because it works offline. It will miss deep synonymy, so the signature matters: write it carefully.

The threshold is a calibrated engineering default, not a research constant. It is documented in docs/results.md.

## What to do with a duplicate

- Exact duplicate: drop the later one.
- Same mechanism, different audience: keep both only if the audience change changes the first test. Otherwise drop the weaker one.
- Same idea, better evidence: keep the better-evidenced one and merge the source.
- Same idea in a different category: this is a false negative. Keep it and lower the signature overlap by making the mechanism explicit.

## Failure handling

- The ideas file is missing or empty: the tool returns no existing matches. That is a normal first run. Do not create the file just to have one; the persist step will create it.
- The tool times out: continue with the main pool and record the missed check.
- The embedding endpoint fails: the tool falls back to lexical similarity. Mention the fallback in the process counts.
