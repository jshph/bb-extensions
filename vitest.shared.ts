import type { ViteUserConfig } from "vitest/config";

export function sharedWorkerProjects(): NonNullable<
  NonNullable<ViteUserConfig["test"]>["projects"]
> {
  return [
    {
      extends: true,
      test: {
        name: "recents:node",
        environment: "node",
        isolate: false,
        include: ["**/*.test.ts"],
        exclude: ["node_modules/**", "dist/**"],
      },
    },
    {
      extends: true,
      test: {
        name: "recents:dom",
        environment: "jsdom",
        isolate: true,
        include: ["**/*.test.tsx"],
        exclude: ["node_modules/**", "dist/**"],
      },
    },
  ];
}
