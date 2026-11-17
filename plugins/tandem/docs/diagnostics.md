# Troubleshooting Tandem

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


## Transport and device checks

A successful connection check confirms negotiation, not audible playback. Start a fresh call after a plugin reload. Validate microphone and speaker routing on the actual device; Bluetooth, Safari and background behavior are not established by synthetic Chromium tests. Report the adapter, BB/Codex versions, connection state and whether playback was permitted. Do not include account files, raw audio or SDP in reports.
