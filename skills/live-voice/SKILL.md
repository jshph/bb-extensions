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
