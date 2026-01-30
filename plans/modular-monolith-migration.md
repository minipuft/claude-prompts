# Modular Monolith Migration Plan (Final)

## Overview

Reorganize `server/src/` from **28 flat directories** to a **5-layer screaming architecture** with strict dependency injection and enforced boundaries.

## Target Structure

```
src/
├── shared/          # Layer 0: Primitives (types, errors, utils - pure functions only)
├── infra/           # Layer 1: Adapters (http, logging, metrics, notifications, tracking)
├── engine/          # Layer 2: Mechanics (execution pipeline, frameworks, gates executor)
├── modules/         # Layer 3: Domain (prompts, chains, semantic, automation, formatting)
└── mcp/             # Layer 4: Interface (contracts, protocol handlers - the "front door")
```

## Key Architectural Decisions

### 1. Strict Dependency Injection (modules ↛ infra)

**Rule**: Modules CANNOT import directly from infra.

```typescript
// ❌ FORBIDDEN in modules/
import { logger } from '../../infra/logging';
import { sendNotification } from '../../infra/notifications';

// ✅ REQUIRED pattern
// engine/ defines interfaces
interface ILogger { info(msg: string): void; }
interface INotifier { send(msg: string): void; }

// infra/ implements interfaces
class ConsoleLogger implements ILogger { ... }
class McpNotifier implements INotifier { ... }

// modules/ receives via constructor injection
class PromptService {
  constructor(private logger: ILogger, private notifier: INotifier) {}
}
```

**Why**: Forces testability, prevents spaghetti, enables mocking.

### 2. Engine Layer (not "kernel")

The execution mechanics layer is called `engine/` - more intuitive than "kernel".

### 3. Gate Definitions Stay in YAML

- **Gate definitions** (business rules): `server/gates/{id}/gate.yaml` - NOT in src/
- **Gate engine** (TypeScript executor): `src/engine/gates/` - the code that runs rules

## Layer Definitions

| Layer | Purpose | Can Import From | Cannot Import From |
|-------|---------|-----------------|-------------------|
| `shared/` | Pure primitives | Nothing | Everything |
| `infra/` | I/O adapters | `shared/` | `engine/`, `modules/`, `mcp/` |
| `engine/` | Mechanics + interfaces | `shared/`, `infra/` | `modules/`, `mcp/` |
| `modules/` | Business domain | `shared/`, `engine/` (interfaces only) | `infra/`, `mcp/` |
| `mcp/` | Protocol interface | `shared/`, `engine/`, `modules/` | `infra/` (via engine) |

## Dependency Flow

```
         mcp/            ← External interface (MCP protocol)
           │
           ▼
       modules/          ← Business domain (WHAT) - uses interfaces
           │
           ▼
       engine/           ← Mechanics (HOW) - defines interfaces, uses infra
           │
           ▼
       infra/            ← I/O adapters (implements interfaces)
           │
           ▼
       shared/           ← Pure primitives (foundation)
```

## Migration Tooling Strategy

### Evaluated Alternatives

