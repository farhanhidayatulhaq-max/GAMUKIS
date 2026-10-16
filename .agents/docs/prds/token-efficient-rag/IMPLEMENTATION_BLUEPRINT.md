# File & Folder Blueprint — Draft

**Status:** Proposed file limits. Product code paths must be verified in Phase 0 prior to approval. Once `APPROVED`, no files outside this table may be created (Zero-Improvisation, `AGENTS.md` §3.1).

## Rules

- Follow `AGENTS.md`, `.agents/docs/prd-standard.md`, `.agents/teamwork/INDEX.md`, and the knowledge base (`DECISIONS`, `LESSONS_LEARNED`).
- Backend modules use CommonJS and follow the `<feature>Service.js` naming convention.
- **No changes** to `9router/`, `n8n/` (except for Phase 3 with explicit permission), `.kilo/`, `inGame.js`, or `component_game/`.
- No new dependencies without approval.
- The paths below are audit targets; they do not constitute a claim that the Backend structure has been verified.

## Phase 0 — Read-only audit (no new files)

Document the following in the handoff:
1. The actual locations of the Gen-AI features, the Question Bank (`questions_bank`), and the use of Redis for caching.
2. The Node version and the availability of the global `fetch` function in `Backend/`.
3. Actual request/response formats for `/v1/chat/completions`, `/v1/embeddings`, `/v1/search`, and `/v1/web/fetch` in a running 9Router installation, including authentication (`requireApiKey`) and reading the key from environment variables.
4. Active RTK configuration and whether RTK compresses the retrieval payload.
5. Location conventions and Backend test commands (`npm test`).
6. Presence of `.gitignore` in the repo root.
7. Baseline: run `reference/tokenAudit.cjs` and save the results.

## Phase 1 — RAG Core and Agent Tool (no database, no routes)

The build order follows the sequence in §4 of the `prd-standard.md` table (Service = sequence 3), followed by the agent tool.

| # | Path | Action | Function | Depends on |
|---|---|---|---|---|
| 1 | `Backend/src/services/ragModalityService.js` | CREATE | Classification of seven classes, table serialization, payload planning, visual gate | — |
| 2 | `Backend/src/services/ragContextService.js` | CREATE | Budget packer, deduplication, key terms, scope, confidence gate | — |
| 3 | `Backend/src/services/ragRetrieverService.js` | CREATE | Retriever interface per namespace, lexical adapter (BM25) | 2 |
| 4 | `Backend/src/services/ragGatewayService.js` | CREATE | HTTP client to 9Router: evaluator, rewriter, embeddings, search, fetch. Environment variable keys | Phase 0 items 2–3 |
| 5 | `Backend/src/services/ragCorrectiveService.js` | CREATE | Limited loop controller (evaluator ≤ 2, rewriter ≤ 1, web ≤ 1), fail-open | 1–4 |
| 6 | Test paths defined in Phase 0, items 5 | CREATE | Ports from `reference/ragCore.reference.test.cjs` (20 tests) and broken down by module | 1–5 |
| 7 | `.agents/rag/ragNamespaces.json` | CREATE | Namespace mapping to source files, allowlist, secret blocklist | — |
| 8 | `.agents/rag/ragIndex.js` | CREATE | Builds a local index of documents; scans credentials before saving chunks | 3, 7 |
| 9 | `.agents/rag/ragQuery.js` | CREATE | Namespace-specific CLI query with `--budget`; concise output; also generates static packages | 5, 8 |
| 10 | `.agents/rag/tokenAudit.js` | CREATE | Port of `reference/tokenAudit.cjs` for recurring baselines | — |
| 11 | `.agents/skills/rag-context/SKILL.md` | CREATE | Skill L1 (draft in `AGENT_INTEGRATION.md` §5) | 9 |

**Generated, not committed:** `.agents/rag/index.json`, `.agents/rag/packs/<namespace>.md`.

Location note: The core is located in `Backend/src/services/` for use with the agent CLI and product features (PRD §14 Q6). If the owner chooses to separate the core from `Backend/`, the blueprint is amended before creation.

## Phase 2 — Product Feature Integration (only after Phases 0 and 1 are approved)

Sequence §4: Config/DB → Model → Service → Controller → Route. The path is determined in Phase 0.

| # | Path | Action | Function |
|---|---|---|---|
| 12 | MySQL migration files/schema (location follows conventions identified in the audit) | CREATE | Tables `rag_chunks` and `rag_events`; `utf8mb4` with explicit `COLLATE utf8mb4_0900_ai_ci` (BUG-01); FULLTEXT index |
| 13 | `Backend/src/models/ragModel.js` | CREATE | Queries for chunks and telemetry events |
| 14 | `Backend/src/services/ragStoreService.js` | CREATE | MySQL retriever adapter + Redis cache |
| 15 | `Backend/src/controllers/ragController.js` | CREATE | Request/response handler (Indonesian messages, sanitized input) |
| 16 | `Backend/src/routes/ragRoute.js` | CREATE | Query endpoint. `authenticateAny` + `requirePermission(...)`; specific path before general parameters |
| 17 | Route entry point in `Backend/index.js` | MODIFY | Register `ragRoute` behind a feature flag |
| 18 | Integration point for existing Gen-AI features | MODIFY | Only after Phase 0 identifies them and the PRD is amended |

There are no Frontend changes in this PRD.

## Phase 3 — Optional, requires separate approval

| Path | Action | Requirements |
|---|---|---|
| `.agents/rag/ragMcpServer.js` | CREATE | New MCP dependencies approved; MCP support verified per platform |
| n8n workflow in `n8n/exports/` | CREATE | Explicit owner permission required because `n8n/` is a restricted zone |

## Existing and proposed file changes (separate approval)

Not modified by this PRD. Proposed text in `PROPOSED_CHANGES.md`.

| Path | Changes |
|---|---|
| `AGENTS.md` | §1 indented; §3 and §4 moved to L1 |
| `GEMINI.md`, `.claude/CLAUDE.md` | Required reading becomes L0 plus triggers |
| `.agents/templates/HANDOFF.md` | Add the line “Context loaded” |
| `.gitignore` (root) | Ignore `.agents/rag/index.json` and `.agents/rag/packs/` |

## Out of scope

- Parallel combo engine, parallel retry engine, second compressor.
- Vector database, agent framework, external telemetry service.
- Indexing the `Frontend/` and `Backend/` source code.
- Changing the provider, default model, combo, or production fallback.

## Validation

Specify the commands from the live `package.json` in Phase 0. Run the focused tests first, then run `npm test` for the Backend. Do not declare the suite passed without running it and recording the results.

## Required implementation report

- Files that were changed and the reasons why.
- Workflow before and after.
- Tests run along with their exact results.
- Baseline vs. candidate metrics (tokens per stage, cost per successful task, quality, gate failure rate).
- Failures that existed prior to the change.
- Rollback procedure.

Translated with DeepL.com (free version)