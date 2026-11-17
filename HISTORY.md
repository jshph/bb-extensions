# Source history

Imported without squashing on 2026-11-17. The original repositories are retained and their branches and tags have not been rewritten.

| Plugin | Original source | Source revision | Import |
| --- | --- | --- | --- |
| Tandem | [jshph/bb-plugin-live-voice](https://github.com/jshph/bb-plugin-live-voice) | `db21e3a` (`fix/explicit-voice-thread-initialization`) | Full ancestral commits retain their original hashes, authors, and dates |
| Recents | [jshph/bb-plugin-recents](https://github.com/jshph/bb-plugin-recents) | `5c8fdac6cec5c142ee22b0912ba40b16d81f71c5` | Full ancestral commits retain their original hashes, authors, and dates |
| Aura | [jshph/bb-plugins](https://github.com/jshph/bb-plugins), originally [MateoCerquetella/bb-plugins](https://github.com/MateoCerquetella/bb-plugins) | `3552721` (`fix/aura-compose-readability-cache`) | Only `plugins/aura` was split; authors and dates survive, commit hashes change |

Aura’s split tip is `d099ef1391f9327f4b0f9a3ea72484297a52a265`. Its unrelated upstream plugins are excluded. Reproduce the split with `git subtree split --prefix=plugins/aura 3552721` in the original repository.

Tandem includes 13 local commits after public main `255383b`, covering module organization, call startup/cancellation, bounded polling, and explicit voice-thread initialization. Aura includes the two local dithering commits after fork branch `aee0780`. The initial collection also carries the deployed Aura CSS adjustment that applies readable composer and recent-thread surfaces at compact widths; this adjustment previously lived only in the installed source cache. Older cached test files were not copied over the newer source tests.

The subtree merge commits connect original histories to the current directories. Use `git log --all` to inspect original commits; simple path-limited history can stop at the import boundary because earlier standalone files lived at repository root. The merge commits record `git-subtree-dir` and `git-subtree-split` provenance.

Aura’s two README screenshots were copied from the original collection’s `docs/media/aura`; they accompany the fork documentation.

A bounded review of 342 imported historical source blobs found no common credential patterns or sensitive account/database filenames. This is not a comprehensive audit.

No application databases, user backgrounds, transcripts, or local account files are included. Earlier public Tandem history includes development paths and opaque thread references; see its release notes for context. Runtime installations continue to use their previous sources until a separate migration.

## Superseded repositories

The standalone Recents and Tandem repositories and the personal Aura fork are deprecated with migration notices pointing here. Initially they remained unarchived for outstanding reviews. The old Tandem repository was subsequently archived after its startup follow-up was re-raised as [collection issue #1](https://github.com/jshph/bb-extensions/issues/1) and old [PR #10](https://github.com/jshph/bb-plugin-live-voice/pull/10) was closed with a migration pointer. Other historical Tandem PRs remain readable in the archive; they were not bulk-closed. Recents and the personal Aura fork remain deprecated and unarchived. Existing install URLs remain readable but receive no future releases. The original upstream Aura collection remains independent.

Before retirement, every published Tandem and Recents branch tip was checked against this repository. The additional Tandem documentation commit `2306f6e` was merged into `plugins/tandem`. Local side branches that were not ancestors of the initial import are preserved under `archive/tandem/`, including `cleanup-diagnostics` and `refactor/source-organization`. These branches retain their original standalone tree layout and are historical snapshots, not installable collection releases. Their alternate changes have not been merged into the maintained implementation. All seven original local Tandem branch tips have corresponding archive branches.

A follow-up bounded scan of 371 historical blobs, including the additional branches, found no common credential-pattern matches. Only Aura's plugin subtree history was imported; unrelated plugins in the old personal upstream fork remain in that original repository. No branches or tags in the old repositories were deleted or rewritten.

BB Core PRs [#7620](https://github.com/get-bb/bb/pull/7620) and [#7621](https://github.com/get-bb/bb/pull/7621) use branches in `jshph/bb`, not the deprecated plugin repositories. That core fork and those PRs are unchanged by this consolidation.
