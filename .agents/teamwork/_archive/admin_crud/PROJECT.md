# Project: Admin Dashboard — CRUD Upgrade & Responsive Redesign
Architect: Codex (PRD authority for this task) · Status: READY FOR EXECUTION · Rules: `RULES.md`

## 1. Objective
Upgrade the administrator dashboard so that every entity supports **full CRUD** (Create, Read, Update, Delete), is more **responsive** and **user-friendly** across all devices (mobile, tablet, laptop, PC), **without breaking** existing features.

## 2. Baseline ALREADY EXISTING (Must Remain Operational)
**Frontend** — `Frontend/src/pages/adminDashboard.js` (shell, sidebar, 6 sections) + `Frontend/src/component/component_admin_{overview,rooms,monitoring,teachers,memberships,history}/` + `Frontend/src/database/adminApi.js`.
Routes: `/admin/dashboard|rooms|monitoring|teachers|memberships|history` (in `App.js`).

**Backend** (prefix `/api`, in `Backend/src/routes/index.js`):
| Entity | Existing Endpoint | Permission |
|---|---|---|
| Rooms | `GET /admin/rooms`, `POST /admin/rooms`, `DELETE /admin/rooms/:roomId` | `rooms:manage` |
| History | `GET /admin/rooms/history` | `history:read_all` |
| Teachers | `GET /admin/teachers?status=`, `PATCH /admin/teachers/:id/approval` | `teachers:manage` |
| Plans | `GET/POST /memberships/admin/plans`, `PATCH /memberships/admin/plans/:id` | admin |
| Memberships | `POST /memberships/admin/memberships/:id/confirm`, `POST /memberships/admin/grant` | admin |
| Users | `GET /access/users`, `PATCH /access/users/:authType/:id/role` | `users:manage` |

## 3. CRUD Matrix (Target)
✅ = already exists · 🆕 = built in this project · ➖ = not applicable

| Entity | Create | Read | Update | Delete |
|---|---|---|---|---|
| Rooms | ✅ | ✅ +search/sort/page 🆕 | 🆕 `PATCH /admin/rooms/:roomId` (name, capacity) | ✅ + guard 🆕 |
| Membership Plans | ✅ | ✅ +active filter 🆕 | ✅ + stricter validation 🆕 | 🆕 `DELETE` = **archive** (soft) |
| Users (students/teachers) | 🆕 P2 `POST /access/users` (manual account) | ✅ +search/filter role/page 🆕 | ✅ role · 🆕 `PATCH .../status` (active/suspended) | 🆕 `DELETE` = **deactivate** (soft) |
| Teacher Applications | ➖ (created by user) | ✅ all statuses 🆕 | ✅ approve/reject | 🆕 `DELETE /admin/teachers/:id` (revoke/delete application) |
| Game History | ➖ (automatic) | ✅ +page/filter 🆕 | ➖ | 🆕 `DELETE /admin/rooms/history/:historyId` |
| Memberships (subscriptions) | ✅ grant | ✅ | ✅ confirm | ➖ (cancel via status, not deleted) |
| Monitoring / Overview | ➖ | ✅ (read-only) | ➖ | ➖ |

P2 = executed after P1 completion & only if ChatGPT analysis (task 3) confirms safety.

## 4. API Contract (Frozen by Architect)
### 4.1 General Conventions
- Auth: `Authorization: Bearer <token>`. 401 without token, 403 without permission.
- **Backward-compatible**: Legacy keys remain intact. Additions are allowed.
- List endpoints accept optional queries: `page` (default 1), `limit` (default 20, max 100), `q` (search), `sort` (`field` or `-field`), plus per-entity filters. When **no query is provided**, behavior = identical to current (return all).
- List response: `{ <legacyKey>: [...], meta: { page, limit, total, totalPages } }`.
- Error response: `{ message: string, code?: string, fields?: { [name]: string } }`.
- Status codes: `200` OK · `201` Created · `400` Validation · `404` Not found · `409` Conflict/In use · `422` Business rule · `503` Realtime not ready.
- Successful delete: `{ success: true, id, mode: "hard"|"soft" }`.

