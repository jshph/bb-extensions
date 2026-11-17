import { useEffect, useMemo, useRef } from "react";
import { useSetAtom } from "jotai";
import {
  experimental_useSidebarThreads,
  useBbContext,
  type PluginSidebarThread,
} from "@get-bb/plugin-sdk/app";
import { collapsedThreadIdsAtom } from "./collapse";

export interface RecentsRevealState {
  pendingNavigation: string | undefined;
  previousThreadId: string | undefined;
  previousUnreadIds: ReadonlySet<string> | null;
}

export const INITIAL_RECENTS_REVEAL_STATE: RecentsRevealState = {
  pendingNavigation: undefined,
  previousThreadId: undefined,
  previousUnreadIds: null,
};

export function stepRecentsReveal(
  state: RecentsRevealState,
  {
    isPlaceholderData,
    selectedThreadId,
    threads,
  }: {
    isPlaceholderData: boolean;
    selectedThreadId: string | undefined;
    threads: readonly PluginSidebarThread[] | null;
  },
): { ancestorIds: ReadonlySet<string>; state: RecentsRevealState } {
  const navigated = state.previousThreadId !== selectedThreadId;
  let pendingNavigation = navigated
    ? selectedThreadId
    : state.pendingNavigation;
  if (threads === null || isPlaceholderData) {
    return {
      ancestorIds: new Set(),
      state: {
        ...state,
        pendingNavigation,
        previousThreadId: selectedThreadId,
      },
    };
  }
  const threadById = new Map(threads.map((thread) => [thread.id, thread]));
  const revealIds = new Set<string>();
  if (pendingNavigation && threadById.has(pendingNavigation)) {
    revealIds.add(pendingNavigation);
    pendingNavigation = undefined;
  }
  const unreadIds = new Set<string>();
  for (const thread of threads) {
    if (thread.isHidden || !thread.isUnread) continue;
    unreadIds.add(thread.id);
    if (
      state.previousUnreadIds &&
      !state.previousUnreadIds.has(thread.id) &&
      thread.id !== selectedThreadId
    ) {
      revealIds.add(thread.id);
    }
  }

  const ancestorIds = new Set<string>();
  for (const threadId of revealIds) {
    const thread = threadById.get(threadId);
    if (!thread || thread.isHidden) continue;
    let parentThreadId = thread.parentThreadId;
    while (parentThreadId !== null && !ancestorIds.has(parentThreadId)) {
      const parent = threadById.get(parentThreadId);
      if (!parent) break;
      ancestorIds.add(parent.id);
      parentThreadId = parent.parentThreadId;
    }
  }
  return {
    ancestorIds,
    state: {
      pendingNavigation,
      previousThreadId: selectedThreadId,
      previousUnreadIds: unreadIds,
    },
  };
}

export function useRecentsThreadReveal(): void {
  const { threadId } = useBbContext();
  const selectedThreadId = threadId ?? undefined;
  const navigation = experimental_useSidebarThreads();
  const isPlaceholderData = navigation.status !== "ready";
  const setCollapsedThreadIds = useSetAtom(collapsedThreadIdsAtom);
  const threads = useMemo(() => navigation.threads, [navigation.threads]);
  const revealState = useRef(INITIAL_RECENTS_REVEAL_STATE);

  useEffect(() => {
    const { ancestorIds, state } = stepRecentsReveal(revealState.current, {
      isPlaceholderData,
      selectedThreadId,
      threads: navigation.status === "ready" ? threads : null,
    });
    revealState.current = state;
    if (ancestorIds.size === 0) return;
    setCollapsedThreadIds((current) => {
      const next = current.filter((id) => !ancestorIds.has(id));
      return next.length === current.length ? current : next;
    });
  }, [
    isPlaceholderData,
    navigation,
    selectedThreadId,
    setCollapsedThreadIds,
    threads,
  ]);
}
