import { useMemo } from "react";
import {
  definePluginApp,
  experimental_useSidebarThreads,
  experimental_useProviders,
  useComposer,
  type PluginHomepageSectionProps,
} from "@get-bb/plugin-sdk/app";
import { Recents } from "./src/Recents";
import { useRecentsThreadReveal } from "./src/reveal";

function RecentThreads({
  experimental_lastCreatedThreadId = null,
}: PluginHomepageSectionProps) {
  const { threads, projects } = experimental_useSidebarThreads();
  const { providers } = experimental_useProviders();
  const { isSubmitting } = useComposer();
  const projectNamesById = useMemo(
    () =>
      new Map(
        projects
          .filter((project) => !project.isPersonal)
          .map((project) => [project.id, project.name]),
      ),
    [projects],
  );
  const providersById = useMemo(
    () => new Map(providers.map((provider) => [provider.id, provider])),
    [providers],
  );
  return (
    <Recents
      highlightedThreadId={experimental_lastCreatedThreadId}
      showCreatingRow={isSubmitting}
      threads={threads}
      projectNamesById={projectNamesById}
      providersById={providersById}
    />
  );
}

function RevealRecentThreads() {
  useRecentsThreadReveal();
  return null;
}

export default definePluginApp((app) => {
  app.slots.homepageSection({
    id: "recents",
    title: "Recent",
    experimental_layout: "flush",
    component: RecentThreads,
  });
  app.slots.experimental_appOverlay({
    id: "reveal-recents",
    component: RevealRecentThreads,
  });
});
