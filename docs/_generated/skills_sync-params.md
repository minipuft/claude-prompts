| Name | Type | Status | Required | Description |
| --- | --- | --- | --- | --- |
| `action` | enum[status\|export\|sync\|diff\|pull\|clone] | working | yes | Operation: status (inspect config/manifests), export (write skills), sync (reconcile to registrations with optional prune), diff (show drift and optional .patch output), pull (merge exported prose edits back to canonical YAML), clone (create canonical resources from SKILL.md). |
| `category` | string | working | no | For clone: target category for prompt resources. Default: general. |
| `client` | string | working | no | Target client id. Use one of: claude-code, cursor, codex, opencode, or all. |
| `dry_run` | boolean | working | no | For export/sync/pull/clone: show planned changes without writing files. |
| `file` | string | working | no | For clone: path to the source SKILL.md file. Required for clone action. |
| `force` | boolean | working | no | For clone: overwrite existing resource directory. |
| `id` | string | working | no | Optional resource id filter. |
| `output` | string | working | no | For diff: write .patch files to this directory instead of stdout only. |
| `preview` | boolean | working | no | For pull: show unified diffs without writing changes. |
| `prune` | boolean | working | no | For sync: when true (default), remove stale managed skills not present in current registrations. |
| `resource_type` | enum[prompt\|gate\|methodology\|style] | working | no | Optional resource type filter. |
| `scope` | enum[user\|project] | working | no | Output scope for client directories. Default: user. |
