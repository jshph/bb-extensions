import type { PluginSidebarThread } from "@get-bb/plugin-sdk/app";

type RecentThread = Pick<
  PluginSidebarThread,
  | "id"
  | "parentThreadId"
  | "latestAttentionAt"
  | "createdAt"
  | "isHidden"
  | "isArchived"
>;

export interface RecentRow<Thread extends RecentThread = PluginSidebarThread> {
  thread: Thread;
  depth: number;
  hiddenThreads: readonly Thread[];
  hiddenThreadsHaveDraft: boolean;
  hasChildren: boolean;
  isCollapsed: boolean;
}

export function getRecentAncestorIds({
  threadId,
  threads,
}: {
  threadId: string;
  threads: readonly PluginSidebarThread[];
}): string[] {
  const byId = new Map(threads.map((thread) => [thread.id, thread]));
  const result: string[] = [];
  const visited = new Set([threadId]);
  let current = byId.get(threadId);
  if (current?.isHidden) return result;
  while (current?.parentThreadId) {
    const parent = byId.get(current.parentThreadId);
    if (!parent || visited.has(parent.id)) break;
    visited.add(parent.id);
    result.push(parent.id);
    current = parent;
  }
  return result;
}

function compareThreads(a: RecentThread, b: RecentThread): number {
  return (
    b.latestAttentionAt - a.latestAttentionAt ||
    b.createdAt - a.createdAt ||
    a.id.localeCompare(b.id)
  );
}

export function getRecentThreads<Thread extends RecentThread>({
  threads,
  collapsedThreadIds,
  draftThreadIds,
}: {
  threads: readonly Thread[];
  collapsedThreadIds: ReadonlySet<string>;
  draftThreadIds: ReadonlySet<string>;
}): RecentRow<Thread>[] {
  const visible = threads.filter(
    (thread) => !thread.isHidden && !thread.isArchived,
  );
  const ids = new Set(visible.map((thread) => thread.id));
  const children = new Map<string, Thread[]>();
  for (const thread of visible) {
    if (thread.parentThreadId === null || !ids.has(thread.parentThreadId))
      continue;
    const siblings = children.get(thread.parentThreadId) ?? [];
    siblings.push(thread);
    children.set(thread.parentThreadId, siblings);
  }
  for (const siblings of children.values()) siblings.sort(compareThreads);
  const roots = visible
    .filter(
      (thread) =>
        thread.parentThreadId === null || !ids.has(thread.parentThreadId),
    )
    .sort(compareThreads);
  const visited = new Set<string>();
  const rows: RecentRow<Thread>[] = [];
  const visit = (thread: Thread, depth: number, hidden: Thread[] | null) => {
    if (visited.has(thread.id)) return;
    visited.add(thread.id);
    if (hidden) {
      hidden.push(thread);
      for (const child of children.get(thread.id) ?? [])
        visit(child, depth + 1, hidden);
      return;
    }
    const descendants = children.get(thread.id) ?? [];
    const isCollapsed =
      descendants.length > 0 && collapsedThreadIds.has(thread.id);
    const hiddenThreads: Thread[] = [];
    const row: RecentRow<Thread> = {
      thread,
      depth,
      hiddenThreads,
      hiddenThreadsHaveDraft: false,
      hasChildren: descendants.length > 0,
      isCollapsed,
    };
    rows.push(row);
    for (const child of descendants)
      visit(child, depth + 1, isCollapsed ? hiddenThreads : null);
    row.hiddenThreadsHaveDraft = hiddenThreads.some((child) =>
      draftThreadIds.has(child.id),
    );
  };
  for (const root of roots) visit(root, 0, null);
  for (const thread of [...visible].sort(compareThreads))
    visit(thread, 0, null);
  return rows.slice(0, 15);
}
