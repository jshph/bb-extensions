# Live Voice (working name)

One voice interface for Codex and Claude threads in BB, using Codex’s ChatGPT subscription authentication. The name is provisional. This repository is an experimental private release, not a Community marketplace submission.

## What it does

A waveform beside the composer’s dictation microphone starts two-way audio. Mute affects your microphone. End closes voice while leaving submitted coding work running. Stop agent explicitly requests cancellation of the backing thread’s work; actions already completed are not undone. Browser-native barge-in remains available when you speak over audio.

The plugin owns the shared browser audio client, controls, session identity, deferred background delivery, leases, context for delegated requests, and UI update delivery.

- **Codex:** uses the existing provider app-server connection and native realtime delegation. It never opens a second writer for the coding thread or sends the same delegation through BB again. Native progress, permissions, and handoffs remain native.
- **Claude:** uses a temporary ChatGPT-authenticated Codex app-server to establish WebRTC, detaches it before the browser connects, then routes requests through the selected Claude thread. Thread events wake result readers; BB realtime notifications wake the browser. Root assistant text streams as it arrives rather than waiting for the entire turn. No raw reasoning or tool output is forwarded as speech.

Voice follow-ups can steer the plugin’s active Claude task. A task started outside the call is not silently steered or queued. Unsupported steering reports a failure while the original work can continue. Tool approvals stay in BB. Session IDs, request/turn correlation, update sequence cursors, and superseded-request filtering prevent duplicate execution and stale delivery. Reconnects can catch up from a cursor within bounded retention; expired delivery fails explicitly.

## Requirements and current boundary

Builds against published `@get-bb/plugin-sdk` **0.6.144**. The installed BB must support the SDK surfaces used by the plugin.

**Native Codex additionally requires BB’s `threads.voice` provider transport bridge.** This capability is present in the customized BB installation this plugin was built for. It is not established as available in stock BB releases. The plugin checks for it and fails clearly when missing; it does not replace native Codex with a slower detached transport. The provider bridge and its server/daemon routing remain necessary infrastructure. Only the duplicated provider-owned voice UI/client have been removed in this installation. A general supported upstream transport contract is required before claiming stock-BB Codex compatibility.

Claude’s transport requires Codex 0.160.1 or a compatible version, installed and signed in with ChatGPT **on the BB server**. A sign-in only on another enrolled coding host does not suffice. Use the plugin’s Codex executable setting if a shell wrapper selects another account. There is no API-key setting or fallback. Claude retains its existing BB authentication and billing.

The subscription transport uses experimental Codex behavior. Codex changes can require an adapter update. Only Linux browser/server transport has been exercised automatically; Bluetooth routing, Safari, and background/lock-screen behavior need device testing.

## Context and response policy

Codex retains its native bounded thread-context and handoff path. Claude receives the latest completed backing-agent answer silently after the first spoken exchange, then asks its backing thread for missing information. This does not generate a semantic summary of the entire thread.

Delegated instructions and quoted context are agent-only; chat shows new spoken words or a labeled voice-model task. Instructions are sent once per call after provider acceptance, and later requests contain only new or changed spoken turns. Grouped transcripts preserve corrections, continuations, and explicit incompleteness. Exact echoes of backing answers are omitted; paraphrases are conversational reference, not independent evidence. Up to 350 ms is allowed for a user turn to finish before delegation.

Streaming makes available text reach voice sooner; it cannot make the backing model’s research itself faster. Progress and partial findings must retain their qualifications. Existing historical messages are not rewritten.

## Install and develop

Install from this private repository using an authenticated Git setup, or from a local checkout:

```sh
bb plugin install ./bb-plugin-live-voice
```

For development:

```sh
npm ci --include=dev
npm run check
npm test
bb plugin build .
bb plugin reload live-voice
```

The plugin also exposes schema-validated RPC methods through `bb plugin rpc inspect live-voice`: `available`, `start`, `stop`, `context`, `poll`, `delegate`, and `control`. `start` requires a caller-owned WebRTC SDP offer; the CLI does not record audio. `poll` takes an optional `afterSeq` cursor. `control` accepts `cancelWork`. `delegate` is only for the detached Claude adapter.

End existing calls before upgrading, then start a new call. The source and installed package retain the provisional `live-voice` identity until naming is settled.

## Per-call diagnostics

Version 0.2.1 records local, bounded traces for new calls. They include browser wall-clock and monotonic elapsed timestamps, server receipt timestamps, sequence numbers, received turn/transcript/delegation events, exact background context chunks sent, context acknowledgements, context delivery gate state, playback start/block events, connection state and closure reasons. Claude traces also correlate backing updates with browser receipt and sent delegation chunks. Codex traces capture backing events observed through BB; the native app-server's outgoing delegation wire chunks are not exposed to this plugin.

No raw audio, SDP, transport credentials, reasoning, or tool output is recorded. **Spoken transcripts and delivered context text are recorded**, so traces can contain private conversation/source material. They stay in the plugin database on this BB server. Retention is the latest 20 calls, seven days, and 2 MB per call; cleanup runs every ten seconds and on access. Oversized transcript/backing entries are explicitly marked truncated at 32,000 characters; sent context chunks are captured whole. The session's `dropped` count reports storage-cap drops. Missing browser sequence numbers indicate unsaved/dropped batches. A browser crash or page close can lose the last unsaved batch; tracing is best effort and never waits before stopping voice.

Inspect schemas with `bb plugin rpc inspect live-voice`. List calls and then page the selected trace:

```sh
bb plugin rpc call live-voice traceSessions --input-file /tmp/voice-thread.json --json
bb plugin rpc call live-voice traceRead --input-file /tmp/voice-call.json --json
```

The first input is `{ "threadId": "thr_..." }` (or `{}` for all calls). The second is `{ "sessionId": "UUID", "afterId": 0 }`; set `afterId` to the last returned `cursor` to read the next page, until it is empty. Traces survive call end and plugin reload. Browser timestamps and server clocks can differ: use browser `elapsedMs` for browser ordering, server `receivedAt` for ingestion, and `eventAt` for original BB backing-event timestamps. `context.sent` means the browser handed bytes to WebRTC; `context.acknowledged` is the session acknowledgement, not proof of model attention or audible playback. `audio.play.started` means playback was allowed, not that a physical speaker was heard. Turn events report the provider's decisions; they do not expose its internal VAD confidence or audio boundary samples. No turn detection, prompts, or response triggers are changed by tracing.

## Comparing background behavior

Version 0.2.2 adds the `backgroundMode` setting: `off`, `briefing` (default), or `full`. The selection is frozen at call start and recorded as `context.policy` in its trace. Change it in plugin settings or with `bb plugin config live-voice set backgroundMode off`, then start a fresh call. No reload is needed for a setting change.

`off` suppresses all plugin-supplied background through both native polling and the delegated context RPC. Native session instructions and delegation remain unchanged. `briefing` supplies at most 2,000 characters of the latest completed backing-agent answer, with a thread title and explicit excerpt/omission labels; fenced code is excluded. This is an extractive briefing, not an AI-generated summary of all earlier facts or tool evidence. Missing details remain retrievable through the backing agent. `full` restores the previous native context or Claude latest-answer path for comparison.

For a controlled comparison, use the same thread and opening words, keep the microphone/device unchanged, and pause for 15 seconds after the assistant's greeting. First use `off`, then repeat in a fresh call with `briefing`. Compare unprompted assistant turns and affirmations against `context.sent` and acknowledgements. Keep full-context injection out of ordinary testing until these results are understood. There is no proven guarantee that even a compact background append will remain behaviorally silent.
