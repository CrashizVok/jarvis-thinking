import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import plugin from "../src/index.ts";

interface Registry {
  skills: Array<Record<string, unknown>>;
  tools: Array<Record<string, unknown>>;
  commands: Array<Record<string, unknown>>;
  hooks: Array<{ name: string; callback: (event: any) => Promise<void> | void }>;
  storage: Map<string, unknown>;
  prompts: string[];
}

function mockContext(directory: string, options: Record<string, unknown> = {}): { ctx: any; registry: Registry } {
  const registry: Registry = {
    skills: [],
    tools: [],
    commands: [],
    hooks: [],
    storage: new Map(),
    prompts: [],
  };
  const registration = { dispose: async () => {} };
  const ctx = {
    options,
    location: { directory, project: { id: "p", directory, canonical: directory } },
    app: { version: "test" },
    skill: {
      transform: async (callback: (editor: any) => void) => {
        callback({ add: (skill: Record<string, unknown>) => registry.skills.push(skill) });
        return registration;
      },
    },
    tool: {
      transform: async (callback: (editor: any) => void) => {
        callback({
          namespace: () => {},
          add: (tool: Record<string, unknown>) => registry.tools.push(tool),
        });
        return registration;
      },
    },
    command: {
      transform: async (callback: (editor: any) => void) => {
        callback({ add: (command: Record<string, unknown>) => registry.commands.push(command) });
        return registration;
      },
    },
    session: {
      get: async (input: { sessionID: string }) => ({ id: input.sessionID, parentID: undefined }),
      hook: async (name: string, callback: (event: any) => Promise<void> | void) => {
        registry.hooks.push({ name, callback });
        return registration;
      },
      prompt: async (input: { text: string }) => {
        registry.prompts.push(input.text);
      },
      synthetic: async () => {},
    },
    storage: {
      get: async (key: string) => registry.storage.get(key),
      set: async (key: string, value: unknown) => {
        registry.storage.set(key, value);
      },
      remove: async (key: string) => {
        registry.storage.delete(key);
      },
      scan: async () => ({ entries: [] }),
    },
    agent: { reload: async () => {} },
  };
  return { ctx, registry };
}

describe("plugin setup", () => {
  it("registers skills, tools, commands, and the prompt hook", async () => {
    const dir = await mkdtemp(join(tmpdir(), "jarvis-plugin-"));
    const { ctx, registry } = mockContext(dir);
    await plugin.setup(ctx);

    expect(registry.skills.length).toBe(15);
    expect(registry.tools.map((tool) => tool.name)).toEqual(["dedup", "persist", "ideas", "stimulus", "status"]);
    expect(registry.commands.map((command) => command.name)).toEqual([
      "jarvis",
      "jarvis-off",
      "jarvis-on",
      "jarvis-status",
      "jarvis-install-agent",
    ]);
    expect(registry.hooks.map((hook) => hook.name)).toEqual(["prompt"]);
  });

  it("attaches the pipeline skill only for open-ended prompts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "jarvis-plugin-"));
    const { ctx, registry } = mockContext(dir, { debug: false });
    await plugin.setup(ctx);
    const hook = registry.hooks[0]!;

    const openEnded: {
      sessionID: string;
      messageID: string;
      prompt: { text: string; skills?: Array<{ id: string }> };
      delivery: "steer";
    } = {
      sessionID: "ses_1",
      messageID: "msg_1",
      prompt: { text: "Brainstorm 5 ideas for a reusable packaging service for restaurants." },
      delivery: "steer" as const,
    };
    await hook.callback(openEnded);
    expect(openEnded.prompt.skills?.map((skill) => skill.id)).toContain("jarvis-pipeline");

    const mechanical: {
      sessionID: string;
      messageID: string;
      prompt: { text: string; skills?: Array<{ id: string }> };
      delivery: "steer";
    } = {
      sessionID: "ses_1",
      messageID: "msg_2",
      prompt: { text: "Fix the failing parser test in lexer.test.ts" },
      delivery: "steer" as const,
    };
    await hook.callback(mechanical);
    expect(mechanical.prompt.skills ?? []).toEqual([]);
  });

  it("stores the last decision for the status command", async () => {
    const dir = await mkdtemp(join(tmpdir(), "jarvis-plugin-"));
    const { ctx, registry } = mockContext(dir);
    await plugin.setup(ctx);
    const hook = registry.hooks[0]!;
    await hook.callback({
      sessionID: "ses_2",
      messageID: "msg_1",
      prompt: { text: "How might we make conference talks less exhausting?" },
      delivery: "steer" as const,
    });
    const last = registry.storage.get("jarvis:session:ses_2:last") as { trigger: boolean };
    expect(last.trigger).toBe(true);
  });

  it("forces the pipeline through the /jarvis command", async () => {
    const dir = await mkdtemp(join(tmpdir(), "jarvis-plugin-"));
    const { ctx, registry } = mockContext(dir);
    await plugin.setup(ctx);
    const command = registry.commands.find((item) => item.name === "jarvis") as {
      execute: (input: any) => Promise<void>;
    };
    await command.execute({
      sessionID: "ses_3",
      prompt: { text: "/jarvis rename this function" },
      delivery: "steer",
    });
    expect(registry.storage.get("jarvis:session:ses_3:mode")).toBe("force");
    expect(registry.prompts).toEqual(["rename this function"]);
  });

  it("returns a cleanup function", async () => {
    const dir = await mkdtemp(join(tmpdir(), "jarvis-plugin-"));
    const { ctx } = mockContext(dir);
    const cleanup = await plugin.setup(ctx);
    expect(typeof cleanup).toBe("function");
    await cleanup?.();
  });
});
