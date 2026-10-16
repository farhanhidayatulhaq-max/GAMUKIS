# TASK — Antigravity (Google 3.1 Pro) · Orchestrator + Core Engineer
From: Architect (Codex) · Mandatory reading first: `RULES.md`, `PROJECT.md`, `TASK_DISPATCH.md`

## Mission
Execute **core backend** and **core frontend** for the admin dashboard CRUD upgrade. You also act as **orchestrator**: decompose work, coordinate Copilot (UI) and ChatGPT (analysis), and perform final integration.

> **Architect Reminder:** all implementations must adhere to Architecture PRD `PROJECT.md` and rules in `RULES.md` located in `.agents/teamwork/admin_crud/`. Preserve existing features and backward compatibility. Do not alter contracts or expand scope without an Architect decision; record ambiguities in `handoff.md`.

## Scope
**Backend** (PROJECT.md §4.2, §4.3): all new endpoints, pagination/query helpers, error envelopes, audit service, fix inactive plan `grant`, validate plan PATCH.  
**Core Frontend**: `adminApi.js` (§4.4), `hooks/useAdminResource.js`, and `pages/adminDashboard.js` (responsive shell: sidebar→drawer, top bar, section states).  
**Not in Scope**: visual components `component_admin_*` and `component_admin_shared` (owned by Copilot) — you only connect them.

## Action Steps (Sequential)
1. **Initial Orchestration**: assign M0 analysis per `TASK_CHATGPT_ADMIN_ANALYSIS.md` and UI per `TASK_COPILOT_ADMIN_UI.md`. Copilot may start M4 without waiting for backend. If agent channels are unavailable, ensure dispatch files are read and status is recorded in `progress.md`.
2. **M1 Foundations**: helper `parseListQuery(req)` → `{page,limit,q,sort}` + `buildMeta()`; error envelope `{message,code,fields}`; `auditService`; fix `/memberships/admin/grant` (422 `PLAN_INACTIVE`) and plan PATCH validation.
3. **M2 Backend CRUD**: implement each endpoint matching table §4.2. Note:
   - Register `DELETE /admin/rooms/history/:historyId` **before** `DELETE /:roomId`.
   - Without query params → preserve legacy behavior (all records), preserve legacy response keys.
   - Guards: room in use (409), plan has active subscribers (409), self-action & last admin (422).
   - All mutations write audit logs.
   - Add tests in `Backend/test/` per endpoint (success, 400, 403, 404/409).
4. **M3 Core Frontend** (parallel with M2): `adminApi.js` — **preserve all legacy functions**, add new functions per §4.4. Create hooks. Refactor `adminDashboard.js` so the shell is responsive and lazy-loads data per section without altering legacy routes.
5. **M6 Integration**: once Copilot delivers M5, connect data → components, run regressions on legacy features (PROJECT.md §2), test viewports 375/768/1024/1440, `npm run build`, all tests.
6. **M7 (P2)** only after M6 passes **and** ChatGPT analysis confirms create-user is safe.

## Important Rules
- Do not alter contracts. Needed changes → `QUESTIONS_TO_ARCHITECT.md`.
- Do not edit files owned by Copilot; request via `handoff.md`.
- Do not touch game code & do not commit secrets (`.env`, service account, `id_rsa*`).
- Do not overwrite existing changes in the working tree; read active code before editing.

## Mandatory Deliverables
- Code + tests adhering to DoD (`RULES.md` §4).
- `admin_crud/progress.md` (status M0–M7) and `admin_crud/handoff.md` (modified files, verification commands, test/build outputs, remaining risks).
- Final report to Architect: CRUD matrix §3 with status ✅/❌ per cell.

## Minimal Verification
```
cd Backend  && npm test
cd Frontend && npx react-scripts test --watchAll=false
cd Frontend && npm run build
```
