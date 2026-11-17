---
name: recents
description: List the recent threads shown on BB's new-thread page through the Recents plugin.
---

Use `bb recents list` for a readable list or `bb recents list --json` for
`{ rows: [{ id, projectId, title, depth, hasChildren, latestAttentionAt }] }`.
The result is limited to fifteen visible rows, sorted by attention, creation
time and ID, with children nested below parents. Hidden and archived threads
are excluded. The CLI expands parents; browser collapse state and unsent drafts
are client-local. Use existing `bb thread` commands for thread actions.
