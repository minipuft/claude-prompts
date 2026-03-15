# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Response Format Overlays**: Methodologies and styles can define `responseFormat` in YAML to guide LLM response structure at the tool description level
  - Methodology `responseFormat` woven into tool descriptions at synchronization time (global)
  - Style `responseFormat` available for per-execution system prompt injection

### Changed

- **Tier 5 File Size Decomposition**: Three oversized files decomposed to meet 500-line service advisory
  - `loader.ts` (896→544): Extracted markdown parsing to `markdown-prompt-parser.ts`; consolidated ~30 verbose info-level logs
  - `tool-description-loader.ts` (741→489): Extracted methodology/style overlay resolution to `tool-description-overlays.ts`
  - `file-operations.ts` (517→345): Removed 3 dead diagnostic methods with zero consumers
- **MCP Tool Schemas**: Hand-written Zod schema factories replace codegen `mcp-schemas.ts`, enabling methodology-aware description overlays without generated code
- **Operator Patterns**: Loaded from JSON registry at import time via esbuild inlining, eliminating the `generate-operators` codegen step and Python hook codegen
- **Style Guidance**: Served exclusively from YAML definitions via StyleManager, removing hardcoded legacy fallback

## [2.0.0](https://github.com/minipuft/claude-prompts/compare/v1.7.0...v2.0.0) (2026-03-11)


### ⚠ BREAKING CHANGES

* **server:** License changed from MIT to AGPL-3.0-only. Network use of modified versions now requires source disclosure under Section 13 of the GNU Affero General Public License v3.
* **server:** All runtime-state paths require explicit PathResolver configuration. Users running via npx must provide --workspace or set MCP_WORKSPACE. Storage backend migrated from JSON files to SQLite — downstream readers of state files must use SQLite.
* **paths:** All path-dependent modules now require explicit path configuration. Callers must provide paths via PathResolver or CLI flags.

### Added

