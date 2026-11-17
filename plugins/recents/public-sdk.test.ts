import { expect, it } from "vitest";
import { experimental_scanPublicSdkOnly } from "@get-bb/plugin-sdk/testing";

it("remains installable without private BB source or workspace dependencies", () => {
  const result = experimental_scanPublicSdkOnly(import.meta.dirname, {
    allow: [
      /^react(?:\/.*)?$/,
      /^jotai(?:\/utils)?$/,
      /^clsx$/,
      /^@testing-library\/react$/,
      /^vitest(?:\/config)?$/,
    ],
  });
  expect(result.violations).toEqual([]);
  expect(result.privateDependencies).toEqual([]);
});
