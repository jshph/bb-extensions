import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useId,
} from "react";
import { useAtom } from "jotai";
import { clsx as cn } from "clsx";
import {
  experimental_Icon as Icon,
  experimental_ProviderIcon as ProviderIcon,
  experimental_ThreadActionsContextMenu as ThreadActionsContextMenu,
  experimental_ThreadStatusGlyph as ThreadStatusGlyph,
  experimental_resolveThreadStatus,
  ThreadTitle,
  useEnvironmentProviders,
  useSidebarThreadDraft,
  useSidebarThreadDraftIds,
  useSidebarThreadRowStatus,
  useBbNavigate,
  type PluginSidebarThread,
  type PluginThreadActionTarget,
  type PluginProvidersState,
} from "@get-bb/plugin-sdk/app";
import {
  getRecentAncestorIds,
  getRecentThreads,
  type RecentRow,
} from "./model";
import { collapsedThreadIdsAtom } from "./collapse";
import { formatRelativeTime } from "./relative-time";

const MOBILE_RECENT_ROW_HEIGHT_CLASS = "h-15";
const CHROME_SECTION_LABEL_CLASS =
  "text-xs font-normal leading-5 text-subtle-foreground/75";
const COARSE_POINTER_TEXT_BASE_CLASS =
  "text-sm max-md:pointer-coarse:text-base";
const COARSE_POINTER_TEXT_SM_CLASS = "text-xs max-md:pointer-coarse:text-sm";
const COARSE_POINTER_ICON_SIZE_CLASS = "size-4 max-md:pointer-coarse:size-5";
const SIDEBAR_WORKING_STATUS_COLOR_CLASS = "text-muted-foreground/50";

function getSidebarThreadRowPaddingLeft(depth: number): number {
  return 8 + depth * 24;
}

function toThreadActionTarget(
  thread: PluginSidebarThread,
): PluginThreadActionTarget {
  return {
    id: thread.id,
    projectId: thread.projectId,
    parentThreadId: thread.parentThreadId,
    parentNotifications: thread.parentNotifications,
    archivedAt: thread.archivedAt,
    pinnedAt: thread.pinnedAt,
    sectionId: thread.sectionId,
    isUnread: thread.isUnread,
    status: thread.status,
    environment: thread.environment?.id
      ? { id: thread.environment.id, path: thread.environment.path }
      : null,
  };
}

interface RecentsProps {
  highlightedThreadId: string | null;
  projectNamesById: ReadonlyMap<string, string>;
  providersById: ReadonlyMap<string, PluginProvidersState["providers"][number]>;
  showCreatingRow: boolean;
  threads: readonly PluginSidebarThread[];
}
interface RecentThreadRowProps {
  highlighted: boolean;
  onToggleCollapsed: (threadId: string) => void;
  projectName: string | null;
  provider: PluginProvidersState["providers"][number] | null;
  row: RecentRow;
}

function RecentThreadRow({
  highlighted,
  onToggleCollapsed,
  projectName,
  provider,
  row,
}: RecentThreadRowProps) {
  const {
    thread,
    depth,
    hiddenThreads,
    hiddenThreadsHaveDraft,
    hasChildren,
    isCollapsed,
  } = row;
  const touchStartedBeforeLink = useRef(false);
  const { providers: environmentProviders } = useEnvironmentProviders();
  const threadTitle = thread.displayTitle;
  const {
    indicator,
    rowStatus,
    label: indicatorLabel,
  } = experimental_resolveThreadStatus({
    thread,
    hiddenThreads,
    hasUnsubmittedDraft:
      useSidebarThreadDraft(thread.id).hasUnsubmittedDraft ||
      hiddenThreadsHaveDraft,
    rowStatus: useSidebarThreadRowStatus(thread.id),
  });
  const environment = thread.environment;
  const environmentProvider = environmentProviders.find(
    (provider) => provider.id === environment?.providerId,
  );
  const workspaceName =
    environment?.name ??
    environment?.branchName ??
    (environment?.providerId
      ? (environmentProvider?.displayName ?? environment.providerId)
      : environment?.path
          ?.split(/[\\/]+/u)
          .filter(Boolean)
          .at(-1)) ??
    null;
  const metadataText = [
    projectName,
    workspaceName &&
    !(
      projectName &&
      (workspaceName === projectName ||
        workspaceName.startsWith(`${projectName} `))
    )
      ? workspaceName
      : null,
    formatRelativeTime({
      timestamp: thread.latestAttentionAt,
      now: Date.now(),
    }),
  ]
    .filter(Boolean)
    .join(" · ");
  const workspaceIconName =
    environmentProvider?.icon ?? (environment ? "Laptop" : null);
  const navigate = useBbNavigate();
  const providerTile = (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md border border-border-seam bg-surface-raised",
        depth > 0 && "opacity-60",
      )}
    >
      <ProviderIcon
        providerKind="agent"
        provider={provider ?? { id: thread.providerId }}
        className="size-4"
      />
    </span>
  );
  return (
    <ThreadActionsContextMenu thread={toThreadActionTarget(thread)}>
      <li
        onTouchStart={(event) => {
          const touch = event.touches[0];
          const link = event.currentTarget.querySelector("a");
          touchStartedBeforeLink.current =
            hasChildren &&
            touch !== undefined &&
            link !== null &&
            touch.clientX < link.getBoundingClientRect().left;
        }}
        style={{ paddingLeft: getSidebarThreadRowPaddingLeft(depth) }}
        className={cn(
          "flex select-none items-center gap-2.5 rounded-md pr-2",
          MOBILE_RECENT_ROW_HEIGHT_CLASS,
          highlighted && "bg-surface-selected",
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={!isCollapsed}
            aria-label={
              isCollapsed
                ? `Show threads under ${threadTitle}`
                : `Hide threads under ${threadTitle}`
            }
            className="group relative -ml-6 flex h-11 w-13 shrink-0 cursor-pointer items-center rounded-md pl-6 outline-none"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleCollapsed(thread.id);
            }}
          >
            <Icon
              name="ChevronRight"
              className={cn(
                "absolute left-2 size-3 text-subtle-foreground transition-transform duration-150 group-hover:text-muted-foreground group-focus-visible:text-muted-foreground",
                !isCollapsed && "rotate-90",
                depth > 0 && "opacity-60",
              )}
              aria-hidden="true"
            />
            {providerTile}
          </button>
        ) : (
          providerTile
        )}
        <a
          href={thread.href}
          aria-label={`Open ${threadTitle}${indicatorLabel ? ` — ${indicatorLabel}` : ""}`}
          onClick={(event) => {
            const ignoreTouchClick = touchStartedBeforeLink.current;
            touchStartedBeforeLink.current = false;
            if (event.detail > 0 && ignoreTouchClick) {
              event.preventDefault();
              return;
            }
            if (
              event.button === 0 &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey
            ) {
              event.preventDefault();
              navigate.toThread(thread.id);
            }
          }}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2.5 rounded-md text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            MOBILE_RECENT_ROW_HEIGHT_CLASS,
          )}
        >
          <span className="min-w-0 flex-1 space-y-0.5">
            <span
              className={cn(
                "flex min-w-0 items-center gap-1.5 font-medium",
                COARSE_POINTER_TEXT_BASE_CLASS,
              )}
            >
              <ThreadTitle threadId={thread.id} />
            </span>
            <span
              className={cn(
                "flex min-w-0 items-center gap-1.5 leading-4 text-muted-foreground",
                COARSE_POINTER_TEXT_SM_CLASS,
              )}
              title={metadataText}
            >
              {workspaceIconName ? (
                <Icon
                  name={workspaceIconName}
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
              ) : null}
              <span className="min-w-0 truncate">{metadataText}</span>
            </span>
          </span>
          {indicator !== "none" || rowStatus !== null ? (
            <span className="flex size-6 shrink-0 items-center justify-center">
              <ThreadStatusGlyph indicator={indicator} rowStatus={rowStatus} />
            </span>
          ) : null}
        </a>
      </li>
    </ThreadActionsContextMenu>
  );
}