* **ci:** add commitlint, changelog-sections, and downstream sync workflow ([802575d](https://github.com/minipuft/claude-prompts/commit/802575df5bb95a1f6cecf1dcd9a9d3f3cfc8fd8e))
* **eslint:** add claude-plugin custom ESLint rule ([876b431](https://github.com/minipuft/claude-prompts/commit/876b431f428b8a8df644ae4d89c31d483c45e9d2))
* **gates:** add response blocking and gate event emission in pipeline ([914a074](https://github.com/minipuft/claude-prompts/commit/914a0740db3d793d259d502ae9a354077b85c3d3))
* **hooks:** add server-side hook registry and MCP notification system ([86ba115](https://github.com/minipuft/claude-prompts/commit/86ba11564d6363e9353b34cfcef0a7e662d50b96))
* **parsers:** add framework-aware quote parsing for @ operator ([9555122](https://github.com/minipuft/claude-prompts/commit/95551220836997760e735ab6b7121548f05dc504))
* **scripts:** add skills-sync CLI for cross-client skill distribution ([351291c](https://github.com/minipuft/claude-prompts/commit/351291c5827e17cd36b34588d6ee2646b561eebc))
* **server:** add identity resolution, delegation operator, and methodology assertions ([#76](https://github.com/minipuft/claude-prompts/issues/76)) ([913c2d9](https://github.com/minipuft/claude-prompts/commit/913c2d9d3dc8d65a64e47c29f310feeca0f0c937))


### Fixed

* **ci:** align extension-publish tags with Release Please config ([19a0024](https://github.com/minipuft/claude-prompts/commit/19a002439ade437c7856c03164b52c4196d821a1))
* **hooks:** allow generated file deletions for feature removal ([a8fcb24](https://github.com/minipuft/claude-prompts/commit/a8fcb24f310096fe617ac50fb1840acdeb5778f8))
* **hooks:** update Python hooks for new gate server format ([1b0ddf5](https://github.com/minipuft/claude-prompts/commit/1b0ddf50367e8de7fb447b2e95b6d80ecec2d207))
* **parsers:** simplify argument assignment for unstructured text ([061cd0f](https://github.com/minipuft/claude-prompts/commit/061cd0f1e8483e258ffff13e5576b61eddac15d2))
* **pipeline:** use provider function for prompt cache synchronization ([f092837](https://github.com/minipuft/claude-prompts/commit/f09283778ff2474b1a30d8a40c6a8f0827069c97))
* **runtime:** bridge PathResolver to jsonUtils via PROMPTS_PATH env var ([3d4505b](https://github.com/minipuft/claude-prompts/commit/3d4505b3c982f2952fc56f574ba5228b801d290e))
* **tests:** set PROMPTS_PATH in test setup for template rendering ([34769d7](https://github.com/minipuft/claude-prompts/commit/34769d762fc9ffdb2f7c00064dc4a04bdd2a0a9e))


### Changed

* **gates:** consolidate gate verdict validation to single source of truth ([0ae1ae9](https://github.com/minipuft/claude-prompts/commit/0ae1ae9ed20070515129ce239f7b0aec5f31daff))
* **gates:** extract gate-activation utility and cleanup dead code ([85bd265](https://github.com/minipuft/claude-prompts/commit/85bd265ae91599718b257055ac45955249bf3f0a))
* **mcp-tools:** consolidate prompt_manager into resource_manager ([6a41a52](https://github.com/minipuft/claude-prompts/commit/6a41a5293524b0097132d22ccd6107e43cd863f6))
* **parsers:** simplify argument matching and remove dead code ([3befb9f](https://github.com/minipuft/claude-prompts/commit/3befb9f086567d880b4152a49437b551b7b51a5b))
* **paths:** enforce explicit path resolution, remove process.cwd() fallbacks ([b93ca78](https://github.com/minipuft/claude-prompts/commit/b93ca789abf5e2bcf318fce73dd27cd634563efa))
* **prompt-guidance:** remove unused resource selection code ([a2da026](https://github.com/minipuft/claude-prompts/commit/a2da0267d90a206a0864a62d741ccbab1819f8ca))
* **remotion:** replace demo compositions with Liquescent design system ([b06706b](https://github.com/minipuft/claude-prompts/commit/b06706b135ff51aada2191b283e905e66eff4b40))
* **runtime:** migrate CLI argument parsing to node:util parseArgs ([71dbe00](https://github.com/minipuft/claude-prompts/commit/71dbe00e27199850ad093cf077638ca3d4038eee))
* **server:** complete modular monolith migration to 5-layer architecture ([31d3884](https://github.com/minipuft/claude-prompts/commit/31d3884726f29611a5e4ca1e3bd9673729b53d90))
* **server:** relocate tooling/ submodules and consolidate pipeline imports ([5204a7a](https://github.com/minipuft/claude-prompts/commit/5204a7a01e66cefffb2a607c0432e0a880df1cb3))
* **types:** consolidate context types and add gate response contract ([aa51202](https://github.com/minipuft/claude-prompts/commit/aa512028795538127fb86eb3ef3d210b85ad6e9e))


### Documentation

* add LIQUESCENT methodology and update changelog ([26a639b](https://github.com/minipuft/claude-prompts/commit/26a639b59c89f7f0f223dc65fb5a8201a7740d06))
* **changelog:** document breaking path resolution changes ([5918e16](https://github.com/minipuft/claude-prompts/commit/5918e1653f9cf4810998466567ce72f40b0808ee))
* **ci:** update downstream sync comment to reflect Dependabot approach ([82e15cd](https://github.com/minipuft/claude-prompts/commit/82e15cd32251579da6ab6ab862b244b493de5c78))
* consolidate documentation and remove completed plans ([1e52295](https://github.com/minipuft/claude-prompts/commit/1e52295ce182e20753d7444293086eab81652206))
* update path configuration and release process documentation ([abf3457](https://github.com/minipuft/claude-prompts/commit/abf345766f8fd611c5b0ad1e502866f6d81cc88b))


### Maintenance

* **ci:** downgrade to minor bump — path resolution change is internal only ([c550b74](https://github.com/minipuft/claude-prompts/commit/c550b74d4a220ba44ecb09654c0542e380bd56bd))
* **ci:** release as 2.0.0 — AGPL license change is breaking ([7e5d024](https://github.com/minipuft/claude-prompts/commit/7e5d024645831005c55f86281364efa90312ef82))
* **server:** migrate license from MIT to AGPL-3.0-only ([36961fa](https://github.com/minipuft/claude-prompts/commit/36961fad8bac2cb4b4f9b232ece905be91fe16f8))

## [1.7.0](https://github.com/minipuft/claude-prompts/compare/v1.6.0...v1.7.0) (2026-01-23)

### Features

- **ci:** migrate to OIDC trusted publishing for npm ([e71d272](https://github.com/minipuft/claude-prompts/commit/e71d272f833d1e983f717eb11d31b6a492c24a59))
- **config:** add registerWithMcp toggle for MCP resources ([471ed14](https://github.com/minipuft/claude-prompts/commit/471ed14e8a2a4bd63dd44aabbec8f97a5869e513))
- **config:** expand resources config with granular per-type controls ([ddcdba2](https://github.com/minipuft/claude-prompts/commit/ddcdba2f62a700bfaf013f17ee16f21927cba110))
- **docs:** add Remotion animation system for documentation videos ([0a40c4d](https://github.com/minipuft/claude-prompts/commit/0a40c4de20807ae4600294bee983ce852992311f))
- extension dep sync, repetition operator, hook fuzzy matching ([efbdc30](https://github.com/minipuft/claude-prompts/commit/efbdc3018b44b50bb7383d30f23b3239cc0b7905))
- **hooks:** add chain step visibility with IDs for workflow preview ([ff25d5e](https://github.com/minipuft/claude-prompts/commit/ff25d5ec0f26c1556f55353fb41e97e897ff6792))
- **hooks:** improve prompt_engine directive clarity and token efficiency ([b62f8d3](https://github.com/minipuft/claude-prompts/commit/b62f8d3dd3e7aa4794e9b29bccb0ccc081bd49b1))
- **hooks:** validate operator values against registered server resources ([30cba3a](https://github.com/minipuft/claude-prompts/commit/30cba3ac12c88e74b0b7e70bbcd8bfe079a9505b))
- **resources:** add MCP logs resources for runtime observability ([5f0025f](https://github.com/minipuft/claude-prompts/commit/5f0025fcece76e3ed593246d30da54554e7be58f))
- **resources:** implement MCP Resources protocol for token-efficient access ([80d56d2](https://github.com/minipuft/claude-prompts/commit/80d56d22a4b25b93270e9d8718c3b0ad95641f68))

### Bug Fixes

- **parsers:** preserve arguments after \* N repetition operator ([649bae3](https://github.com/minipuft/claude-prompts/commit/649bae3d3dcaf7c6ec53fda1da18a90aaed6d705))

## [1.6.0](https://github.com/minipuft/claude-prompts/compare/v1.5.0...v1.6.0) (2026-01-22)

### Features

- **ci:** modernize Release Please and npm-publish workflows ([7bb1303](https://github.com/minipuft/claude-prompts/commit/7bb1303a53f998ca10bab6f621eecf548864881a))

### Bug Fixes

- **ci:** handle Release Please PR output as JSON ([8559c74](https://github.com/minipuft/claude-prompts/commit/8559c74e2c819961c644b769bc34f5a06e4f0c82))
- **tests:** update E2E plugin validation for current structure ([053b0be](https://github.com/minipuft/claude-prompts/commit/053b0be8bdd3f3443c5e68b9415e9e0e716d8739))

## [1.5.0] - 2026-01-21

### Added

- **Hook-level fuzzy matching**: Unknown prompt interception before tool call for token efficiency
  - `>>unknwon_prompt` → Hook returns suggestions immediately (no server round-trip)
  - Same multi-factor scoring algorithm as server-side (prefix: +100, word overlap: +30/word, Levenshtein: +50-distance\*10)
  - Saves ~50-100 tokens per failed prompt attempt
- **Resource change tracking**: Audit log for prompts and gates with source attribution
  - Tracks filesystem hot-reloads, MCP tool operations, and external changes
  - Content hashing detects actual modifications (skips no-op saves)
  - Baseline comparison at startup surfaces changes made while server was down
- **`system_control(action:"changes")`**: Query the audit log with filters (`source`, `resourceType`, `since`, `limit`)

### Changed

- **Error messages**: Condensed parsing errors for token efficiency
  - Before: Multi-line verbose messages with format examples and hints
  - After: Single-line messages with fuzzy suggestions only when relevant
- **File watching**: Migrate from `fs.watch` to Chokidar with automatic polling for WSL2/network filesystems
  - Auto-detects WSL2 environments and enables polling mode
  - Configurable via `usePolling` ('auto' | true | false) and `pollingInterval` (default: 300ms)
  - Fixes hot-reload not working in WSL2 due to virtualized filesystem limitations

### Fixed

- **Resource ID extraction**: Baseline comparison now correctly extracts prompt/gate IDs from directory names (was incorrectly extracting "prompt" from nested file paths)
- **Command parsing**: Comprehensive improvements to command parsing robustness:
  - **Bare prompt names**: Accept `strategicImplement` without requiring `>>` prefix
  - **Double-encoded JSON**: Handle nested JSON strings from MCP clients that double-escape payloads
  - **JSON-wrapped chains**: JSON strategy now properly delegates to symbolic parser for chain commands (e.g., `{"command": ">>analyze --> summarize"}`)
  - **Argument syntax**: Gate operators (`::` and `=`) no longer conflict with argument assignment (`input="value"`)
- **Fuzzy prompt suggestions**: Multi-factor scoring replaces simple Levenshtein-only matching:
  - **Prefix matching** (score +100): `ana` → suggests `analyze_code`, `analyze_data`
  - **Word overlap** (score +30/word): `code` → suggests `code_review`, `analyze_code`
  - **Typo correction**: Dynamic threshold based on query length (longer queries allow more edits)
  - **Limited to 3 suggestions**: Reduces noise while maintaining relevance
  - **No arbitrary examples**: Completely unrelated queries show no suggestions instead of random prompts

## [1.4.5] - 2026-01-20

### Added

- **Chain workflow preview**: Hooks show all chain steps before execution begins (e.g., "1/4 Initial Scan → 2/4 Deep Dive → ...")
- **scaffold_project chain**: Interactive project scaffolding for TypeScript, Python, or hybrid projects with modern tooling
- **Nested chain discovery**: Chain steps can reference prompts in subdirectories (e.g., `scaffold_analyze` under `scaffold_project/`)
- **System-only prompts**: Prompts with only system message (no user template required)
- Operator patterns generated from single source (TypeScript + Python via generate-operators.ts)

### Changed

- Symbolic parser with unified pattern matching across all operators
- Hook configuration now loaded from `config.json` via config_loader.py
- Move detect-skills.py to global ~/.claude/hooks (not plugin-bundled)

## [1.4.4] - 2026-01-19

### Added

- Include hooks directory in npm package distribution

## [1.4.2] - 2026-01-18

### Changed

- Migrate Gemini-specific hooks to gemini-prompts repository

## [1.4.1] - 2026-01-17

### Fixed

- Remove submodule path checks from distribution validation

## [1.4.0] - 2026-01-16

### Added

- Global version integrity check across ecosystem (npm, marketplace, extensions)

### Changed

- Migrate documentation guides to Diátaxis framework

## [1.3.2](https://github.com/minipuft/claude-prompts/compare/v1.3.1...v1.3.2) (2026-01-14)

### Bug Fixes

- **release:** version sync ([#54](https://github.com/minipuft/claude-prompts/issues/54)) ([33f9e85](https://github.com/minipuft/claude-prompts/commit/33f9e85349e38445905d6471742c54910dc9178e))

## [1.3.1](https://github.com/minipuft/claude-prompts/compare/v1.3.0...v1.3.1) (2026-01-14)

### Bug Fixes

- **release:** version sync ([#51](https://github.com/minipuft/claude-prompts/issues/51)) ([6bd6039](https://github.com/minipuft/claude-prompts/commit/6bd6039765edae189fe83ca13f60a8a27a178d73))

## [1.3.0](https://github.com/minipuft/claude-prompts/compare/v1.2.0...v1.3.0) (2026-01-14)

### ⚠ BREAKING CHANGES

- Complete MCP server restructure with new consolidated API

### Features

- add Claude Code plugin for /install-plugin support ([c3b5654](https://github.com/minipuft/claude-prompts/commit/c3b5654aaeea5fec12402a859eb687d1e666caa4))
- add dev:claude script for --plugin-dir workflow ([2a7d6f8](https://github.com/minipuft/claude-prompts/commit/2a7d6f8abeedfb6c6ed6f36becae644ebad6f7d7))
- add marketplace.json for plugin distribution ([bf79fcb](https://github.com/minipuft/claude-prompts/commit/bf79fcb56a38d2829f88e5365a5042494d2eba23))
- add streamable http transport and release automation ([0717f31](https://github.com/minipuft/claude-prompts/commit/0717f31ae503c19824fdd14fb05394197b8b11a9))
- Add symbolic command language and operator executors ([639f86a](https://github.com/minipuft/claude-prompts/commit/639f86a4aeeae925c0b916cffc297d4253c8ed6f))
- **dist:** separate public and private prompts for distribution ([fee7c12](https://github.com/minipuft/claude-prompts/commit/fee7c12e21c5b525501764f74fbff80ace08805a))
- enhance README with interactive prompt management features ([13afaa9](https://github.com/minipuft/claude-prompts/commit/13afaa968bc2330f80a183a71f7eb367dc40c3f6))
- enhance server startup options and help documentation ([f315f33](https://github.com/minipuft/claude-prompts/commit/f315f331cbf1112a5d5163018cfbd0bfc23cd413))
- **gates:** implement intelligent gate selection with 5-level precedence system ([b8e1c11](https://github.com/minipuft/claude-prompts/commit/b8e1c11a3bf8a411f65448812112e7c2555a9c8e))
- **gemini:** add Gemini CLI extension support ([50587c6](https://github.com/minipuft/claude-prompts/commit/50587c61fa922eee5400614bde24ec3bf9103cbe))
- **gemini:** align hooks with Claude plugin infrastructure ([c35e4f0](https://github.com/minipuft/claude-prompts/commit/c35e4f0d678d1bd3c36725f9ede1b7a191bab785))
- **hooks:** auto-regenerate contracts on source change ([9b21afa](https://github.com/minipuft/claude-prompts/commit/9b21afa192cddf42bd43d46a02a9557ee00c4d2b))
- implement enterprise-grade CI/CD pipeline with comprehensive testing framework ([#10](https://github.com/minipuft/claude-prompts/issues/10)) ([25e7f59](https://github.com/minipuft/claude-prompts/commit/25e7f59d41801bc4cc4cb6d01158c262d2064b9a))
- implement Phase 1 - Enhanced Category Parsing System ([1506755](https://github.com/minipuft/claude-prompts/commit/150675589e650d5a06d018e7884658a31965dcf2))
- multi-platform extension support with enhanced hooks and gate system ([27b94ec](https://github.com/minipuft/claude-prompts/commit/27b94ecb3946a3a5a227fe5c0dbbbe8792b7cc71))
- **parser:** enhance case-insensitive prompt matching and add strategic implementation ([628b09c](https://github.com/minipuft/claude-prompts/commit/628b09c3e7b6017317eaa966de9b6fd756f77e15))
- **plugin:** add server/resources directory for plugin deployment ([2d21a86](https://github.com/minipuft/claude-prompts/commit/2d21a864a278a3c7a3abbcb4e53843ae65b39ea5))
- **plugin:** add SessionStart hook for dependency installation ([3896fb9](https://github.com/minipuft/claude-prompts/commit/3896fb9b967fe8761ef8f1ee0f4d2d84bf1ec139))
- **plugin:** persist user data outside cache directory ([e59c64b](https://github.com/minipuft/claude-prompts/commit/e59c64b5fc37e989783db8070cceaab320e7be4f))
- **plugin:** unify plugin with YAML resources, version history, and script tools ([0963d4a](https://github.com/minipuft/claude-prompts/commit/0963d4ac56da09dc35d08fc3070c4b846b191fb1))
- **ralph:** context isolation for long-running verification loops ([f1c1014](https://github.com/minipuft/claude-prompts/commit/f1c1014f75dc719d919013dd3dbd9219d2900fe6))
- re-introduce hot-reloading for prompots ([720f96b](https://github.com/minipuft/claude-prompts/commit/720f96b9810a2e3675eb305b3e69683a64bb3982))
- release 1.2.0 with CI validation and gate refactoring ([75ec3e8](https://github.com/minipuft/claude-prompts/commit/75ec3e83e06e6c7753045778d770fc80773e77e0))
- shell verification presets and checkpoint resource type ([ca24027](https://github.com/minipuft/claude-prompts/commit/ca240274e3df495f87879b28e5492c4289cfb489))
- **styles:** add style operator (#) for response formatting ([d2c3173](https://github.com/minipuft/claude-prompts/commit/d2c3173ad4d7edb758207460d56167dd7bc4336b))
- update documentation for version 1.1.0 - "Intelligent Execution" ([7e1fb3f](https://github.com/minipuft/claude-prompts/commit/7e1fb3f02a226b232464a5ae98132d25344813dd))

### Bug Fixes

- add missing nunjucks dependency for template processing ([4f78114](https://github.com/minipuft/claude-prompts/commit/4f781144de43b72d0b29603337ba44d4ba61bb2a))
- add required metadata for plugin menu navigation ([72cd845](https://github.com/minipuft/claude-prompts/commit/72cd845e96cd04c37ec32eb1584f17f8c57e03b2))
- **ci:** consolidate workflows and fix Docker paths ([42efb12](https://github.com/minipuft/claude-prompts/commit/42efb126455c16ac46ba349091977351eb337f82))
- **ci:** skip action inventory verification for bundled builds ([dd299e5](https://github.com/minipuft/claude-prompts/commit/dd299e5f65fe3ffe2184debf659b7a764b176fb0))
- **ci:** update extension-publish workflow for bundled distribution ([8d977e9](https://github.com/minipuft/claude-prompts/commit/8d977e9c4daa8b8b7a6796bd66e6164ece662f86))
- clear lint regressions ([77db53a](https://github.com/minipuft/claude-prompts/commit/77db53a850a93f5fd1b41fe53dc21cd2a258454f))
- **contracts:** add prettier formatting to contract generator ([6096c67](https://github.com/minipuft/claude-prompts/commit/6096c67aa1151f402670081c8871237a2c9888ef))
- **contracts:** format all generated TypeScript files ([0e4c9af](https://github.com/minipuft/claude-prompts/commit/0e4c9aff57867ac46e905fc1e3be4e58b271a946))
- correct marketplace.json schema (source not path) ([6d08e63](https://github.com/minipuft/claude-prompts/commit/6d08e63f06bb6cb6c20a438d23823174e4c24bfb))
- correct source path (relative to marketplace.json) ([e281b48](https://github.com/minipuft/claude-prompts/commit/e281b48728fe3c390058fdaf1126c4811e04ea7c))
- **deps:** add missing 'diff' dependency for text-diff-service ([12b70db](https://github.com/minipuft/claude-prompts/commit/12b70dbfb0f5a53be24c084cd6505133f4458fd5))
- **docker:** update Dockerfile for renamed docs and styles directory ([35144c8](https://github.com/minipuft/claude-prompts/commit/35144c8905c00c5d2a2901a20796ecab4904d1aa))
- **docs:** remove invalid color property from mermaid linkStyle ([d086ca1](https://github.com/minipuft/claude-prompts/commit/d086ca1ee22818c93d427b93d830463c9bb49d37))
- **gemini:** align extension with Claude plugin v1.1.1 ([fb3413c](https://github.com/minipuft/claude-prompts/commit/fb3413c399956ab510f140db8c8802d8938714cb))
- **gemini:** resolve symlinks before path calculation ([77da3bc](https://github.com/minipuft/claude-prompts/commit/77da3bc655a8fdee67b301ec47f993763ce42bcb))
- **hooks:** add quick-check mode to prevent SessionStart blocking ([c4b3f94](https://github.com/minipuft/claude-prompts/commit/c4b3f94d5d1be5b579a25f825f6633e7937cf129))
- **hooks:** make dev-sync portable across environments ([4aa1190](https://github.com/minipuft/claude-prompts/commit/4aa119040f21669c2f5e52e7810ed32198f547dc))
- **npm:** Include methodologies folder in published package ([9bad683](https://github.com/minipuft/claude-prompts/commit/9bad68308e017bc0c362e28f7829d3220bcd7116))
- **plugin:** correct .mcp.json schema and improve dev workflow ([9927529](https://github.com/minipuft/claude-prompts/commit/99275299847de16f1bd42d13525e8cd4c662e624))
- **plugin:** include server/dist for plugin installation ([5f1edd3](https://github.com/minipuft/claude-prompts/commit/5f1edd3ed144e27a3380ea2d8e52890b78a836c5))
- **plugin:** remove duplicate hooks reference causing load failure ([c6c3ca6](https://github.com/minipuft/claude-prompts/commit/c6c3ca648110e216b630829abab947d88cd036ac))
- prune useless prompts ([daec104](https://github.com/minipuft/claude-prompts/commit/daec104cecf6719a080af777899849e2d8493156))
- regenerate contract artifacts and update lint baseline ([0a0e67d](https://github.com/minipuft/claude-prompts/commit/0a0e67d9d62c74e552bb69bcad00299e5e1b23b3))
- **release:** correct release-please config paths ([20662ec](https://github.com/minipuft/claude-prompts/commit/20662ecb89f5ff84c8baea6321774141b049eca7))
- Remove accidentally committed node_modules, update .gitignore ([ed452ac](https://github.com/minipuft/claude-prompts/commit/ed452acd60df2c76d94c43eceb09a66a42edf386))
- return simple text responses for MCP tool visibility in Claude Code ([7980567](https://github.com/minipuft/claude-prompts/commit/7980567d540c04390eb90c44d7c3ed1345394291))
- source must start with ./ ([b2482f1](https://github.com/minipuft/claude-prompts/commit/b2482f1dc79ec65b3e60d7d0192624e18a8a71ee))
- source path relative to repo root ([f2e3020](https://github.com/minipuft/claude-prompts/commit/f2e302058137a49bd2bc195cccc87b71973a38b9))

### Miscellaneous Chores

- prepare 1.3.0 release ([225ebe6](https://github.com/minipuft/claude-prompts/commit/225ebe6da4bb8f5c13ab6d750690249e0ed9502b))

## [1.2.0] - 2025-01-12

### Added

- CI validation and gate refactoring improvements
- Release automation in CONTRIBUTING.md

## [1.1.0] - 2025-01-10

### Added

- Initial public release with MCP server, prompts, gates, and frameworks

[Unreleased]: https://github.com/minipuft/claude-prompts/compare/v1.7.0...HEAD
[1.5.0]: https://github.com/minipuft/claude-prompts/compare/v1.4.5...v1.5.0
[1.4.5]: https://github.com/minipuft/claude-prompts/compare/v1.4.4...v1.4.5
[1.4.4]: https://github.com/minipuft/claude-prompts/compare/v1.4.2...v1.4.4
[1.4.2]: https://github.com/minipuft/claude-prompts/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/minipuft/claude-prompts/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/minipuft/claude-prompts/compare/v1.3.2...v1.4.0
[1.3.2]: https://github.com/minipuft/claude-prompts/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/minipuft/claude-prompts/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/minipuft/claude-prompts/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/minipuft/claude-prompts/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/minipuft/claude-prompts/releases/tag/v1.1.0