### 4.2 New / Modified Endpoints
| Method & Path | Body | Success | Notes |
|---|---|---|---|
| `PATCH /admin/rooms/:roomId` | `{ name?: string(1–60), capacity?: int(2–100) }` | `200 { room }` | 404 `ROOM_NOT_FOUND`; 422 if `capacity` < active players |
| `DELETE /admin/rooms/:roomId` | – | `200 {success,id,mode}` | Add query `?force=true` if active players exist; without force → `409 ROOM_IN_USE` |
| `DELETE /admin/rooms/history/:historyId` | – | `200 {success,id,mode:"hard"}` | **Register BEFORE** `DELETE /:roomId` to avoid collision |
| `GET /admin/rooms/history?page&limit&q&sort` | – | `{ history, meta }` | |
| `GET /admin/teachers?status=pending\|approved\|rejected\|all&page&limit&q` | – | `{ teachers, meta }` | default `pending` (legacy behavior) |
| `DELETE /admin/teachers/:id` | – | `200 {success,id,mode}` | `approved` application → 409 unless `?revoke=true` (revokes teacher role) |
| `GET /memberships/admin/plans?active=true\|false&q` | – | `{ plans, meta }` | |
| `PATCH /memberships/admin/plans/:id` | `{name?,price?,durationDays?,isActive?,...}` | `200 { plan }` | Validation: price ≥ 0 integer, durationDays ≥ 1, name 1–60 |
| `DELETE /memberships/admin/plans/:id` | – | `200 {success,id,mode:"soft"}` | Sets `isActive=false`+`archivedAt`; 409 `PLAN_HAS_ACTIVE_SUBSCRIPTIONS` if active subscriptions exist |
| `POST /memberships/admin/grant` | `{authType,userId,planCode}` | unchanged | **Fix**: reject inactive plans (`422 PLAN_INACTIVE`) |
| `GET /access/users?role&status&q&page&limit&sort` | – | `{ users, meta }` | |
| `PATCH /access/users/:authType/:id/status` | `{ status: "active"\|"suspended" }` | `200 { user }` | Admin cannot suspend themselves → 422 `SELF_ACTION_FORBIDDEN` |
| `DELETE /access/users/:authType/:id` | – | `200 {success,id,mode:"soft"}` | Soft-delete; 422 for self & last admin |
| `POST /access/users` (P2) | `{ username, password, role }` | `201 { user }` | Uses hashing & validation from `registerService`; password omitted from response |

### 4.3 Audit Log (New)
Every admin create/update/delete writes a record: `{ at, actorId, action, entity, entityId, summary }`. Storage follows the pattern used by `historyService` (Antigravity selects Redis/DB according to existing infrastructure). Read endpoint: `GET /admin/audit?limit` (permission `history:read_all`) — rendered in the History section as an "Admin activity" tab.

### 4.4 Frontend Helper Contracts (`Frontend/src/database/adminApi.js`)
Legacy functions **preserve their name & return shape** (`getRooms`, `createRoom`, `deleteRoom`, `getHistory`, `getPendingTeachers`, `updateTeacherApproval`, `getMembershipPlans`, `updateMembershipPlan`, `getAccessUsers`, `grantMembership`). New functions (all return Promise, throw `Error` with display-ready `.message` and `.fields`/`.code` when available):
```
updateRoom(roomId, {name?, capacity?}) -> {room}
deleteRoom(roomId, {force?}) -> {success,id,mode}
deleteHistory(historyId) -> {success,id,mode}
listHistory(params) -> {history, meta}
listTeachers(params) -> {teachers, meta}
deleteTeacher(id, {revoke?}) -> {success,id,mode}
createMembershipPlan(plan) -> {plan}
archiveMembershipPlan(planId) -> {success,id,mode}
listAccessUsers(params) -> {users, meta}
updateUserStatus(authType, id, status) -> {user}
deleteUser(authType, id) -> {success,id,mode}
createUser({username,password,role}) -> {user}   // P2
getAuditLog({limit}) -> {entries}
```
Shared hooks (Antigravity, `Frontend/src/hooks/useAdminResource.js`):
```
useAdminResource(fetcher, {params, initialData}) ->
  { data, meta, status: "idle"|"loading"|"success"|"error", error, reload, setParams }
useAdminMutation(mutator, {onSuccess}) -> { run, isRunning, error }
```
UI components **only** use these props/hooks, never calling `fetch` directly.

## 5. UI Design (Guidance for Copilot & Antigravity)
- **Shell**: Fixed sidebar (≥1025) / drawer (<1025), top bar with section title + menu toggle; lightweight breadcrumbs.
- **Standard list pattern** (used in all sections): toolbar (search, filter, "Add" button) → data (table ≥769px, cards ≤768px) → pagination. Per-row actions: Edit, Delete (⋯ menu on mobile).
- **Forms** for create/edit in **modal** (desktop/tablet) / **bottom sheet** (mobile), inline validation using `error.fields`.
- **Delete confirmation**: Dialog specifies item name & impact (soft/hard). For hard delete of active rooms: requires typing room name.
- **Feedback**: Success/error toasts, skeleton loading, empty state with CTA, error state with "Try again" button.
- Retain existing visual identity (`adminDashboard.css`, CSS variables, dark mode `data-theme`). Do not change color palette.

