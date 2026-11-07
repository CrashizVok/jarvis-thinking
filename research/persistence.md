# Persistence to ideas.md

## What it is

Append accepted ideas to a plain Markdown file with a timestamp, topic, title, summary, concept signature, scores, sources, and a fingerprint. Deduplicate before writing.

## Mechanism

This is an engineering choice, not an experimentally validated technique. No paper in this set tests whether persisting ideas improves later ideation. The rationale is:

1. A stable record makes duplicate detection possible across sessions.
2. A record of sources makes later claims auditable.
3. A record of rejected ideas is lost by design, but the accepted set gives a baseline for the next run.

The survey of scientific idea generation notes that evaluation lacks standardized metrics and that current methods remain at combinatorial or exploratory levels. A persistent record does not fix that, but it makes a longitudinal comparison possible: the same topic can be scored against the ideas that already exist.

## Format

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

The parser is tolerant. Missing fields are allowed. Unknown bullets are ignored. A hand-written entry without a timestamp still loads.

## Fingerprint

The fingerprint is the first 12 hex characters of SHA-256 over the normalized title and summary. It is a cheap identity check, not a security feature. Its purpose is to catch the same idea re-entering through a different phrasing when the similarity score is borderline.

## Dedup on write

`jarvis_persist` runs the same hybrid similarity check as `jarvis_dedup` against the existing file. Duplicates are skipped and reported. This prevents the file from becoming a log of every run.

## Known limitations

- The file grows without bound. A future version should archive by quarter or by topic.
- Concurrent writes by two sessions can interleave. The tool appends one block per call, which is atomic enough for small writes on a local filesystem, but not a database guarantee.
- Personal data can enter the file if the user's prompt contains it. The skill tells the model not to store personal data, but that is an instruction, not a filter.
- Stale ideas stay in the file. The dedup check treats them as current. A future version should support a `status: retired` field.
- The fingerprint is not collision-proof. It is a convenience, not an identity system.

## Design consequence

The pipeline persists only accepted ideas, after selection. It prints the exact Markdown block if the write fails. It never claims a write succeeded without checking the tool result.

## Citation

- Shahhosseini, F., et al. (2026). *Large Language Models for Scientific Idea Generation: A Creativity-Centered Survey.* arXiv:2511.07448. https://arxiv.org/abs/2511.07448
