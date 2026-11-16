# Live Voice (working name)

One voice interface for Codex and Claude threads in BB, using Codex’s ChatGPT subscription authentication. The name is provisional. This repository is an experimental private release, not a Community marketplace submission.

## What it does

A waveform beside the composer’s dictation microphone starts two-way audio. The waveform initiates the call; while connecting or connected, mute and the red circular hang-up button stay visible beside a noninteractive waveform indicator. The connected/unmuted waveform gently pulses; assistant playback animates its bars and adds a glow. Muted silence is steady. The pulse indicates connection state, not microphone volume. There is no expansion/collapse stage or live-waveform click action in either surface; End stays available while connecting and Reconnect plus End stay available after disconnection. Reduced-motion preferences suppress animation while preserving the glow. Mute affects your microphone. Hang-up closes voice while leaving submitted coding work running. Use BB’s thread controls to explicitly cancel agent work; actions already completed are not undone. Browser-native barge-in remains available when you speak over audio.

Voice stays attached to its original thread as you navigate within BB. On the call’s thread, controls stay beside the composer. Elsewhere, a compact floating dial names the call’s thread and lets you return, mute, or hang up. The dial is portaled outside layout clipping with explicit pointer handling, a nondraggable surface, 36-pixel composer controls that fit its clipped action slot and 44-pixel floating controls. Agent progress and briefing details stay out of the call controls; connection, playback-permission and error feedback remain available. Starting voice in another thread offers an explicit switch; navigation never transfers the call's context or microphone to the thread you are viewing. There is one call per app window (other windows can still have their own calls, subject to the server limits). Closing/reloading the page ends the call. Starting voice again creates a fresh realtime conversation using that thread's configured background policy; it does not restore the previous call's audio conversation. There is no pause/resume state.

On **New thread**, the waveform creates a visible thread using the selected project, environment, provider, model, reasoning level, service tier and permission mode, waits for its provider to initialize, then connects voice. Opening the screen alone creates nothing. Creation sends empty input: no placeholder coding request, draft text, mentions or attachments are submitted. The New thread draft stays intact. Ending during setup prevents a late connection or navigation, but an already-submitted thread creation may still complete and leave the thread in the sidebar. Setup failure leaves the created thread available for inspection and a later voice attempt. Only Codex and Claude selections show the voice action. The SDK's composer selection does not expose provider-specific session option overrides or picker provenance; the thread uses BB's defaults for those fields.

New-thread voice requires BB's input-free thread initialization support (host protocol 271). Earlier BB versions reject ordinary empty-input creation; the plugin reports that a BB update is needed. The SDK supports this initialization with `threads.spawn({ projectId, environment, input: [], ... })`; the CLI equivalent is `bb thread spawn --project <id> --initialize-only`.

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

Version 0.3.0 adds experimental `cached` background. The plugin synthesizes a compact reference from recent user messages, root assistant answers, and completed tool results, using an isolated Codex session authenticated with your ChatGPT subscription. The JSON reference contains goals, decisions, verified findings with event pointers, and unresolved questions. It is historical evidence, not authorization to resume old work.

A fresh briefing enters the initial realtime context before audio connects, for both Codex and Claude. A missing, stale, busy, or failed preparation starts retrieval-only for that entire call. Preparation never delays startup on model generation, and a result that finishes during a call is reserved for the next call. No cached-mode background is appended after connection. The backing agent remains available for focused evidence retrieval. Initial context is not a guarantee of model attention or silence.

Cached briefing defaults to off. Enable the **Cached briefing** toggle in plugin settings or use `bb plugin config live-voice set cachedBriefing true`, then start a fresh call. Only voice-used or explicitly prepared threads are watched; watched threads refresh after backing turns become idle. Active threads invalidate pending/stored briefings. Synthesis uses the latest 12 user requests and 100 completed items after the last context clear, up to 60,000 source characters, clipping individual items at 6,000 characters. Earlier evidence may be absent. Compiler output is validated, includes only supplied event pointers, and is capped at 3,000 JSON characters (4,000 including framing). It can still omit or misinterpret a fact; ask the backing agent when uncertain.

Briefings are private local plugin data, retained for up to 20 watched threads and seven days. A briefing is usable for 24 hours only while its thread revision matches. Synthesis consumes Codex subscription allowance, runs one job at a time, and uses a 90-second deadline with no API-key fallback. The compiler is instructed to treat source as quoted data, with shell, web, and multi-agent features disabled; observed tool execution rejects preparation. Failed preparation falls back to retrieval.