### Shared Components (`Frontend/src/component/component_admin_shared/`, Copilot ownership)
`DataToolbar`, `ResponsiveTable` (table↔cards), `Pagination`, `Modal` (modal↔sheet), `ConfirmDialog`, `Toast`/`useToast`, `EmptyState`, `ErrorState`, `Skeleton`, `StatusBadge`, `FormField`.
Minimum contract props:
```
ResponsiveTable { columns:[{key,label,render?,primary?}], rows, getRowId, actions:(row)=>[{label,onClick,danger?}], loading }
Modal { open, title, onClose, children, footer }
ConfirmDialog { open, title, message, confirmLabel, danger, requireText?, onConfirm, onCancel, busy }
DataToolbar { search:{value,onChange,placeholder}, filters:[{key,label,options,value,onChange}], primaryAction:{label,onClick} }
Pagination { page, totalPages, onChange, limit, onLimitChange }
```

## 6. File Ownership
| Owner | Files |
|---|---|
| **Antigravity** | `Backend/src/routes/{adminRoomRoute,teacherApplicationRoute,accessRoute,membershipRoute}.js`, `Backend/src/services/{roomService,historyService,auditService(new)}.js`, `Backend/src/models/*`, `Backend/src/middlewares/*`, `Backend/test/**`, `Frontend/src/database/adminApi.js`, `Frontend/src/hooks/useAdminResource.js`, `Frontend/src/pages/adminDashboard.js` (shell/state/route) |
| **Copilot** | `Frontend/src/component/component_admin_*/**` (JS+CSS), `Frontend/src/component/component_admin_shared/**`, `Frontend/src/pages/adminDashboard.css` |
| **ChatGPT** | Only writes in `admin_crud/analysis/**` |
| **Architect** | `admin_crud/RULES.md`, `PROJECT.md`, `TASK_*.md` |

`Frontend/src/App.js` may only have new routes appended by Antigravity (if necessary); legacy routes must not be altered.

## 7. Milestones
| # | Name | Content | Owner | Dependencies |
|---|---|---|---|---|
| M0 | Analysis & test matrix | Risks, edge cases, test plan | ChatGPT | – |
| M1 | Backend foundation | Pagination/query helpers, error envelope, audit service, fix inactive plan `grant`, plan validation | Antigravity | M0 |
| M2 | Backend CRUD | All new endpoints §4.2 (P1) + tests | Antigravity | M1 |
| M3 | Frontend foundation | New `adminApi.js`, hooks, responsive shell (drawer, top bar) | Antigravity | M1 |
| M4 | Shared components | `component_admin_shared/` + responsive CSS, operable with mock data | Copilot | Contract §5 (backend not required) |
| M5 | Section UI | Rooms, Plans/Memberships, Teachers, History, Users → consume shared components + hooks | Copilot | M3, M4 |
| M6 | Integration & QA | Connect, regress legacy features, test across 4 viewports, build, test | Antigravity | M2, M5 |
| M7 | P2 | `POST /access/users` + user creation UI | Antigravity + Copilot | M6 + permission from M0 |

Parallel sequence: M0 → (M1 → M2 ∥ M3) and (M4) in parallel → M5 → M6 → M7.

## 8. Acceptance Criteria
1. All §3 matrix rows with 🆕 status function end-to-end (UI → API → data) except P2.
2. All §2 features continue functioning (zero regression).
3. No horizontal overflow at 320/375/768/1024/1440/1920px.
4. All destructive actions utilize ConfirmDialog; server rejects invalid operations (self-delete, last admin, active room/plan).
5. New backend tests for each 🆕 endpoint (success + 400 + 403 + 404/409) pass; existing tests pass; `npm run build` succeeds.
6. `handoff.md` completely populated.

## 9. Known Risks (from Previous Audits)
- `/admin/grant` accepts inactive plans → resolved in M1.
- PATCH plan validation is permissive → resolved in M1.
- Concurrent subscriptions may generate redundant pending records → out of scope, document only.
- `DELETE /history/:id` vs `DELETE /:roomId` route conflict → declaration ordering (see §4.2).
- Paid checkout/webhook (`paymentUrl: null`) remains TODO → **out of scope**.
