# Development home

The canonical development checkout on jpham-server is `/workspace/projects/bb-plugin-live-voice`, registered as the **Live Voice** BB project (`proj_r95628sbm8`). Spawn future plugin-development threads in that project. The private remote is https://github.com/jshph/bb-plugin-live-voice. The name remains provisional.

The former development checkout lives inside Personal thread storage, under `/home/dev/.bb/plugins/environment-personal-workspace/host-data/workspaces/thr_4xkn229sui/bb-plugin-live-voice`. It is historical context; new work belongs in the permanent checkout. Do not delete it while an existing thread is inspecting it.

Use `npm ci --include=dev`, `npm run check`, `npm test`, and `bb plugin build .` in this checkout. Install the built path with `bb plugin install /workspace/projects/bb-plugin-live-voice`. Settings and local database state belong to plugin id `live-voice`; verify they survive any source switch. Reloading or reinstalling ends active calls.

The customized native bridge is in `/workspace/projects/bb/plugins/provider-codex/src/bridge/voice.ts`. Its startup-briefing extension was committed as `329ea6805` with host protocol 269. This core checkout follows its own AGENTS.md and canonical deploy script; a plugin-only change normally needs no core deployment.

## Evidence and ongoing work

- Original design and implementation: @thread:thr_4xkn229sui.
- Read-only diagnostic cleanup audit started before this project existed: @thread:thr_pngbkat3jr. No cleanup implementation is authorized by that audit brief.
- First prepared distillation follow-up for a fresh voice call: @thread:thr_d7xnecthjy, in the distillations project. Its briefing was verified ready before the ready notification was sent. Its source transcript remained unverified; preserve that qualification.
- Startup-context experiments and installed smoke result: `/home/dev/.bb/thread-storage/thr_4xkn229sui/voice-startup-briefing/`. The installed muted synthetic call connected with a fresh briefing and cache/traces survived reload. These checks do not establish physical speaker or Bluetooth behavior.

For a prepared follow-up, register `prepareBriefing({threadId})` while research is active, allow the final response to be saved and the thread to become idle, and check `briefingStatus({threadId})` until ready before notifying. Existing automatic thread completion notifications can precede cache readiness; the trial used input-only notifications for the child and an explicit ready notification after verification. This is a single manual trial, not a standardized scheduler.
