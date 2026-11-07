---
name: Jarvis persona CoT
description: Chain-of-thought revision phase of the jarvis pipeline. Generate short idea titles, then force them to become bolder and more different before expanding.
---

# Persona plus chain of thought

Use this after personas and before critique. It targets fixation: the tendency of a session to keep elaborating its first idea.

## Why short titles first

The persona study's CoT procedure asks for short titles before full descriptions. Elaborating early creates more tokens that anchor the rest of the session. A title is cheap to replace. A paragraph is not.

## Exact prompt

This is the prompt used in the persona study, Appendix J, adapted:

```
You are acting as this persona: {{persona}}

Generate ideas from this persona's perspective using chain of thought reasoning.
Follow these steps:

1. First, think about what this persona would value based on their
   characteristics.
2. Generate a list of {{candidateCount}} ideas (short titles only).
3. Review and refine the ideas to make them bolder and more different.
   Ensure that no two ideas are the same.
4. Consider how this persona would uniquely approach or modify each idea.

Return ONLY a JSON array with {{candidateCount}} objects, each with:

- "idea_number" (1 to {{candidateCount}})
- "idea_content" (one sentence description from this persona's perspective)

Return ONLY the JSON array, no other text or explanation.
```

The original De Freitas et al. prompt is in research/cot-personas.md. The persona study's LLM CoT condition raised unique category combinations from 85 to 152 on 830 ideas, and personas plus CoT reached 240, above the human benchmark of 196.

## Procedure

1. Generate the short titles. Do not expand yet.
2. Read the titles as a set. Name the pattern they share. "All of these are apps for young professionals" is a pattern.
3. Rewrite at least half the titles so the pattern no longer holds. Change the audience, the mechanism, or the unit of value.
4. Only then expand each title into one sentence.
5. Keep the before and after lists. The rejected titles are evidence that the revision did something.

## The interaction warning

CoT is not uniformly good for divergence. In the Gemini replication of the persona study, CoT narrowed first-idea diversity (7.11 categories versus 9.14 for the default). It reduced fixation inside a session while reducing spread across sessions.

Use personas for spread and CoT for depth. Do not use CoT as the only diversity intervention.

## Failure handling

- The revision only swaps adjectives: force a structural change. "Change the customer, the mechanism, or the payment model. One of the three must change."
- The model says every idea is already bold: ask it to name the most conventional title and replace that one first.
- The model returns fewer titles than asked: keep the shortfall visible and continue. Do not pad with paraphrases.
