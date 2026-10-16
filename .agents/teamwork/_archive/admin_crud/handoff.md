# Handoff — Admin Dashboard CRUD Upgrade

## Objective

The admin dashboard supports relevant CRUD operations for existing data, preserves legacy routes/APIs/responses, and remains responsive and easy to use across various screen sizes. Requirements, baseline, API contracts, UI components, file ownership, milestones, and acceptance criteria are documented in `PROJECT.md`.

## Assignments

- **Antigravity (Google 3.1 Pro):** Lead orchestration, core backend, core frontend, integration, and QA. Details: `TASK_ANTIGRAVITY_CORE.md`.
- **GitHub Copilot:** Frontend UI only, adhering to established props and contracts. Details: `TASK_COPILOT_ADMIN_UI.md`.
- **Codex:** Architect; owner of PRD/contracts and reviewer.
- **ChatGPT Analyst:** M0 read-only analysis in the `analysis/` folder. Details: `TASK_CHATGPT_ADMIN_ANALYSIS.md`.

## Handoff Status

Dispatch files are available. A direct channel to Antigravity was unavailable during this session, so their acceptance status remains unconfirmed.

## Copilot — M4 Shared UI Update

### Files Created

- `Frontend/src/component/component_admin_shared/index.js`
- `Frontend/src/component/component_admin_shared/adminShared.css`
- `Frontend/src/component/component_admin_shared/AdminShared.test.js`

### Components and Behavior

- `DataToolbar`: Search, filters, and primary actions.
- `ResponsiveTable`: Desktop table and mobile cards, per-column cell rendering, and row actions.
- `Pagination`: Page selector and page size selector.
- `Modal`: Accessible dialog, Escape handling, focus trap/restore, body scroll lock, and mobile bottom-sheet.
- `ConfirmDialog`: Destructive confirmation supporting literal `requireText`.
- `Toast` and `useToast`: Live-region, manual dismiss, timeout, and cleanup.
- `EmptyState`, `ErrorState`, `Skeleton`, `StatusBadge`, `FormField`: Accessible states, labels, and per-field errors.

### Verification

- `npx react-scripts test --watchAll=false --runInBand src/component/component_admin_shared/AdminShared.test.js`: **1 suite, 8 passed, 0 failed**.
- `npm run build` executed from `Frontend/`: **Compiled successfully**.
- Visual inspection on 375/768/1024/1440px viewports has not been claimed yet because components are not yet mounted into dashboard sections; this check is part of M5/M6 integration.
- Did not edit `Backend/`, `adminDashboard.js`, `adminApi.js`, core hooks, routing, or game files (`inGame.js` untouched).

### Frontend Footprint Follow-up

- `ResponsiveTable` uses `matchMedia('(max-width: 768px)')` with a resize event fallback and renders only the desktop layout **or** mobile cards. Rows are no longer duplicated for hidden tables/cards; tests verify active nodes switch upon breakpoint changes.
- This reduces active DOM and duplicate per-row rendering, **not** download size. Full frontend regression: `npm test -- --watchAll=false --runInBand` → **17 suites, 214 tests passed**.
- Final build succeeded. Gzip output increased by approximately **5.32 kB JS** and **1.87 kB CSS** compared to the pre-responsive-table build. Compare with real admin datasets after M3/M5 before deciding whether this tradeoff is worthwhile or if layout should be CSS-only.

## Copilot — Readiness Check M5

Current source inspection shows M3 dependencies are not yet available:

- `Frontend/src/hooks/useAdminResource.js` does not exist yet.
- `Frontend/src/database/adminApi.js` still provides baseline functions; new list/mutation helpers from PROJECT.md §4.4 are not yet available.
- `Frontend/src/pages/adminDashboard.js` still loads teachers, rooms, and history concurrently on mount; has not yet passed the M3 props/hooks required by UI sections.
- Since `TASK_COPILOT_ADMIN_UI.md` requires M5 after M3 is handed off by Antigravity, CRUD sections have not been started so UI does not guess contracts or take over core Antigravity files.

## Required from Antigravity when Deliverables are Ready

- Milestones and CRUD matrix status.
- Modified files and ownership.
- Test/build commands and actual results.
- Inspected viewport sizes and inspection methodology.
- Risks, blockers, and contracts requiring Architect decisions.