| Tool | Type | Verdict | Rationale |
|------|------|---------|-----------|
| **[ts-morph](https://github.com/dsherret/ts-morph)** | AST manipulation (TS-native) | **Primary** | `file.move()` auto-updates all import paths; full TypeScript type awareness; 6.9M weekly downloads |
| **[Knip](https://knip.dev)** | Dead code detection | **Pre-migration cleanup** | Identifies unused exports/files/deps before we move anything — no point migrating dead code |
| **[ast-grep](https://ast-grep.github.io/)** | Pattern-based search/replace (Rust) | **Supplementary** | Fast structural rewrites for non-TS files (package.json paths, config strings, markdown refs) |
| **[dependency-cruiser](https://github.com/sverweij/dependency-cruiser)** | Architecture enforcement | **Post-migration validation** | Already planned — enforces layer boundaries after moves |
| [jscodeshift](https://github.com/facebook/jscodeshift) | AST codemods (Facebook) | Skipped | More JS-oriented; ts-morph is strictly better for pure TS projects |
| [Moderne](https://www.moderne.ai/blog/automated-javascript-refactoring-at-enterprise-scale) | Enterprise LST platform | Skipped | Multi-repo enterprise scale; overkill for single repo |
| [Grit](https://www.grit.io/) | AI-powered migration | Skipped | Less deterministic; we need reproducible scripts |
| [ts-migrate](https://medium.com/airbnb-engineering/ts-migrate-a-tool-for-migrating-to-typescript-at-scale-cd23bfeb5cc) | JS→TS conversion (Airbnb) | Skipped | Solves JS→TS, not directory restructuring |
| VS Code "Move TS" | IDE extension | Skipped | [Known bugs with project references](https://github.com/microsoft/vscode/issues/215271); not scriptable |

### Chosen Stack

```
Phase 0 ──► Knip (clean dead code)
Phase 1-5 ─► ts-morph (move files + rewrite imports)
Phase 1-5 ─► ast-grep (rewrite non-TS references: configs, docs, scripts)
Phase 6 ──► dependency-cruiser (enforce boundaries)
```

### Why ts-morph (Primary)

ts-morph wraps the TypeScript Compiler API with a convenient, chainable interface. For our migration, the critical capability is:

```typescript
import { Project } from 'ts-morph';

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });

// Move entire directory — ALL imports across codebase updated automatically
project.getSourceFiles('src/utils/**/*.ts').forEach(file => {
  const newPath = file.getFilePath().replace('/src/utils/', '/src/shared/utils/');
  file.move(newPath);
});

await project.save();
```

**What ts-morph handles automatically:**
- Relative import path recalculation (`../../utils/` → `../../shared/utils/`)
- Re-export barrel updates
- Dynamic import paths (string literals)
- Type-only imports

**What ts-morph does NOT handle (use ast-grep / manual):**
- Non-TS files: `package.json` lint patterns, `.dependency-cruiser.cjs` paths, docs, CLAUDE.md
- String-interpolated paths in configs
- Jest `moduleNameMapper` or `pathsToModuleNameMapper` entries

### Why Knip (Pre-Migration)

Before moving ~200 files, first identify what's dead:

```bash
npx knip --reporter compact
```

Knip builds a dependency graph from entry points and flags:
- Unused exports (functions, types, classes never imported)
- Unused files (never reached from entry points)
- Unused dependencies in `package.json`

**Run before Phase 1** to avoid migrating dead code into the new structure.

### Why ast-grep (Supplementary)

[ast-grep](https://ast-grep.github.io/catalog/typescript/) is a Rust-based structural search/replace tool. We use it for bulk rewrites that ts-morph doesn't cover:

```bash
# Example: Update all import paths in markdown code blocks
ast-grep --pattern 'from "$PATH/utils/$REST"' --rewrite 'from "$PATH/shared/utils/$REST"' --lang ts

# Example: Find all string references to old paths in any file type
ast-grep --pattern '"src/utils/$REST"' --rewrite '"src/shared/utils/$REST"'
```

### Migration Script Architecture

```
server/scripts/migration/
├── 00-knip-audit.ts          # Pre-migration dead code report
├── 01-move-shared.ts         # Phase 1: types/, utils/, core/ → shared/
├── 02-move-infra.ts          # Phase 2: logging/, config/, etc. → infra/
├── 03-move-engine.ts         # Phase 3: execution/, frameworks/, gates/ → engine/
├── 04-move-modules.ts        # Phase 4: prompts/, chains/, etc. → modules/
├── 05-move-mcp.ts            # Phase 5: mcp-contracts/, mcp-tools/ → mcp/
├── 06-update-configs.ts      # Phase 6: package.json, tsconfig, docs
└── shared/
    ├── project-loader.ts     # Shared ts-morph Project instance
    └── config-updater.ts     # ast-grep wrappers for non-TS files
```

Each script is idempotent — safe to rerun if interrupted.

## Migration Phases

### Phase 0: Preparation (Day 1) --- COMPLETE
- [x] Install migration tooling: `npm install -D ts-morph knip` (ast-grep deferred to Phase 1)
- [x] Run Knip audit: found 30 unused files, 97 unused exports, removed unused deps (cors, ts-prune, ws)
- [x] Replaced `lint:unused:internal` + `lint:unused:full` (ts-prune) with `lint:unused` (knip)
- [x] Create `server/scripts/migration/` scaffold with shared project loader + phase stubs (01-06)
- [x] Create empty target directory structure (shared/, infra/, engine/, modules/, mcp/ with subdirs)
- [x] Add tsconfig path aliases (`@shared/*`, `@infra/*`, `@engine/*`, `@modules/*`, `@mcp/*`)
- [x] Update esbuild config with `alias` for path resolution
- [x] Update jest.config.cjs with `moduleNameMapper` for path aliases
- [ ] Create migration tracking branch (deferred — committing on current branch first)

**Validation**: typecheck, lint:ratchet, test:ci (936/936), build, start:test — all pass

### Phase 1: Shared Layer (Days 2-3)
Pure primitives with zero dependencies.

| Source | Target | Files |
|--------|--------|-------|
| `types/` | `shared/types/` | 2 |
| `utils/` | `shared/utils/` | 14 |
| `core/` | `shared/errors/` | 4 |

### Phase 2: Infrastructure Layer (Days 4-6)
I/O adapters that implement interfaces.

| Source | Target | Files |
|--------|--------|-------|
| `logging/` | `infra/logging/` | 1 |
| `config/` | `infra/config/` | 1 |
| `cache/` | `infra/cache/` | 2 |
| `server/` | `infra/http/` | 2 |
| `api/` | `infra/http/api/` | 1 |
| `metrics/` | `infra/observability/metrics/` | 3 |
| `tracking/` | `infra/observability/tracking/` | 2 |
| `notifications/` | `infra/observability/notifications/` | 2 |
| `performance/` | `infra/observability/performance/` | 2 |
| `hooks/` | `infra/hooks/` | 2 |

### Phase 3: Engine Layer + Interfaces (Days 7-14)
The engine that runs business logic + interface definitions for DI.

| Source | Target | Files |
|--------|--------|-------|
| `frameworks/` | `engine/frameworks/` | 26 |
| `gates/` | `engine/gates/` | 42 |
| `execution/` | `engine/execution/` | 76 |

**Additional work in Phase 3:**
- [ ] Create `engine/interfaces/` with ILogger, IConfig, ICache, IMetrics, INotifier
- [ ] Update infra/ to implement these interfaces
- [ ] Export interfaces from `engine/index.ts`

```
engine/
├── interfaces/      # DI interfaces (ILogger, IConfig, ICache, etc.)
│   ├── logging.ts
│   ├── config.ts
│   ├── cache.ts
│   ├── metrics.ts
│   └── index.ts
├── execution/       # Pipeline mechanics
├── frameworks/      # Methodology engine
├── gates/           # Gate executor (runs YAML definitions)
└── index.ts         # Public API + interface exports
```

### Phase 4: Modules Layer (Days 15-18)
Business domain - receives infra via DI.

| Source | Target | Files | Notes |
|--------|--------|-------|-------|
| `prompts/` | `modules/prompts/` | 13 | |
| `chain-session/` | `modules/chains/` | 3 | |
| `text-references/` | `modules/text-refs/` | 4 | |
| `semantic/` | `modules/semantic/` | 5 | Domain logic |
| `styles/` | `modules/formatting/` | 7 | Renamed |
| `resources/` | `modules/resources/` | 6 | |
| `versioning/` | `modules/versioning/` | 3 | |
| `scripts/` | `modules/automation/` | 14 | **Renamed from scripts/** |

**DI setup for modules:**
```typescript
// modules/prompts/prompt-service.ts
export class PromptService {
  constructor(
    private readonly logger: ILogger,      // Injected
    private readonly config: IConfigReader // Injected
  ) {}
}
```

### Phase 5: MCP Layer (Days 19-20)
External protocol interface.

| Source | Target | Files |
|--------|--------|-------|
| `mcp-contracts/` | `mcp/contracts/` | 7 |
| `action-metadata/` | `mcp/metadata/` | 6 |
| `mcp-tools/` | `mcp/tools/` | 51 |

### Phase 6: Finalization (Days 21-22)
- [ ] Update `runtime/` to wire DI container
- [ ] Remove all backward-compat re-exports
- [ ] Update all documentation
- [ ] Final validation

## Dependency-Cruiser Rules

```javascript
// .dependency-cruiser.cjs
{
  forbidden: [
    // ========================================
    // LAYER BOUNDARIES (Strict)
    // ========================================
    {
      name: 'shared-is-foundation',
      comment: 'Shared cannot import from any other layer',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: { path: '^src/(infra|engine|modules|mcp)/' }
    },
    {
      name: 'infra-only-shared',
      comment: 'Infra can only import from shared',
      severity: 'error',
      from: { path: '^src/infra/' },
      to: { path: '^src/(engine|modules|mcp)/' }
    },
    {
      name: 'engine-no-modules-or-mcp',
      comment: 'Engine cannot import from modules or MCP',
      severity: 'error',
      from: { path: '^src/engine/' },
      to: { path: '^src/(modules|mcp)/' }
    },

    // ========================================
    // STRICT DI: modules cannot import infra
    // ========================================
    {
      name: 'modules-no-infra',
      comment: 'CRITICAL: Modules must use DI, not direct infra imports',
      severity: 'error',
      from: { path: '^src/modules/' },
      to: { path: '^src/infra/' }
    },
    {
      name: 'modules-no-mcp',
      comment: 'Modules cannot import from MCP layer',
      severity: 'error',
      from: { path: '^src/modules/' },
      to: { path: '^src/mcp/' }
    },

    // ========================================
    // MCP LAYER RULES
    // ========================================
    {
      name: 'mcp-no-infra-direct',
      comment: 'MCP uses engine interfaces, not direct infra',
      severity: 'error',
      from: { path: '^src/mcp/' },
      to: { path: '^src/infra/' }
    },

    // ========================================
    // ENGINE INTERNAL ISOLATION
    // ========================================
    {
      name: 'gates-frameworks-decoupled',
      severity: 'error',
      from: { path: '^src/engine/gates/' },
      to: { path: '^src/engine/frameworks/' }
    },
    {
      name: 'frameworks-gates-decoupled',
      severity: 'error',
      from: { path: '^src/engine/frameworks/' },
      to: { path: '^src/engine/gates/' }
    },

    // ========================================
    // MODULE ISOLATION (barrel imports only)
    // ========================================
    {
      name: 'no-cross-module-internals',
      severity: 'warn',
      from: { path: '^src/modules/([^/]+)/' },
      to: {
        path: '^src/modules/(?!$1)[^/]+/',
        pathNot: 'index\\.ts$'
      }
    },

    // ========================================
    // ENGINE FACADE RULE
    // ========================================
    {
      name: 'mcp-uses-engine-facade',
      comment: 'MCP tools use engine public API, not internals',
      severity: 'warn',
      from: { path: '^src/mcp/' },
      to: {
        path: '^src/engine/execution/pipeline/stages/',
        pathNot: 'index\\.ts$'
      }
    }
  ]
}
```

## DI Container Setup

In `runtime/` (Phase 6), wire the DI container:

```typescript
// runtime/di-container.ts
import { ILogger, IConfig, ICache, IMetrics } from '@engine/interfaces';
import { ConsoleLogger } from '@infra/logging';
import { ConfigManager } from '@infra/config';
import { CacheManager } from '@infra/cache';
import { MetricsCollector } from '@infra/observability/metrics';

export function createContainer() {
  const logger: ILogger = new ConsoleLogger();
  const config: IConfig = new ConfigManager();
  const cache: ICache = new CacheManager();
  const metrics: IMetrics = new MetricsCollector();

  return { logger, config, cache, metrics };
}

// Usage in runtime/startup.ts
const container = createContainer();
const promptService = new PromptService(container.logger, container.config);
```

## Validation Checklist

Run after each phase:

```bash
npm run typecheck        # Type checking
npm run lint:ratchet     # Lint (no regressions)
npm run test:ci          # Unit tests
npm run build            # Build succeeds
npm run validate:arch    # Architecture rules (CRITICAL)
npm run start:test       # Startup test
```

## Critical Files

| File | Role | Migration Notes |
|------|------|-----------------|
| `src/types/index.ts` | Type hub | Move first to shared/ |
| `src/execution/` | Engine (76 files) | Move to engine/execution/ |
| `src/scripts/` | Runtime automation | Rename to modules/automation/ |
| `src/semantic/` | Domain logic | Move to modules/semantic/ |
| `.dependency-cruiser.cjs` | Architecture rules | Add `modules-no-infra` rule |

## Estimated Effort

| Phase | Duration | Risk |
|-------|----------|------|
| Phase 0: Preparation | 1 day | Low |
| Phase 1: Shared | 2 days | Low |
| Phase 2: Infrastructure | 3 days | Medium |
| Phase 3: Engine + Interfaces | 8 days | **High** (DI setup) |
| Phase 4: Modules (with DI) | 4 days | Medium |
| Phase 5: MCP | 2 days | Medium |
| Phase 6: Finalization | 2 days | Medium |
| **Total** | **22 days** | |

## Success Criteria

- [ ] 5-layer architecture enforced by dependency-cruiser
- [ ] `modules-no-infra` rule passes (strict DI)
- [ ] All infra access goes through `engine/interfaces/`
- [ ] `modules/` answers "what does this app do?" (prompts, chains, semantic, automation)
- [ ] `engine/` answers "how does it run?" (execution, gates, frameworks)
- [ ] `infra/` implements interfaces from `engine/interfaces/`
- [ ] Gate definitions remain in YAML (`server/gates/`)
- [ ] All tests pass, build works, hot-reload functional
