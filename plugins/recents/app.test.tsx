// @vitest-environment jsdom
import { cleanup, fireEvent, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadPluginApp,
  renderSlot,
  type RenderSlotOptions,
} from "@get-bb/plugin-sdk/testing/app";
import type { PluginHomepageSectionProps } from "@get-bb/plugin-sdk/app";
import definition from "./app";
import { collapsedThreadIdsAtom } from "./src/collapse";
import { makeSidebarThread } from "./src/fixtures.test-support";

const parent = makeSidebarThread({
  id: "parent",
  title: "Parent",
  latestAttentionAt: 10,
  isUnread: false,
});
const child = makeSidebarThread({
  id: "child",
  title: "Child",
  parentThreadId: "parent",
  latestAttentionAt: 20,
  isUnread: false,
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

async function mount({
  collapsed = [],
  props = {},
  options = {},
}: {
  collapsed?: string[];
  props?: Partial<PluginHomepageSectionProps>;
  options?: RenderSlotOptions;
} = {}) {
  const store = createStore();
  store.set(collapsedThreadIdsAtom, collapsed);
  const app = await loadPluginApp(definition);
  const section = app.homepageSections[0]!;
  function Section(props: PluginHomepageSectionProps) {
    return (
      <Provider store={store}>
        <section.component {...props} />
      </Provider>
    );
  }
  return renderSlot(
    { ...section, component: Section },
    { projectId: null, ...props },
    {
      sidebarThreads: { threads: [parent, child] },
      ...options,
    },
  );
}

describe("Recents homepage plugin", () => {
  it("collapses children, persists the choice and opens a thread through host navigation", async () => {
    const slot = await mount();
    expect(slot.getByRole("link", { name: /Open Child/ })).toBeTruthy();
    fireEvent.click(
      slot.getByRole("button", { name: "Hide threads under Parent" }),
    );
    expect(slot.queryByRole("link", { name: /Open Child/ })).toBeNull();
    expect(
      JSON.parse(localStorage.getItem("bb.mobileRecents.collapsedThreads")!),
    ).toEqual(["parent"]);
    fireEvent.click(
      slot.getByRole("button", { name: "Show threads under Parent" }),
    );
    const link = slot.getByRole("link", { name: /Open Child/ });
    expect(link.getAttribute("href")).toBe(child.href);
    fireEvent.click(link);
    expect(slot.inspection.navigateCalls).toContainEqual({
      method: "toThread",
      threadId: "child",
    });
  });

  it("reveals the last created child and highlights its row", async () => {
    const slot = await mount({
      collapsed: ["parent"],
      props: { experimental_lastCreatedThreadId: "child" },
    });
    const link = await slot.findByRole("link", { name: /Open Child/ });
    expect(link.closest("li")?.classList.contains("bg-surface-selected")).toBe(
      true,
    );
    await waitFor(() =>
      expect(
        slot.getByRole("button", { name: "Hide threads under Parent" }),
      ).toBeTruthy(),
    );
  });

  it("shows pending creation even before any threads exist and leaves an empty home blank", async () => {
    const empty = await mount({ options: { sidebarThreads: { threads: [] } } });
    expect(empty.queryByRole("heading")).toBeNull();
    empty.lifecycle.unmount();
    const pending = await mount({
      options: {
        sidebarThreads: { threads: [] },
        composer: { isSubmitting: true },
      },
    });
    expect(pending.getByRole("status").textContent).toContain(
      "Creating thread",
    );
    expect(pending.getByRole("heading", { name: "Recent" })).toBeTruthy();
  });

  it("rolls a hidden child's unsent draft into its collapsed parent's status", async () => {
    const slot = await mount({
      collapsed: ["parent"],
      options: { sidebarDraftThreadIds: ["child"] },
    });
    expect(
      slot.getByRole("link", { name: /Open Parent.*draft/i }),
    ).toBeTruthy();
  });

  it("excludes hidden and archived threads and renders project, branch and activity metadata", async () => {
    const visible = makeSidebarThread({
      id: "visible",
      projectId: "work",
      title: "Visible",
      latestAttentionAt: Date.now(),
      environment: {
        id: "env",
        name: null,
        branchName: "feature",
        path: null,
        isWorktree: true,
        providerId: null,
        workspaceDisplayKind: null,
      },
    });
    const slot = await mount({
      options: {
        sidebarThreads: {
          threads: [
            visible,
            makeSidebarThread({ id: "hidden", isHidden: true }),
            makeSidebarThread({ id: "archived", isArchived: true }),
          ],
          projects: [
            {
              id: "work",
              name: "Work",
              isPersonal: false,
              href: "/projects/work",
              settingsHref: "/settings/projects/work",
            },
          ],
        },
      },
    });
    expect(slot.getAllByRole("link")).toHaveLength(1);
    expect(slot.getByText("Work · feature · just now")).toBeTruthy();
  });
});