export function Recents({
  highlightedThreadId,
  projectNamesById,
  providersById,
  showCreatingRow,
  threads,
}: RecentsProps) {
  const headingId = useId();
  const [collapsedThreadIdList, setCollapsedThreadIdList] = useAtom(
    collapsedThreadIdsAtom,
  );
  const collapsedThreadIds = useMemo(
    () => new Set(collapsedThreadIdList),
    [collapsedThreadIdList],
  );
  const draftThreadIds = useSidebarThreadDraftIds();
  const toggleCollapsed = useCallback(
    (threadId: string) => {
      setCollapsedThreadIdList((current) =>
        current.includes(threadId)
          ? current.filter((id) => id !== threadId)
          : [...current, threadId],
      );
    },
    [setCollapsedThreadIdList],
  );
  useEffect(() => {
    if (highlightedThreadId === null) return;
    const ancestorIds = getRecentAncestorIds({
      threadId: highlightedThreadId,
      threads,
    });
    if (ancestorIds.length === 0) return;
    setCollapsedThreadIdList((current) => {
      const next = current.filter((id) => !ancestorIds.includes(id));
      return next.length === current.length ? current : next;
    });
  }, [highlightedThreadId, setCollapsedThreadIdList, threads]);
  const recentThreads = useMemo(
    () =>
      getRecentThreads({
        collapsedThreadIds,
        draftThreadIds,
        threads,
      }),
    [collapsedThreadIds, draftThreadIds, threads],
  );
  const hasMountedAllRows = useDeferredValue(true, false);
  const renderedThreads = hasMountedAllRows
    ? recentThreads
    : recentThreads.slice(0, Math.ceil(window.innerHeight / 60) + 1);

  if (!showCreatingRow && recentThreads.length === 0) {
    return null;
  }

  return (
    <section data-recents="" aria-labelledby={headingId} className="md:mt-4">
      <div className="sticky top-0 z-10 mb-1 bg-background px-2">
        <h2 id={headingId} className={CHROME_SECTION_LABEL_CLASS}>
          Recent
        </h2>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-2 h-2 bg-gradient-to-b from-background to-transparent"
        />
      </div>
      {showCreatingRow ? (
        <div
          role="status"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground",
            MOBILE_RECENT_ROW_HEIGHT_CLASS,
          )}
        >
          <span className="min-w-0 flex-1 truncate">Creating thread</span>
          <span className="flex size-6 shrink-0 items-center justify-center">
            <Icon
              name="Loading"
              className={cn(
                "shrink-0 animate-spin",
                SIDEBAR_WORKING_STATUS_COLOR_CLASS,
                COARSE_POINTER_ICON_SIZE_CLASS,
              )}
              aria-hidden="true"
            />
          </span>
        </div>
      ) : null}
      {recentThreads.length > 0 ? (
        <ul className="space-y-px">
          {renderedThreads.map((row) => (
            <RecentThreadRow
              key={row.thread.id}
              highlighted={row.thread.id === highlightedThreadId}
              onToggleCollapsed={toggleCollapsed}
              provider={providersById.get(row.thread.providerId) ?? null}
              projectName={projectNamesById.get(row.thread.projectId) ?? null}
              row={row}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
