import { describe, expect, it } from "vitest";
import type { PluginSidebarThread } from "@get-bb/plugin-sdk/app";
import { makeSidebarThread } from "./fixtures.test-support";
import {
  INITIAL_RECENTS_REVEAL_STATE,
  stepRecentsReveal,
  type RecentsRevealState,
} from "./reveal";

function thread(id: string, overrides: Partial<PluginSidebarThread> = {}) {
  return makeSidebarThread({
    id,
    projectId: "proj_personal",
    lastReadAt: 1,
    isUnread: false,
    latestAttentionAt: 1,
    ...overrides,
  });
}

function unread(entry: PluginSidebarThread): PluginSidebarThread {
  return { ...entry, status: "idle", latestAttentionAt: 2, isUnread: true };
}

const other = thread("other");
const root = thread("root");
const parent = thread("parent", { parentThreadId: "root" });
const child = thread("child", { parentThreadId: "parent" });

interface Step {
  isPlaceholderData?: boolean;
  selectedThreadId: string;
  threads: readonly PluginSidebarThread[] | null;
}

function runSteps(steps: readonly Step[]): string[][] {
  let state: RecentsRevealState = INITIAL_RECENTS_REVEAL_STATE;
  return steps.map(
    ({ isPlaceholderData = false, selectedThreadId, threads }) => {
      const result = stepRecentsReveal(state, {
        isPlaceholderData,
        selectedThreadId,
        threads,
      });
      state = result.state;
      return [...result.ancestorIds];
    },
  );
}

describe("stepRecentsReveal", () => {
  it("opens every ancestor of the thread you navigate to, once per visit", () => {
    const threads = [other, root, parent, child];

    expect(
      runSteps([
        { selectedThreadId: "other", threads },
        { selectedThreadId: "child", threads },
        { selectedThreadId: "child", threads },
        { selectedThreadId: "other", threads },
        { selectedThreadId: "child", threads },
      ]),
    ).toEqual([[], ["parent", "root"], [], [], ["parent", "root"]]);
  });

  it("opens ancestors of newly unread threads but not of threads unread at load or hidden", () => {
    const hiddenChild = thread("hidden", {
      parentThreadId: "root",
      isHidden: true,
    });
    const sibling = thread("sibling", { parentThreadId: "parent" });

    expect(
      runSteps([
        {
          selectedThreadId: "other",
          threads: [other, root, parent, unread(child), hiddenChild],
        },
        {
          selectedThreadId: "other",
          threads: [other, root, parent, unread(child), unread(hiddenChild)],
        },
        {
          selectedThreadId: "other",
          threads: [other, root, parent, unread(child), unread(sibling)],
        },
      ]),
    ).toEqual([[], [], ["parent", "root"]]);
  });

  it("waits for the full bootstrap before revealing navigation", () => {
    const threads = [other, root, parent, child];

    expect(
      runSteps([
        { isPlaceholderData: true, selectedThreadId: "other", threads },
        { isPlaceholderData: true, selectedThreadId: "child", threads },
        { selectedThreadId: "child", threads },
      ]),
    ).toEqual([[], [], ["parent", "root"]]);
  });

  it("takes the unread baseline from the full bootstrap, not placeholder data", () => {
    expect(
      runSteps([
        {
          isPlaceholderData: true,
          selectedThreadId: "other",
          threads: [other, root, parent, child],
        },
        {
          selectedThreadId: "other",
          threads: [other, root, parent, unread(child)],
        },
      ]),
    ).toEqual([[], []]);
  });
});
