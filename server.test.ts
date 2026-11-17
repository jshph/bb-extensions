import { expect, it } from "vitest";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import {
  createFakePluginHost,
  makeThreadResponse,
} from "@get-bb/plugin-sdk/testing";
import plugin from "./server";

type Bootstrap = Awaited<
  ReturnType<BbPluginApi["sdk"]["projects"]["sidebarBootstrap"]>
>;
type Thread = Bootstrap["personalProject"]["threads"][number];

function thread(id: string, overrides: Partial<Thread> = {}): Thread {
  return {
    ...makeThreadResponse({ id }),
    pinSortKey: null,
    activity: {
      activeWorkflowCount: 0,
      activeBackgroundAgentCount: 0,
      activeBackgroundCommandCount: 0,
      activePlanModeCount: 0,
    },
    hasPendingInteraction: false,
    environmentHostId: null,
    environmentName: null,
    environmentBranchName: null,
    environmentPath: null,
    environmentProviderId: null,
    environmentIsWorktree: null,
    environmentWorkspaceDisplayKind: "other",
    queuedWork: "none",
    ...overrides,
  };
}

it("lists bounded recent rows across personal and standard projects through the plugin CLI", async () => {
  const base = {
    id: "personal",
    kind: "personal" as const,
    name: "Personal",
    gitRemoteUrl: null,
    sources: [],
    createdAt: 0,
    updatedAt: 0,
    defaultExecutionOptions: null,
  };
  const navigation: Bootstrap = {
    sections: [],
    personalProject: {
      ...base,
      threads: [thread("parent", { latestAttentionAt: 100 })],
    },
    projects: [
      {
        ...base,
        id: "project",
        kind: "standard",
        threads: [
          thread("child", { parentThreadId: "parent", latestAttentionAt: 101 }),
          thread("hidden", { visibility: "hidden", latestAttentionAt: 500 }),
          thread("archived", { archivedAt: 1, latestAttentionAt: 600 }),
          ...Array.from({ length: 20 }, (_, index) =>
            thread(`row-${index}`, { latestAttentionAt: index }),
          ),
        ],
      },
    ],
  };
  const { bb, harness } = createFakePluginHost({
    pluginId: "recents",
    sdk: { projects: { sidebarBootstrap: async () => navigation } },
  });
  try {
    plugin(bb);
    const output = await harness.behavior.runCli(["list", "--json"]);
    expect(output.exitCode).toBe(0);
    const payload: { rows: { id: string; depth: number }[] } = JSON.parse(
      output.stdout,
    );
    expect(payload.rows).toHaveLength(15);
    expect(
      payload.rows.slice(0, 3).map(({ id, depth }) => [id, depth]),
    ).toEqual([
      ["parent", 0],
      ["child", 1],
      ["row-19", 0],
    ]);
    expect(
      payload.rows.some((row) => row.id === "hidden" || row.id === "archived"),
    ).toBe(false);
    const text = await harness.behavior.runCli(["list"]);
    expect(text.stdout.split("\n")[1]).toMatch(/^  child\t/);
  } finally {
    await harness.lifecycle.dispose();
  }
});
