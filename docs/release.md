# Tandem release status

Tandem 0.3.2 is prepared as an experimental source preview. This document does not announce publication, change repository visibility, or claim compatibility with stock BB.

## Installation boundary

- Builds against published Plugin SDK 0.6.144; the installed BB must support the SDK surfaces in use.
- Native Codex requires the customized `threads.voice` transport bridge and the backing thread’s existing Codex connection. No second writer or API-key fallback is supported.
- Native cached briefing requires the startup-briefing bridge, introduced with host protocol 269. Native voice selection requires the voice-selection extension, introduced with protocol 270.
- New-thread voice requires input-free thread initialization, introduced with protocol 271. Older BB versions reject that creation request.
- Claude transport requires an official Codex CLI signed in with ChatGPT on the BB server; Codex 0.160.1 has been exercised. Its experimental protocol may change.

These protocol numbers identify customized BB changes, not a stock-release compatibility guarantee. The supporting core changes are a separate dependency; this plugin source alone does not install them.

## Naming and upgrades

The plugin and BB project are called Tandem. The package remains `bb-plugin-live-voice` and its plugin ID remains `live-voice` to preserve existing settings, briefing data and diagnostics. The repository URL is unchanged. Keep `private: true` to prevent accidental npm publication; this does not prevent source distribution or BB Git installation.

The Cached briefing boolean replaces the former background dropdown. When upgrading from cached mode, enable the new toggle with `bb plugin config live-voice set cachedBriefing true`. Off and on apply to fresh calls. The deferred briefing/full comparison modes are retired; historical traces remain under bounded retention.

## Verification and limits

Run the TypeScript check, complete plugin test suite and BB plugin build before distribution. Automated coverage includes lifecycle/navigation, empty-input creation and cancellation, playback state, voice selection, startup-only briefing delivery, trace filtering and retention. Synthetic browser checks do not prove physical speaker output, Bluetooth routing, Safari behavior or background/lock-screen reliability.

Cached synthesis uses subscription allowance. Basic diagnostics omit conversation content; detailed diagnostics intentionally retain private text and timing locally. Neither mode records raw audio, SDP, credentials or reasoning. Do not include local databases, logs, transcripts or account files in a release.

## Public distribution

A source snapshot can be shared as a developer preview with the dependency limits above. Before making the existing Git repository public, review its history: earlier revisions include maintainer-specific workspace paths and thread references removed from the current source. A clean source archive avoids shipping that history. Publication of the repository, npm package, marketplace entry or customized BB core is a separate action.

Preserve the existing MIT license and attribution. There has been no trademark or name-availability review for Tandem.
