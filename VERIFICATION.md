# Initial collection verification

Verified on 2026-11-17 with Node 22.23.1 and the customized BB installation exposing Plugin SDK 0.6.147.

- Clean, separate dependency installation with npm ci --include=dev for all three plugins.
- Tandem: TypeScript check, 112 tests across 24 files, server and app bundles.
- Recents: TypeScript check, oxlint, 19 tests across 5 files, server and app bundles.
- Aura: TypeScript check, 9 tests, server and app bundles. Standalone installation required declaring cron-parser and hono as development dependencies for the SDK test host; the earlier shared repository supplied them implicitly.
- Collection and marketplace validated with BB's source parsers. Catalog identities, versions, icon files, and overview lengths checked against the plugin manifests.
- Current Markdown relative links checked for missing targets. Git diff whitespace check passed.

SDK pin warnings are expected: Tandem pins 0.6.144, Recents pins published 0.6.146 with its documented provisional homepage declarations, and Aura pins 0.4.21. Aura still uses the supported legacy threadPanelAction registration and receives its retirement warning. This consolidation does not migrate SDK APIs or claim compatibility beyond each plugin's documented requirements.

No production plugins were reloaded or source-switched. Automated checks do not verify physical voice-device routing or newly exercise the complete live Aura interface; the source consolidation preserves those implementations and their existing regression coverage.
