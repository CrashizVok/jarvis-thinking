import { describe, expect, it } from "vitest";
import { resolveConfig } from "../src/config.ts";
import { classifyPrompt } from "../src/trigger.ts";

const config = resolveConfig({}, {});

const SHOULD_TRIGGER = [
  "Brainstorm 10 ideas for a subscription service for busy parents.",
  "What should we build next for our developer tool?",
  "How might we make onboarding less annoying?",
  "Research the literature on retrieval augmented generation for scientific ideation.",
  "Compare Postgres and SQLite for an offline-first app.",
  "Give me some names for a coffee shop that also repairs bikes.",
  "Design a strategy for entering the Japanese market.",
  "Write a launch post for our new API.",
  "What are some unconventional ways to reduce food waste in cities?",
  "Propose a research agenda for evaluating AI creativity.",
  "Write a poem about the sea.",
  "Ideate on a cheaper way to ship lithium batteries.",
];

const SHOULD_SKIP = [
  "Fix the failing test in auth.test.ts",
  "Rename this function to parseConfig",
  "Run npm test and tell me what failed",
  "What is the capital of France?",
  "How do I install Postgres on Ubuntu?",
  "Refactor src/lib/db.ts to use a connection pool",
  "Explain this stack trace",
  "Add a migration for the new column",
  "Update the README badge",
  "git status",
  "What does this error mean? TypeError: cannot read property 'id' of undefined",
  "Summarize this article",
  "Lint the changed files",
  "Compare these two files.",
  "Design a database schema with a users table.",
  "thanks",
];

describe("trigger classifier", () => {
  it.each(SHOULD_TRIGGER)("triggers: %s", (prompt) => {
    const decision = classifyPrompt(prompt, config);
    expect(decision.trigger, decision.reason).toBe(true);
  });

  it.each(SHOULD_SKIP)("skips: %s", (prompt) => {
    const decision = classifyPrompt(prompt, config);
    expect(decision.trigger, decision.reason).toBe(false);
  });

  it("force overrides every negative signal", () => {
    const decision = classifyPrompt("git status", config, "force");
    expect(decision.trigger).toBe(true);
    expect(decision.mode).toBe("force");
  });

  it("off overrides every positive signal", () => {
    const decision = classifyPrompt("brainstorm ideas", config, "off");
    expect(decision.trigger).toBe(false);
    expect(decision.mode).toBe("off");
  });

  it("reports the rules that moved the score", () => {
    const decision = classifyPrompt("Brainstorm 10 ideas for a new product", config);
    expect(decision.matched.map((item) => item.id)).toContain("ideation-verb");
    expect(decision.score).toBeGreaterThanOrEqual(config.triggerThreshold);
  });

  it("accepts extra trigger and negative patterns", () => {
    const custom = resolveConfig(
      {
        extraTriggerPatterns: ["quantum\\s+widget"],
        extraNegativePatterns: ["ignore\\s+this"],
      },
      {},
    );
    expect(classifyPrompt("quantum widget strategy", custom).trigger).toBe(true);
    expect(classifyPrompt("brainstorm quantum widget ideas, ignore this", custom).score).toBeLessThan(
      classifyPrompt("brainstorm quantum widget ideas", custom).score,
    );
  });

  it("ignores an invalid user regex instead of throwing", () => {
    const custom = resolveConfig({ extraTriggerPatterns: ["("] }, {});
    expect(() => classifyPrompt("brainstorm ideas", custom)).not.toThrow();
  });
});
