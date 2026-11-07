import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, resolveConfig } from "../src/config.ts";

describe("configuration", () => {
  it("returns the documented defaults", () => {
    const config = resolveConfig({}, {});
    expect(config.candidateCount).toBe(5);
    expect(config.lowProbabilityCandidates).toBe(2);
    expect(config.probabilityThreshold).toBe(0.1);
    expect(config.personaCount).toBe(3);
    expect(config.brainwritingRounds).toBe(3);
    expect(config.consensusCount).toBe(3);
    expect(config.dedupThreshold).toBe(0.82);
    expect(config.selectionCount).toBe(2);
    expect(config.ideasFile).toBe(".jarvis/ideas.md");
    expect(config.autoTrigger).toBe(true);
    expect(config.enabled).toBe(true);
  });

  it("accepts plugin options", () => {
    const config = resolveConfig(
      {
        candidateCount: 8,
        personaCount: 4,
        brainwritingRounds: 3,
        dedupThreshold: 0.75,
        ideasFile: "docs/ideas.md",
        brainwritingMode: "multi-agent",
      },
      {},
    );
    expect(config.candidateCount).toBe(8);
    expect(config.personaCount).toBe(4);
    expect(config.dedupThreshold).toBe(0.75);
    expect(config.ideasFile).toBe("docs/ideas.md");
    expect(config.brainwritingMode).toBe("multi-agent");
  });

  it("clamps values into safe ranges", () => {
    const config = resolveConfig({ candidateCount: 1000, dedupThreshold: 2, personaCount: -4 }, {});
    expect(config.candidateCount).toBe(20);
    expect(config.dedupThreshold).toBe(0.99);
    expect(config.personaCount).toBe(1);
  });

  it("honours environment overrides", () => {
    const config = resolveConfig(
      {},
      {
        JARVIS_DISABLED: "1",
        JARVIS_IDEAS_FILE: "notes/ideas.md",
        JARVIS_DEDUP_THRESHOLD: "0.7",
        JARVIS_EMBEDDING_URL: "https://example.com/v1/embeddings",
        JARVIS_EMBEDDING_MODEL: "custom-embed",
      },
    );
    expect(config.enabled).toBe(false);
    expect(config.ideasFile).toBe("notes/ideas.md");
    expect(config.dedupThreshold).toBe(0.7);
    expect(config.useEmbeddings).toBe(true);
    expect(config.embeddingModel).toBe("custom-embed");
  });

  it("ignores invalid numeric input", () => {
    const config = resolveConfig({ candidateCount: "not a number", triggerThreshold: null }, {});
    expect(config.candidateCount).toBe(DEFAULT_CONFIG.candidateCount);
    expect(config.triggerThreshold).toBe(DEFAULT_CONFIG.triggerThreshold);
  });

  it("defaults to auto trigger and enabled", () => {
    expect(resolveConfig({}, {}).enabled).toBe(true);
    expect(resolveConfig({ enabled: false }, {}).enabled).toBe(false);
  });
});
