---
name: live-voice
description: Explain or troubleshoot the Live Voice plugin, shared Codex/Claude controls, subscription authentication, and delegation lifecycle.
---

Live Voice is the provisional name of the shared voice UI for Codex and Claude threads. Start it from the waveform next to dictation. Mute affects microphone capture. End closes voice while leaving submitted coding work running. Stop agent explicitly requests cancellation; completed actions are not undone.

Codex uses the existing native provider connection through BB’s threads.voice bridge. The plugin must not open another writer for that coding thread or re-execute native delegations. The local customized BB has the bridge; stock-BB native compatibility is not established. A missing bridge fails explicitly.

Claude uses a temporary Codex app-server only to negotiate subscription-authenticated browser audio, then detaches it and delegates to the selected BB thread. It requires Codex ChatGPT sign-in on the BB server. Use codex login status without reading credentials. The executable setting can select the official CLI when a shell wrapper changes accounts. API keys and API billing fallback are unsupported.

Claude result delivery is event driven and incremental. A follow-up can steer voice-owned active work; unrelated active tasks are not silently queued or steered. Tool approvals stay in BB. Raw reasoning and tool logs are not streamed as speech. Context instructions are agent-only, apply to voice requests, and are sent once after provider acceptance. New handoffs carry only new or corrected spoken turns. Existing historical wrappers remain unchanged.

Use bb plugin rpc inspect live-voice for available, start, stop, context, poll, delegate, and control schemas. start needs caller-supplied WebRTC SDP; poll supports afterSeq; control accepts cancelWork. The CLI does not record or play voice.

Use bb plugin list and bb plugin logs live-voice for health. Rebuild with npm run check, npm test, and bb plugin build . before reload. Start a fresh call after upgrades. Do not claim automatic whole-thread semantic briefing, general stock-BB compatibility, rollback of completed actions, or physical-device verification that has not happened.


From 0.2.1, use traceSessions ({threadId?}) and traceRead ({sessionId, afterId?:0}) RPCs for local per-call diagnostics; page afterId with the last returned cursor until empty. trace accepts browser batches; it is diagnostic ingestion, not a voice-control command. Traces include exact sent context chunks, session acknowledgements, transcript/turn events, context gates, playback and connection state, backing updates, and sequence/timing metadata. They retain private transcript/context text, never raw audio/SDP/transport credentials, for up to 20 calls, seven days, and 2 MB per call. dropped counts, truncated flags, and browser sequence gaps indicate incomplete evidence. Recent unsent browser batches can be lost on page exit. Storage is the plugin database and survives call end/reload. Browser elapsedMs is monotonic; browser/server wall clocks may differ. Native outgoing app-server delegation wire chunks are not available to the plugin; distinguish observed BB backing events from verified voice delivery. An acknowledgement does not prove model attention, and playback allowed does not prove physical speaker output. Compare context.sent and context.acknowledged with received turn/transcript events before attributing early responses to context. No custom endpointing is introduced by tracing.


Version 0.2.2 adds backgroundMode: off, briefing (default), full; configure with bb plugin config live-voice set backgroundMode <mode>. Changes apply only to new calls; context.policy records the frozen mode. Off suppresses both plugin background delivery routes without changing native instructions/delegation. Briefing uses a bounded latest-answer excerpt (2,000 characters, no fenced code), not a semantic whole-thread summary; full restores the previous context path. For diagnosing unsolicited affirmations, compare fresh calls on the same thread with identical opening words and a 15-second pause, off first and briefing second. Acknowledged context appends can still affect behavior; do not promise silence. Inspect traces before attributing symptoms to endpointing. The local installation may intentionally be set to off for baseline testing.
