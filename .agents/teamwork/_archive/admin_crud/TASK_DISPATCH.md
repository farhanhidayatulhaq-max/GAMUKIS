# Active Dispatch — Admin Dashboard CRUD Upgrade

Status: **START NOW · READY FOR EXECUTION**  
Architect and PRD Owner: **Codex**  
Recipients: **Antigravity (Google 3.1 Pro)** and **GitHub Copilot**  
Governance source: [`RULES.md`](./RULES.md) · Requirements/contract source: [`PROJECT.md`](./PROJECT.md)

## Objective

Upgrade the Gamukis administrator dashboard so admin-managed entities can be safely created, read, updated, and deleted/archived. Preserve existing routes, endpoints, behaviors, and legacy response keys. Improve responsiveness, accessibility, and usability across mobile phones, tablets, laptops, and desktop computers. **Do not perform rewrites or break existing features.**

## Assignments

> **Mandatory reminder for all contributors:** implement work adhering to Architecture PRD `PROJECT.md` and `RULES.md` in `.agents/teamwork/admin_crud/`. The PRD is the authoritative source of truth for requirements and contracts. Do not expand scope or alter contracts unilaterally. If conflicts or unaddressed needs arise, record questions/findings in `handoff.md` and request an Architect decision before implementing dependent code.

### Antigravity (Google 3.1 Pro) — Orchestrator + Core Engineer

Antigravity serves as technical lead and final integrator. Handle core backend and core frontend according to `TASK_ANTIGRAVITY_CORE.md` and ownership defined in `PROJECT.md` §6:

- Backend: validation, queries/pagination, audit logging, P1 CRUD endpoints, permissions and destructive operation guards, plus backend tests.
- Core Frontend: helper `adminApi.js`, resource/mutation hooks, responsive dashboard shell, state/routes, and final integration.
- Coordinate milestone sequencing and guide Copilot to consume backend contracts frozen in `PROJECT.md`.
- Integrate only after inspecting existing changes; do not overwrite working trees.

### GitHub Copilot — UI Engineer

Implement the **frontend interface exclusively**, adhering to `TASK_COPILOT_ADMIN_UI.md`:

- Shared components, section views, responsive styling, loading/empty/error/success states, forms, and confirmation dialogs.
- Consume APIs/hooks/props adhering to `PROJECT.md` contracts; do not issue direct `fetch` requests.
- Do not modify backend code, contracts, `adminApi.js`, core hooks, `adminDashboard.js` shell/state, or routing.
- Deliver clean interfaces consistent with Gamukis's visual palette, dark mode, and established UI patterns.

### Codex — Architect / Review

- Establishes PRDs, rules, contracts, and P1/P2 boundaries.
- Reviews M0 analysis, integration diffs, contract regressions, and final reports.
- Does not take over production code authoring owned by Antigravity/Copilot.

## Execution Sequence

1. All recipients review `RULES.md`, `PROJECT.md`, and their respective dispatch instructions.
2. M0 risk analysis/test matrix; M1 backend foundations. Copilot may start M4 (shared components) in parallel since UI contracts are frozen.
3. M2 backend CRUD executes in parallel with M3 core frontend once dependencies are ready.
4. Copilot completes M5 UI sections after M3 and M4 are available.
5. Antigravity executes M6 integration/regression/build/responsive testing and submits the handoff.
6. M7 (create-user) is P2: do not start before M6 passes and M0 analysis confirms conditions are satisfied.

## Boundaries and Acceptance Criteria

- All legacy baselines and response keys remain available; legacy routes unchanged.
- All mutations protected server-side, validated, audit-logged, and guarded.
- Zero horizontal overflow between 320–2560px (except wrapped tables); verified at 375/768/1024/1440px.
- UI components enforce confirmation for destructive actions and provide loading, empty, error+retry, and success feedback.
- New endpoints and regression tests pass; Frontend `npm run build` succeeds.
- Antigravity updates `progress.md` and `handoff.md` (milestone status, files, verification commands, results, risks).

## Reporting / Delivery

As dispatch operates via shared teamwork directories, each agent logs acceptance and outcomes in `.agents/teamwork/admin_crud/progress.md` and `handoff.md`.
