# BB Extensions

Joshua Pham’s BB plugin collection. Each plugin has its own manifest, dependencies, lockfile, version, and release tags. Installing one does not install the others.

| Plugin | Directory | Release | Purpose |
| --- | --- | --- | --- |
| Tandem | [plugins/tandem](plugins/tandem) | `tandem/v0.3.4` | Subscription voice for Codex and Claude threads |
| Recents | [plugins/recents](plugins/recents) | `recents/v0.1.2` | Recent and nested threads on the new-thread page |
| Aura | [plugins/aura](plugins/aura) | `aura/v0.2.2` | Custom backgrounds, dithering, fades, and readable chips |

## Install

Add the catalog to browse and install the plugins individually:

```sh
bb marketplace add git:github.com/jshph/bb-extensions@main
```

Or install a plugin directly with its own compatible release range:

```sh
bb plugin install 'git:https://github.com/jshph/bb-extensions.git@^0.3.4' --plugin tandem --tag-prefix tandem/
bb plugin install 'git:https://github.com/jshph/bb-extensions.git@^0.1.2' --plugin recents --tag-prefix recents/
bb plugin install 'git:https://github.com/jshph/bb-extensions.git@^0.2.2' --plugin aura --tag-prefix aura/
```

These commands run trusted plugin code. Review BB’s resolved-source confirmation before proceeding. `bb plugin outdated` checks for compatible releases; `bb plugin update` applies them.

Tandem remains an experimental preview and needs the customized BB native-voice and thread-initialization bridges described in [its release notes](plugins/tandem/docs/release.md). A successful build does not establish stock BB compatibility. Recents requires Plugin SDK 0.6.147 or later, including its experimental homepage contract. Aura is a maintained fork of [Mateo Cerquetella’s Aura](https://github.com/MateoCerquetella/bb-plugins/tree/main/plugins/aura); its original license and notices are retained.

## Develop

Use Node 22.18 or later, npm, and a BB CLI compatible with the plugin APIs. Each plugin installs independently; there are no npm workspaces or cross-plugin dependencies.

```sh
npm run install
npm run verify
npm run verify -- recents
bb plugin build ./plugins/tandem
```

`install` runs `npm ci --include=dev` in each selected directory. `check` runs TypeScript and available lint checks; `test` runs existing suites; `build` bundles with BB; `verify` runs all three. Optional plugin names select a subset. Builds can refresh Aura’s legacy SDK declarations; review generated changes before committing. Read each plugin’s development guidance before editing behavior.

## Release

Update only the affected plugin’s version and lockfile. Verify it, commit the change, and create a fresh immutable tag, for example `git tag -a recents/v0.1.3 -m 'Recents 0.1.3'`. Push the commit and that tag. Never move an existing release tag. Keep the catalog range compatible; update it when deliberately changing the supported release line. The collection manifest indexes directories and does not override plugin identity.

Public source and this custom catalog do not submit plugins to BB Community. A Community listing can reference the same repository, plugin subdirectory, release range, and tag prefix.

## Existing installations

The plugin IDs stay `live-voice`, `recents`, and `aura`. The replaced standalone repositories and personal Aura fork are archived with migration notices; their histories remain available. Running installations and their settings are unchanged. Existing installs keep tracking their old source until explicitly migrated; adding this marketplace alone does not change them. Do not remove and reinstall a plugin casually: settings and storage may need preservation. Reloading Tandem ends active calls, so schedule its source migration between calls.

See [HISTORY.md](HISTORY.md) for source provenance and preserved histories. Each plugin’s license governs its code; root tooling is MIT licensed.
