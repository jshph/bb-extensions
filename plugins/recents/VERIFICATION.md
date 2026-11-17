# Verification

Verified on Linux, 2026-11-17, against the companion BB core checkout with
Plugin SDK 0.6.147. Core changes remain local and are not deployed to production.

## Automated checks

- Standalone `npm install`, `npm run typecheck`, `npm run lint`, and `npm test`
  pass. All 19 tests pass, including the public-SDK-only import/dependency scan,
  hierarchy, cycle termination, attention ordering, reveal policy, frontend
  collapse persistence, drafts, creation state, metadata and the real plugin CLI.
- Core's targeted app tests pass: 184 tests across homepage/plugin mounts,
  composer layout, root compose helpers, sidebar layout and navigation.
- SDK registration and version tests pass: 12 tests.
- Turbo typechecks/lint pass for the app, SDK and Plugin Guide. The app lint
  reports existing warnings; it reports no errors.
- The standalone source builds with `bb plugin build` and installs from its
  own directory into the isolated app. Its frontend bundle reports SDK
  0.6.147 compatibility and the plugin reports `running`.

## Live checks

The isolated source app used a fresh migrated database and 19 synthetic idle
threads. No provider tasks were started by the checks.

Desktop Chromium at 1280×720:

- Fifteen rows render below the composer, with one plugin-owned heading.
- Collapse persists after reload.
- Opening a child through the sidebar expands its ancestors in Recents.
- Right-click opens BB's existing thread menu.

Compact Chromium at 393×852 with touch emulation:

- Recents starts above the bottom-pinned composer, without horizontal overflow.
- Parent controls collapse and expand children.
- A touch long-press opens BB's Thread actions drawer without navigating.
- Disabling Recents removes its content while retaining the composer.

`bb recents list --json` returns a bounded snapshot with the same nesting and
ordering. The CLI intentionally expands parents, since browser collapse state
and unsent drafts belong to that client.

## Limits

Native iOS Safari was not run on this Linux host. The archive-based QA checkout
uses shared dependencies; Vite blocked its symlinked Inter font URL, so browser
screenshots use the fallback font. The source verification inventory check was
blocked by its pre-existing unmapped `diagnostics` CLI family. No unrelated
inventory baseline was changed.

The public source repository is `jshph/bb-plugin-recents`.
