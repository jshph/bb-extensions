import { makeSidebarThread as makeThread } from "./fixtures.test-support";
import { describe, expect, it } from "vitest";
import { getRecentAncestorIds, getRecentThreads } from "./model";

const NONE: ReadonlySet<string> = new Set();

describe("getRecentThreads", () => {
  it("returns the 15 most recent active threads newest-first", () => {
    const threads = Array.from({ length: 17 }, (_unused, index) =>
      makeThread({
        id: `thr_${index}`,
        latestAttentionAt: index,
        createdAt: index,
      }),
    );

    const rows = getRecentThreads({
      collapsedThreadIds: NONE,
      draftThreadIds: NONE,
      threads,
    });

    expect(rows).toHaveLength(15);
    expect(rows.map((row) => row.thread.id)).toEqual([
      "thr_16",
      "thr_15",
      "thr_14",
      "thr_13",
      "thr_12",
      "thr_11",
      "thr_10",
      "thr_9",
      "thr_8",
      "thr_7",
      "thr_6",
      "thr_5",
      "thr_4",
      "thr_3",
      "thr_2",
    ]);
    expect(rows.every((row) => row.depth === 0)).toBe(true);
  });

  it("nests a child under its parent instead of listing it as a peer", () => {
    const rows = getRecentThreads({
      collapsedThreadIds: NONE,
      draftThreadIds: NONE,
      threads: [
        makeThread({ id: "thr_parent", latestAttentionAt: 10 }),
        makeThread({
          id: "thr_child",
          parentThreadId: "thr_parent",
          latestAttentionAt: 99,
        }),
        makeThread({ id: "thr_other", latestAttentionAt: 5 }),
      ],
    });

    expect(rows.map((row) => [row.thread.id, row.depth])).toEqual([
      ["thr_parent", 0],
      ["thr_child", 1],
      ["thr_other", 0],
    ]);
    expect(rows[0]?.hasChildren).toBe(true);
    expect(rows[1]?.hasChildren).toBe(false);
  });

  it("hides descendants of a collapsed parent but keeps the parent", () => {
    const threads = [
      makeThread({ id: "thr_parent", latestAttentionAt: 10 }),
      makeThread({
        id: "thr_child",
        parentThreadId: "thr_parent",
        latestAttentionAt: 9,
      }),
      makeThread({
        id: "thr_grandchild",
        parentThreadId: "thr_child",
        latestAttentionAt: 8,
      }),
    ];

    const rows = getRecentThreads({
      collapsedThreadIds: new Set(["thr_parent"]),
      draftThreadIds: NONE,
      threads,
    });

    expect(rows.map((row) => row.thread.id)).toEqual(["thr_parent"]);
    expect(rows[0]?.isCollapsed).toBe(true);
    expect(rows[0]?.hasChildren).toBe(true);
  });

  it("promotes a child whose parent is absent to the top level", () => {
    const rows = getRecentThreads({
      collapsedThreadIds: NONE,
      draftThreadIds: NONE,
      threads: [
        makeThread({
          id: "thr_orphan",
          parentThreadId: "thr_missing",
          latestAttentionAt: 3,
        }),
      ],
    });

    expect(rows.map((row) => [row.thread.id, row.depth])).toEqual([
      ["thr_orphan", 0],
    ]);
  });
});

describe("getRecentAncestorIds", () => {
  const tree = [
    makeThread({ id: "thr_root" }),
    makeThread({ id: "thr_mid", parentThreadId: "thr_root" }),
    makeThread({ id: "thr_leaf", parentThreadId: "thr_mid" }),
  ];

  it("walks the whole ancestor chain of a nested thread", () => {
    expect(
      getRecentAncestorIds({ threadId: "thr_leaf", threads: tree }),
    ).toEqual(["thr_mid", "thr_root"]);
  });

  it("returns nothing for a root thread or an unknown id", () => {
    expect(
      getRecentAncestorIds({ threadId: "thr_root", threads: tree }),
    ).toEqual([]);
    expect(
      getRecentAncestorIds({ threadId: "thr_missing", threads: tree }),
    ).toEqual([]);
  });

  it("stops at an absent parent instead of looping", () => {
    expect(
      getRecentAncestorIds({
        threadId: "thr_orphan",
        threads: [makeThread({ id: "thr_orphan", parentThreadId: "thr_gone" })],
      }),
    ).toEqual([]);
  });

  it("terminates on a parent cycle", () => {
    expect(
      getRecentAncestorIds({
        threadId: "thr_a",
        threads: [
          makeThread({ id: "thr_a", parentThreadId: "thr_b" }),
          makeThread({ id: "thr_b", parentThreadId: "thr_a" }),
        ],
      }).length,
    ).toBeLessThanOrEqual(2);
  });
});
