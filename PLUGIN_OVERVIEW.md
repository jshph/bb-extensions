Talk with the coding agent in your BB thread, using a shared voice interface for Codex and Claude.

## What you get

Start from the waveform beside dictation. Speak naturally, mute your microphone, or hang up. Click the active composer waveform to reveal controls; a floating dial follows you off-thread. Cancel agent work through BB’s thread controls. Coding work can continue after voice ends. Tool approvals remain in BB.

Codex uses its existing native realtime connection. Claude receives incremental conversation context and streams backing-agent responses through an event-driven adapter. Delegation instructions stay out of the visible user message.

## Requirements

This is an experimental private release with a provisional name. It uses Codex signed in with ChatGPT and has no API-key fallback. Claude voice requires that sign-in on the BB server and retains its existing provider authentication. Native Codex requires the native voice transport bridge in this customized BB build; stock-BB compatibility is not yet established. Codex protocol changes may require updates. Device audio routing and background behavior require further testing.
