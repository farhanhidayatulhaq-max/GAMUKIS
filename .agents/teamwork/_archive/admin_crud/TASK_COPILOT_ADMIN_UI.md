# TASK — GitHub Copilot · UI Engineer (frontend interface)
From: Architect (Codex) · Mandatory reading first: `RULES.md`, `PROJECT.md` (§4.4, §5, §6), `TASK_DISPATCH.md`

## Mission
Build a responsive, user-friendly admin **frontend interface**, **conforming to contracts** defined by the backend. The design should remain clean, consistent across mobile/tablet/laptop/desktop viewports, and preserve existing UI functionality.

> **Architect Reminder:** implement UI according to Architecture PRD `PROJECT.md` and `RULES.md` in `.agents/teamwork/admin_crud/`. Adhere to props/API contracts and designated file ownership. Do not modify backend code or speculate on new endpoints; record unaddressed needs in `handoff.md` for Architect decisions.

## Ownership (Permitted Edits Only)
- `Frontend/src/component/component_admin_*/**` (JS + CSS)
- `Frontend/src/component/component_admin_shared/**`
- `Frontend/src/pages/adminDashboard.css`

**Prohibited**: `Backend/**`, `adminApi.js`, `useAdminResource.js`, `adminDashboard.js`, `App.js`, tests owned by other agents, and contract files. If new props/functions are needed, request them in `handoff.md` for Antigravity.

## Phase A — Shared Components (Start now, parallel with backend)
Build in `component_admin_shared/` with props **strictly conforming** to PROJECT.md §5:
`DataToolbar`, `ResponsiveTable` (table ≥769px ↔ cards ≤768px), `Pagination`, `Modal` (modal ↔ bottom sheet ≤480px), `ConfirmDialog` (supports `requireText`), `Toast`/`useToast`, `EmptyState`, `ErrorState`, `Skeleton`, `StatusBadge`, `FormField` (renders field-specific errors).

## Phase B — Section UI (After Antigravity delivers M3)
Update each section utilizing shared components, **preserving all existing functionality**:
| Section | UI Additions |
|---|---|
| Rooms | List + search/sort; create form; **edit form (name, capacity)**; delete with ConfirmDialog (active rooms require typing name) |
| Memberships | Plan list + active filter; **create plan**; edit plan; **archive plan**; grant form preserved |
| Teachers | Status filter (pending/approved/rejected/all); approve/reject preserved; **delete/revoke** with ConfirmDialog |
| History | List + search + pagination; **delete item**; "Admin Activity" tab (audit log) |
| Users (new section if Antigravity routes exist) | List + role/status filter; modify role; **suspend/activate**; **deactivate** account; create-user only in P2 |
| Overview / Monitoring | Polish card grid for responsiveness; read-only |

Data & actions flow via props/hooks (`useAdminResource`, `useAdminMutation`) and `adminApi.js` functions — **never invoke `fetch` directly**. Render `error.message` and `error.fields` transparently.

## Responsive Requirements (see RULES.md §3)
- Mobile-first; breakpoints 480 / 768 / 1024 / 1600.
- No horizontal scrolling between 320–2560px. Touch targets ≥44px. Use `dvh`.
- Each list must provide 4 states: loading (skeleton), empty, error+retry, success (toast).
- Keyboard accessibility & `aria-label` on icon buttons; contrast ≥4.5:1; respect `prefers-reduced-motion`.
- Maintain existing palette, CSS variables, and dark mode (`data-theme`).

## Definition of Done
- [ ] All components in §5 exist and render correctly across 375/768/1024/1440.
- [ ] All sections in Phase B use shared components; legacy features continue to work.
- [ ] No new console errors/warnings; `npm run build` succeeds.
- [ ] `handoff.md` updated: modified files, additional prop requests, verification steps per screen width.
