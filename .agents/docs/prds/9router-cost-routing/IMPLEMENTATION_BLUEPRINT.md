# Implementation Blueprint — Draft

**Status:** Proposed file boundaries; verify paths against the live repository and approve before coding.

## Rules

- Follow root `AGENTS.md`, `.agents/docs/prd-standard.md`, `.agents/teamwork/INDEX.md`, and relevant layer-specific instructions.
- Do not create files outside this approved blueprint after it is formally accepted.
- Prefer modifying existing code over adding new modules.
- The paths below are audit targets, not a claim that every change is necessary.
- Do not change `.agents/` orchestration, `CLAUDE.md`, or `GEMINI.md` for runtime routing unless the audit proves a documentation change is needed.

## Phase 0 — Read-only audit

Inspect and document:
- `9router/src/sse/handlers/chat.js` — current model/combo entry point and capability detection.
- `9router/open-sse/handlers/chatCore.js` — request execution, translation, streaming, retries, token refresh.
- `9router/open-sse/services/combo.js` — existing combo execution and fallback.
- `9router/src/lib/comboPresets.js` — combo preset construction/configuration.
- `9router/src/lib/usageDb.js` and related usage/pricing repositories — what is recorded and how cost is computed.
- `9router/open-sse/rtk/` — current token-saving/compression hooks and skip/fail-open behavior.
- Existing tests and scripts, including `9router/scripts/test-combo-autoswitch.mjs` if still present.

Audit deliverable should identify actual functions, call graph, retry semantics, usage schema, pricing gaps, and tests. Do not assume the path names above remain unchanged.

## Proposed implementation scope (only after audit and approval)

### Existing files to consider modifying
1. `9router/src/sse/handlers/chat.js`
   - Connect task classification/policy to the current routing entry point only if no equivalent mechanism exists.
   - Keep capability checks authoritative.
2. `9router/open-sse/handlers/chatCore.js`
   - Integrate bounded retry/error categories only where the current behavior is insufficient.
   - Avoid a second retry loop.
3. `9router/open-sse/services/combo.js`
   - Adjust candidate ordering/selection only through the existing combo flow.
4. `9router/src/lib/comboPresets.js`
   - Only if existing configuration cannot express the desired task-class candidate order.
5. Existing usage/pricing database modules
   - Extend existing records/repositories only if required fields do not already exist.
6. Existing RTK modules
   - Only for demonstrated context/token optimization gaps; preserve fail-open behavior.

### New files
No new runtime source file is pre-approved by this draft. If audit proves a new policy module or schema is necessary, amend this blueprint and obtain approval before creating it.

### Explicitly out of scope
- New combo engine or parallel retry engine.
- New database technology.
- New external telemetry service.
- New package dependencies without approval.
- Rewriting the root agent instructions.
- Broad refactors unrelated to cost-aware routing.

## Data changes

Prefer the existing usage schema. If schema expansion is required, document:
- exact fields and types;
- migration/backward compatibility;
- handling for old records;
- how missing cost values are represented;
- tests for partial/failed writes.

No schema migration is authorized by this draft.

## Validation commands

Determine actual package scripts from the live `9router/package.json` before running tests. Run focused tests first, then applicable broader checks. Do not claim a suite passes unless it was run and its result recorded.

## Required implementation report

- Files changed and why each was necessary.
- Before/after routing flow.
- Tests executed and exact results.
- Baseline vs candidate metrics.
- Known failures and whether they predate the patch.
- Rollback instructions.
