# RULES — Admin Dashboard CRUD Upgrade
Author: Architect (Codex, user directive 2026-10-11) · Date: 2026-10-11  
Binding document: `PROJECT.md` (Architecture PRD) in this directory is the **authoritative source of truth**. In case of conflict, PROJECT.md supersedes.

## 1. Roles (Non-Overlapping)
| Agent | Role | Permitted | Prohibited |
|---|---|---|---|
| Codex | Architect | Writes PRDs, API contracts, rules, reviews | Writing production code for this admin task |
| Antigravity (Google 3.1 Pro) | Orchestrator + Core Engineer | Leads orchestration; core backend + core frontend (see ownership) | Modifying files owned by Copilot without handoff |
| GitHub Copilot | UI Engineer | Admin UI/CSS components matching contracts | Modifying backend, `adminApi.js`, `adminDashboard.js`, or contracts |
| ChatGPT | Analyst | Risk analysis, edge cases, test matrix, review | Editing source files |

## 2. Golden Rules
1. **Do not break existing features.** All existing endpoints and frontend routes (see PROJECT.md §2) must remain functional. Legacy response keys (`rooms`, `history`, `plans`, `teachers`, `users`) **must not be deleted or renamed**; only additive keys are permitted (e.g., `meta`).
2. **Upgrade, do not rewrite.** Incremental refactoring; each milestone must be runnable.
3. **Contracts first, code second.** Request/response formats are altered solely by the Architect. If modifications are required, log them in `QUESTIONS_TO_ARCHITECT.md`; do not modify unilaterally.
4. **One file = one owner.** Consult ownership in PROJECT.md §6. Edits outside designated ownership require requests in `handoff.md`.
5. **All admin actions are mandatory** via `authenticateAny` + `requirePermission(...)` in the backend. Role checks in the frontend serve solely for UX, not security.
6. **Server-side validation** for all inputs (type, length, range). Never trust client UI.
7. **Safe deletion.** Deletion actions require: UI confirmation, server guard (409 if active references exist), and audit logging. Prioritize soft deletes for stateful/transactional records (plans, users, memberships).
8. **Do not record credentials.** Never commit `.env`, `firebase-service-account.json`, `id_rsa*`.
9. **Do not modify** game areas (`component_game/`, `realtimeGame*`), except `roomService.js` for room update utilities (owned by Antigravity).
10. UI Copy: Maintain localization consistency with existing application copy.

## 3. Responsive Standards (Mandatory & Verified)
- Breakpoints: **≤480** (mobile), **481–768** (tablet portrait), **769–1024** (tablet landscape / small laptop), **≥1025** (desktop), **≥1600** (wide display).
- **Mobile-first approach**. No horizontal scrolling permitted between 320px–2560px (except designated table containers wrapped in `overflow-x:auto`).
- Tables → **stacked cards** at ≤768px. Modals → **bottom sheets** at ≤480px.
- Touch targets ≥ **44×44px**; action spacing ≥ 8px. Use `dvh`, not `vh`, for full viewport heights.
- Sidebar: static at ≥1025, **drawer** below (focus trapped, Esc closes, overlay click closes).
- Accessibility: all controls keyboard operable, `aria-label` on icon buttons, contrast ≥ 4.5:1, respect `prefers-reduced-motion`.
- Views must provide states: **loading (skeleton)**, **empty**, **error + retry**, **success toast**.

## 4. Definition of Done (per milestone)
- [ ] Conforms to PROJECT.md contract (request/response shapes, status codes).
- [ ] New backend tests pass (`Backend/test/`), existing tests remain green.
- [ ] Frontend `npm run build` succeeds without new errors.
- [ ] Manually validated across 4 viewport widths: 375, 768, 1024, 1440.
- [ ] `handoff.md` updated: completed scope, modified files, verification commands, remaining risks.
- [ ] Zero regression on features listed in PROJECT.md §2.

## 5. Communication Protocol
- All agents write to this directory: `progress.md` (status), `handoff.md` (handoffs), `QUESTIONS_TO_ARCHITECT.md` (queries).
- Concise updates: **What · Files · Status · Blockers**.
- Antigravity decides technical execution sequence within PRD boundaries and serves as sole final integrator.
