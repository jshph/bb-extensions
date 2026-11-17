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
