import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { appendIdeas, digest, parseIdeas, readIdeas, resolveIdeasFile } from "../src/ideas/store.ts";

async function tempFile(name = "ideas.md"): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "jarvis-store-"));
  return join(dir, name);
}

describe("ideas store", () => {
  it("parses a hand-written entry", () => {
    const entries = parseIdeas(`# Ideas

## 2026-01-02T03:04:05.000Z — logistics

- Title: Shared pallet pool
- Summary: A pool of reusable pallets for small grocers.
- Signature: pooled pallets small grocers
- Novelty: 4/5 · Usefulness: 5/5
- Sources: https://example.com/a; https://example.com/b
- Fingerprint: abc123
`);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      topic: "logistics",
      title: "Shared pallet pool",
      novelty: 4,
      usefulness: 5,
      fingerprint: "abc123",
    });
    expect(entries[0]?.sources).toEqual(["https://example.com/a", "https://example.com/b"]);
  });

  it("returns an empty list for a missing file", async () => {
    expect(await readIdeas(await tempFile("missing.md"))).toEqual([]);
  });

  it("appends and reads back entries", async () => {
    const file = await tempFile();
    const written = await appendIdeas(file, [
      {
        timestamp: "2026-01-01T00:00:00.000Z",
        topic: "test",
        title: "First",
        summary: "One line.",
        signature: "one line",
        sources: ["https://example.com"],
      },
    ]);
    expect(written).toBe(1);
    const entries = await readIdeas(file);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.title).toBe("First");
    const raw = await readFile(file, "utf8");
    expect(raw.startsWith("# Ideas")).toBe(true);
  });

  it("keeps unknown bullets without crashing", () => {
    const entries = parseIdeas(`## 2026 — t
- Title: A
- Summary: B
- Weird: C
`);
    expect(entries[0]?.title).toBe("A");
  });

  it("digests the most recent entries", async () => {
    const file = await tempFile();
    await appendIdeas(file, [
      { timestamp: "1", topic: "t", title: "Old", summary: "old" },
      { timestamp: "2", topic: "t", title: "New", summary: "new", novelty: 5 },
    ]);
    const text = digest(await readIdeas(file), 1);
    expect(text).toContain("New");
    expect(text).not.toContain("Old");
    expect(text).toContain("novelty 5");
  });

  it("resolves the configured file relative to the project", () => {
    expect(resolveIdeasFile("/repo", ".jarvis/ideas.md")).toBe("/repo/.jarvis/ideas.md");
  });

  it("tolerates an empty file", async () => {
    const file = await tempFile();
    await writeFile(file, "", "utf8");
    expect(await readIdeas(file)).toEqual([]);
  });
});
