import { cliCommand, defineCli, type BbPluginApi } from "@get-bb/plugin-sdk";
import { getRecentThreads } from "./src/model";

export default function recents(bb: BbPluginApi) {
  bb.cli.register(
    defineCli({
      name: "recents",
      summary: "List the new-thread page's recent threads",
      commands: {
        list: cliCommand({
          summary:
            "List up to fifteen recent rows, with children nested under parents",
          options: {
            json: { type: "boolean", description: "Print rows as JSON" },
          },
          async run(input) {
            const navigation = await bb.sdk.projects.sidebarBootstrap();
            const projects = [
              navigation.personalProject,
              ...navigation.projects,
            ];
            const threads = projects.flatMap((project) =>
              project.threads.map((thread) => ({
                ...thread,
                isHidden: thread.visibility === "hidden",
                isArchived: thread.archivedAt !== null,
              })),
            );
            const rows = getRecentThreads({
              threads,
              collapsedThreadIds: new Set(),
              draftThreadIds: new Set(),
            }).map(({ thread, depth, hasChildren }) => ({
              id: thread.id,
              projectId: thread.projectId,
              title: thread.title ?? thread.titleFallback ?? thread.id,
              depth,
              hasChildren,
              latestAttentionAt: thread.latestAttentionAt,
            }));
            return {
              exitCode: 0,
              stdout: input.options.json
                ? JSON.stringify({ rows })
                : rows
                    .map(
                      (row) =>
                        `${"  ".repeat(row.depth)}${row.id}\t${row.title}`,
                    )
                    .join("\n"),
            };
          },
        }),
      },
    }),
  );
}