Cached native Codex calls require the customized startup-briefing bridge (host daemon protocol 269); the bridge is additional to the original transport requirement. Codex delegation still uses the original provider connection.

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

Diagnostics default to **basic**: compact metadata for lifecycle, safe failure categories, connection/playback/microphone state, turn boundaries, background policy, startup cache state/age/fingerprint/length, and first/final delegation milestones. Basic excludes transcripts, context/request/result text, individual backing deltas, and chunk timing. Browser filtering happens before transmission and the server enforces each call's frozen policy again, including late batches after call end. Native observation fetches only functional state/turn events in basic mode; Claude's streaming and delivery remain intact.

Choose detailed only when investigating a problem:

```sh
bb plugin config live-voice set diagnostics detailed
bb plugin config live-voice set diagnostics basic
```

Changes apply to fresh calls. Detailed records private spoken/context/request/result text, backing deltas and exact chunk timing. It never records audio, SDP, transport credentials, or reasoning. Historical detailed traces from the retired full-background mode can contain source/tool material. Startup traces describe an attempted context input; negotiated connection is recorded separately. Lookup fallback records its actual cache state (missing/busy/preparing/stale/error), not a claim that context was delivered. Native backing observations cannot verify outgoing wire delivery. Neither an acknowledgement nor a content fingerprint proves model attention or physical speaker output.

Traces stay in the plugin's local database and survive call end/reload. Retention is 20 calls and seven days, capped at 256,000 serialized JSON bytes per basic call or 2,000,000 per detailed call, with 32,000 bytes reserved for stop/failure evidence. These are logical limits, excluding SQLite/index/WAL overhead and the separate product briefing cache. Existing detailed traces keep their original policy and age out normally; this update does not purge them. Freed SQLite pages can be reused without shrinking the file immediately. Basic reduces diagnostic disk/transport overhead; it does not change the context sent to voice or subscription usage for synthesis.

Inspect with `bb plugin rpc inspect live-voice`, `traceSessions` (`{ "threadId": "thr_..." }` or `{}`) and `traceRead` (`{ "sessionId": "UUID", "afterId": 0 }`). Page afterId using the last returned cursor until empty. Sessions report their frozen diagnostics policy. The CLI form is:

```sh
bb plugin rpc call live-voice traceSessions --input-file /tmp/voice-thread.json --json
bb plugin rpc call live-voice traceRead --input-file /tmp/voice-call.json --json
```

The dropped counter reports budget drops. Browser sequence gaps, truncation flags and unsaved exit batches can also indicate incomplete evidence. Browser elapsedMs is monotonic; server elapsedMs uses wall time. Server sequence numbers are plugin-global, so per-call server gaps alone do not establish loss. Detailed delivery records correlate Claude updates with updateSeq; native and Claude timings are not equivalent end-to-end measurements. Trace-save warnings are limited to once per minute per call/browser collector. Diagnostics never wait before stopping voice or trigger model calls, response generation, or custom turn detection.

## Briefing setting

**Cached briefing** is a toggle. On supplies a fresh prepared briefing in the initial realtime context; off supplies no plugin background. Missing or stale briefings leave the entire call retrieval-only. Changes apply to new calls, without a reload. The former `backgroundMode` dropdown and its deferred comparison modes are retired. Existing briefing data and diagnostics remain intact; when upgrading from the dropdown, enable the toggle if you previously used cached mode.


## Briefing controls

All three RPCs take `{ "threadId": "thr_..." }` through `--input-file`:

```sh
bb plugin rpc call live-voice briefingStatus --input-file /tmp/voice-thread.json --json
bb plugin rpc call live-voice prepareBriefing --input-file /tmp/voice-thread.json --json
bb plugin rpc call live-voice forgetBriefing --input-file /tmp/voice-thread.json --json
```

`briefingStatus` returns `missing`, `busy`, `preparing`, `ready`, `stale`, or `error`; only ready responses include the JSON text. `prepareBriefing` watches the thread and queues preparation when idle without waiting for synthesis. It can explicitly prepare a cache even while background is off. `forgetBriefing` deletes the cache and watch. Turning Cached briefing off cancels queued/in-progress automatic preparation; existing calls keep their startup policy. `context.startup` records attempted startup cache metadata (and the exact reference only in detailed mode). The `start` RPC returns `briefing: ready | lookup` in cached mode. Turn Cached briefing off to restore the baseline for new calls.
