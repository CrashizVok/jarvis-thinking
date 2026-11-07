import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveConfig } from "../src/config.ts";
import { loadSkills, SKILL_IDS } from "../src/skills.ts";

const config = resolveConfig({}, {});

describe("skills", () => {
  it("loads every shipped skill", async () => {
    const skills = await loadSkills(config);
    expect(skills.map((skill) => skill.id)).toEqual([...SKILL_IDS]);
    for (const skill of skills) {
      expect(skill.description.length, skill.id).toBeGreaterThan(20);
      expect(skill.content.length, skill.id).toBeGreaterThan(200);
    }
  });

  it("substitutes configuration values", async () => {
    const skills = await loadSkills(config);
    const pipeline = skills.find((skill) => skill.id === "jarvis-pipeline");
    expect(pipeline?.content).toContain("at least 5 candidates");
    expect(pipeline?.content).toContain("below 0.1");
    expect(pipeline?.content).toContain(".jarvis/ideas.md");
    expect(pipeline?.content).not.toContain("{{candidateCount}}");
    expect(pipeline?.content).not.toContain("{{dedupThreshold}}");
  });

  it("leaves runtime placeholders alone", async () => {
    const skills = await loadSkills(config);
    const personas = skills.find((skill) => skill.id === "jarvis-personas");
    expect(personas?.content).toContain("{{persona}}");
  });

  it("advertises the four standalone entry points", async () => {
    const skills = await loadSkills(config);
    const advertised = skills.filter((skill) => skill.autoinvoke).map((skill) => skill.id);
    expect(advertised).toContain("jarvis-pipeline");
    expect(advertised).toContain("jarvis-research");
    expect(advertised).toContain("jarvis-verbalized-sampling");
    expect(advertised).toContain("jarvis-converge");
  });

  it("uses a real absolute path for every skill", async () => {
    const skills = await loadSkills(config);
    for (const skill of skills) expect(skill.path.startsWith("/")).toBe(true);
  });

  it("materializes a readable copy inside the project", async () => {
    const dir = await mkdtemp(join(tmpdir(), "jarvis-skills-"));
    const skills = await loadSkills(config, undefined, () => {}, dir);
    const pipeline = skills.find((skill) => skill.id === "jarvis-pipeline")!;
    expect(pipeline.path.startsWith(dir)).toBe(true);
    const content = await readFile(pipeline.path, "utf8");
    expect(content).toContain("# Jarvis pipeline");
    expect(content).toContain("at least 5 candidates");
  });
});
