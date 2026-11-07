# Surprising and negative keywords, random stimuli, opposite assumptions, extreme constraints

## What it is

A set of defixation branches:

- a surprising keyword that is unexpected for the domain,
- a negative keyword that still makes sense for the domain,
- a random stimulus noun used as a structural analogy,
- the reversal of an assumption every competitor shares,
- an extreme constraint that removes the normal solution path.

## Mechanism

The IDEAFix experiment manipulated the typicality of an adjective attached to a brief at three levels: traditional, atypical, and surprising. It also varied valence: positive and negative.

The results:

- Surprising keywords consistently increased novelty and rarity.
- The increase came at the expense of diversity.
- Negative keywords amplified the effect.
- Surprising negative combinations produced the most novel and rare outputs.

The authors connect this to typicality: a negative keyword is less typical in a problem-solving context, because creativity is usually framed as a positive activity. Surprising and negative words move the prompt away from the likely completion.

The random stimulus, opposite assumption, and extreme constraint are not from the IDEAFix experiment. They are standard defixation moves from the creativity literature, and they are marked `UNVERIFIED` for this specific LLM setting. The plugin uses them as prompt branches, not as proven techniques.

## Experimental setup

| Item | Value |
|---|---|
| Briefs | 81 |
| Attribute variants | 6 per brief: traditional/atypical/surprising × positive/negative, plus a control |
| Conditions | 567 |
| Models | Llama-3.1-70B-Instruct, Qwen3-30B-A3B-Instruct-2507, Gemini-2.5-Flash, GPT-4o, Grok-4.1-fast-reasoning |
| Repeats | 3 runs per model |
| Metrics | Fluency, diversity, novelty, rarity, overlap, perplexity |
| Statistics | t-tests; the paper reports all attribute effects as statistically significant (Tables 3–6) |

## Exact numbers

The paper reports that:

- more surprising keywords consistently increase novelty and rarity, at the expense of diversity, and all observed differences are statistically significant (Tables 4 and 5);
- negative keywords further amplify these effects (Table 6);
- surprising negative combinations produce the most novel and rare outputs.

The exact effect sizes are in the appendix tables. They were not extracted from the HTML version used for this analysis. Do not quote a number that is not in the source.

## Known limitations and conflicting results

- The keyword effect trades diversity for novelty. A global "be surprising" instruction can make every idea strange in the same way.
- The attribute manipulation is tied to short design briefs. It is not tested on scientific hypotheses or strategy.
- The random stimulus, opposite assumption, and extreme constraint are engineering extensions. No effect size is claimed.
- Negative keywords can trigger refusals or tone problems on sensitive topics. The paper notes that some outputs were removed because models refused negatively framed briefs.
- The IDEAFix paper's overall conclusion is that individual novelty gains do not remove cross-model homogenization.

## Prompt wording that produced the best results

The attribute levels are described as:

> We manipulated the typicality of the adjective associated with the brief along three levels: 1) Traditional attributes (frequently associated with the brief domain); 2) Atypical attributes (rarely associated with the brief domain), 3) Surprising attributes (where the association with the brief domain is unexpected).

The paper's defixation prompt, which carries the "wild, futuristic, or playful" cue:

```
Invent as many different and imaginative responses as possible to the following situation: [Brief context]. Go beyond obvious answers — include wild, futuristic, or playful directions that might open new ways of thinking.
```

The plugin's branch prompts are in `skills/jarvis-stimuli/SKILL.md`. They are derived from the mechanism, not quoted from a paper.

## Design consequence

The pipeline runs stimuli as separate branches. It does not put "be surprising" in the main generation prompt. It uses `jarvis_stimulus` for external randomness, because language models are poor at producing genuinely random draws.

## Citations

- Carichon, F., Sharma, S., Girard, M., Rampa, R., Farnadi, G. (2026). *IDEAFix: Evaluation Framework for Creative Defixation Prompting in LLMs.* arXiv:2606.00875. https://arxiv.org/abs/2606.00875
