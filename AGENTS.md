# BB Extensions

Each directory in plugins/ is an independent plugin. Preserve its package name and BB ID. Read its local guidance before behavioral changes. Keep dependencies and lockfiles per plugin; do not introduce cross-plugin runtime imports. Keep per-plugin licenses and notices intact.

Use npm run verify -- <collection-name> for changed plugins. Root tasks use each plugin’s existing checks and the installed bb CLI. Never commit dist or node_modules. Publish independent immutable <collection-name>/v<version> tags; update marketplace.json for a new supported release line. Do not reload a production plugin merely to verify repository packaging. Tandem reloads end active voice calls.
