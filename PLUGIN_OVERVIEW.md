## Keep recent work within reach

Open the new-thread page to find your latest conversations alongside the
composer. On desktop the list sits below it; on compact screens it scrolls
above it.

Recents keeps child threads nested under their parents, lets you collapse
branches, and shows live status, unsent drafts, provider icons and workspace
metadata. Thread rows keep BB's own actions menu. The list shows up to fifteen
visible rows.

Creating a thread shows progress and highlights the result when you stay on
the new-thread page. Navigating to a nested thread or receiving unread activity
reveals its ancestors. Existing browser collapse preferences carry over from
the original core implementation.

## Requirements

Requires BB with Plugin SDK 0.6.147 or later, including the companion homepage
section changes. No external service or additional account is required. The
plugin works independently of Tandem.

Use `bb recents list --json` for a bounded snapshot through the CLI. Browser
collapse choices and local drafts remain specific to that client.
