# CPM CLI

Standalone workspace management tool for [Claude Prompts MCP](../README.md). Validates, lists, inspects, and initializes workspaces without starting the server.

## Quick Start

```bash
# From repo root
npm install
npm -w cli run build

# Validate a workspace
node cli/dist/cpm.js validate --all --workspace server

# Or symlink for global access
npm -w cli link
cpm validate --all -w server
```

## Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `validate` | Check resources against Zod schemas | `cpm validate --all -w ./workspace` |
| `list` | List resources by type | `cpm list prompts --json` |
| `inspect` | Show a specific resource | `cpm inspect prompt action_plan` |
| `init` | Create a new workspace | `cpm init ./my-workspace` |

All commands support `--json` for machine-readable output and `-w`/`--workspace` for workspace selection.

## Architecture

Self-contained esbuild bundle (~260KB) with zero runtime dependencies. Shares validation logic with the server via `server/src/cli-shared/` (Zod schemas, YAML utilities). A dependency-cruiser rule prevents transitive imports of server runtime modules.

See [CLI Guide](../docs/guides/cli.md) for full documentation.
