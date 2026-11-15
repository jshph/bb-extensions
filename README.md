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
