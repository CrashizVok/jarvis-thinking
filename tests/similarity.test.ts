import { describe, expect, it } from "vitest";
import { buildIdf, charNgrams, cosine, jaccard, normalizeText, tfidfVector, tokenize } from "../src/similarity/text.ts";

describe("text normalisation", () => {
  it("strips case, punctuation, and accents", () => {
    expect(normalizeText("Café  Shops!!")).toBe("cafe shops");
  });

  it("drops stop words and folds simple suffixes", () => {
    const tokens = tokenize("Building builders for the buildings");
    expect(tokens).toContain("build");
    expect(tokens).not.toContain("the");
    expect(tokens).not.toContain("for");
  });

  it("keeps unicode letters after decomposition", () => {
    expect(tokenize("naïve résumé")).toEqual(["naive", "resume"]);
  });
});

describe("similarity scores", () => {
  const idf = buildIdf([
    ["subscription", "sleep", "coaching", "nurse"],
    ["subscription", "meal", "planning", "family"],
    ["hardware", "sensor", "factory"],
  ]);

  it("scores paraphrases higher than unrelated ideas", () => {
    const a = tfidfVector(tokenize("subscription sleep coaching for night shift nurses"), idf);
    const b = tfidfVector(tokenize("coaching subscription for nurses who work nights"), idf);
    const c = tfidfVector(tokenize("factory sensor maintenance hardware"), idf);
    expect(cosine(a, b)).toBeGreaterThan(cosine(a, c));
  });

  it("catches character-level edits", () => {
    const a = charNgrams("subscription coaching");
    const b = charNgrams("subscription coach");
    expect(jaccard(a, b)).toBeGreaterThan(0.5);
  });

  it("returns zero for an empty vector", () => {
    expect(cosine(new Map(), new Map([["a", 1]]))).toBe(0);
  });
});
