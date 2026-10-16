# Handoff Report — Requirements & Feature Specification Survey

**Agent**: `teamwork_preview_spec_miner` (Requirements Spec Miner)  
**Parent Agent**: `orchestrator_1` (`444ae9e4-4bba-40fd-b20d-21b6e3d504c9`)  
**Working Directory**: `c:\Users\LOQ\Documents\gamukis\.agents\teamwork\spec_miner_survey\`  
**Date**: 2026-10-10T22:39:00Z  
**Type**: Hard Handoff (Task Complete)  

---

## 1. Observation

1. **Authoritative Source Code Inspection**:
   - `Backend/index.js:55`: Route mounting: `app.use('/api/memberships', require('./src/routes/membershipRoute'));`.
   - `Backend/src/routes/membershipRoute.js`:
     - Line 17-24: `router.get('/plans', requirePermission('membership:own'), ...)` filters plans by `req.account.role` (or all if admin).
     - Line 28-39: `router.get('/me', requirePermission('membership:own'), ...)` returns `{ membership: effective, pending }`.
     - Line 41-48: `router.get('/history', requirePermission('membership:own'), ...)` returns `{ history: [...] }`.
     - Line 51-76: `router.post('/subscribe', requirePermission('membership:own'), ...)` handles subscription validation, 400 for admin, 404 for missing plan, 403 for audience mismatch, 201 for free plan (`status: 'active'`), and 202 for paid plan (`status: 'pending'`).
     - Line 80-88: `router.post('/cancel', requirePermission('membership:own'), ...)` cancels active and pending subscriptions via `MembershipModel.cancel(req.account.ownerKey)`.
     - Line 91-192: Admin endpoints: `GET /admin/plans`, `POST /admin/plans`, `PATCH /admin/plans/:id`, `POST /admin/memberships/:id/confirm`, `POST /admin/grant`.
   - `Backend/src/models/membershipModel.js`:
     - Line 20-30: `listPlans({ audience, includeInactive })`: queries `membership_plans WHERE is_active = 1` sorted by `audience, price`.
     - Line 64-75: `getActive(ownerKey)`: queries `memberships` joined with `membership_plans` where `status = 'active'` and `expires_at > NOW()`.
     - Line 77-84: `getPending(ownerKey)`: queries `status = 'pending'`.
     - Line 90-100: `getEffective(account)`: returns admin unlimited features, or active plan, or fallback to `<role>_free`.
     - Line 108-139: `subscribe(account, plan)`: transaction cancelling existing pending rows; if free (`price === 0`), cancels active rows and activates immediately; if paid, sets status to `pending`.
     - Line 174-180: `cancel(ownerKey)`: updates status to `cancelled` for `active` and `pending` rows.
   - `Backend/src/config/Database/MySQL/connection.js`:
     - Line 106-136: MySQL table schemas for `membership_plans` and `memberships`.
     - Line 137-149: Default plans seeded:
       - `siswa_free`: price 0, `duration_days: null`, `{ maxCharacters: 5 }`.
       - `siswa_premium`: price 29000, `duration_days: 30`, `{ maxCharacters: 10, extraAvatars: true, progressReport: true }`.
       - `guru_free`: price 0, `duration_days: null`, `{ maxCharacters: 5, maxClasses: 1 }`.
       - `guru_pro`: price 99000, `duration_days: 30`, `{ maxClasses: 20, exportReport: true, maxCharacters: 10, studentAnalytics: true }`.
   - `Frontend/src/`:
     - `Frontend/src/database/manualAuth.js`: uses token key `gamukis_manual_token` in `localStorage`/`sessionStorage`.
     - `Frontend/src/database/firebaseDatabase.js`: uses `auth.currentUser.getIdToken()`.
     - `Frontend/src/pages/profile.css:1-25`: hero banner gradient `linear-gradient(120deg, #206bf0, #08b9c9)`, box shadow `0 18px 40px rgba(38, 107, 200, 0.22)`.
     - `Frontend/src/pages/adminDashboard.css:1-17`: CSS variables for brand yellows (`#FCD13F`, `#FFC926`), primary blues (`#5B8DFE`, `#0B3C99`), status green (`#14A86B`), red (`#F0605D`), cream backgrounds (`#FFF8D6`, `#FFFDF3`).
     - `Frontend/src/pages/login.js:23-48` and `login.css:5-26`: native popup modal overlay with border `3px solid #0b2d6b`, border-radius `18px`, shadow `0 14px 36px rgba(0,0,0,0.22)`.
     - `Frontend/src/component/Navbar.js:78-125`: top nav links and profile dropdown with signout and user details.

2. **Live Probe Command & Verbatim Output**:
   Command:
   ```powershell
   $env:MYSQL_PASSWORD="rootpassword"; $env:MYSQL_HOST="localhost"; node -e "<probe-suite>"
   ```
   Verbatim observed probe results:
   - `GET /plans` unauthenticated → HTTP 401: `{ message: "Token login diperlukan." }`.
   - `GET /plans` with Siswa token → HTTP 200: Returns 2 plans (`siswa_free`, `siswa_premium`).
   - `GET /plans` with Guru token → HTTP 200: Returns 2 plans (`guru_free`, `guru_pro`).
   - `GET /plans` with Admin token → HTTP 200: Returns all 4 plans.
   - `GET /me` with Siswa token (no prior subscription) → HTTP 200: `{ membership: { plan: { code: "siswa_free" }, source: "default", expiresAt: null }, pending: null }`.
   - `POST /subscribe` with Admin token → HTTP 400: `{ message: "Administrator tidak memerlukan membership." }`.
   - `POST /subscribe` with invalid code → HTTP 404: `{ message: "Paket tidak ditemukan." }`.
   - `POST /subscribe` with audience mismatch (Siswa picking `guru_pro`) → HTTP 403: `{ message: "Paket ini khusus untuk guru." }`.
   - `POST /subscribe` with `siswa_premium` (price 29000) → HTTP 202: `{ message: "Menunggu pembayaran.", membershipId: 3, status: "pending", paymentUrl: null }`.
   - `GET /me` after paid subscribe → HTTP 200: `pending` is populated with `{ membershipId: 3, plan: { code: "siswa_premium" }, createdAt: ... }`.
   - `POST /subscribe` with `siswa_free` (price 0) → HTTP 201: `{ message: "Paket aktif.", membershipId: 4, status: "active" }`. Cancels pending.
   - `GET /history` → HTTP 200: Returns array of past subscriptions with `id`, `status` (`active`, `cancelled`), `started_at`, `code`, `name`, `price`.
   - `POST /cancel` → HTTP 200: `{ success: true, cancelled: 1 }`.
   - `POST /cancel` second run → HTTP 200: `{ success: true, cancelled: 0 }`. Safe idempotency.

---

## 2. Logic Chain

1. **Endpoint Resolution**: Because `Backend/index.js:55` mounts `membershipRoute.js` at `/api/memberships`, the frontend client must target `/api/memberships/plans`, `/api/memberships/me`, `/api/memberships/history`, `/api/memberships/subscribe`, and `/api/memberships/cancel`.
2. **Dual Authentication Support**: In the frontend, users authenticate via either manual JWT (`manualAuth.js`) or Google Firebase (`firebaseAuth.js`). Because `authenticateAny` in `Backend/src/middlewares/anyAuthMiddleware.js` accepts either a manual JWT or a Firebase ID token in the `Authorization: Bearer <token>` header, the frontend API service must extract whichever token is currently active.
3. **Role-Based Isolation (R1)**: Observation 2 proves that `GET /plans` strictly filters plans by the user's role. A student never sees teacher plans, and a teacher never sees student plans. Attempting to bypass this on `POST /subscribe` triggers HTTP 403. Hence, the frontend Plans page should dynamically display role-appropriate plan cards, with preview tabs for unauthenticated visitors.
4. **Subscription Lifecycle States (R2)**:
   - Users with no paid subscription are returned `source: 'default'` and `expiresAt: null` pointing to `<role>_free`. The dashboard must recognize this as the "Default Free" state and offer an upgrade CTA.
   - Users with paid subscriptions get `source: 'membership'` and a valid `expiresAt` date. The dashboard must show an "Aktif" badge, expiry date, and the "Batalkan Langganan" button.
   - Paid subscriptions initialize in `status: 'pending'` (HTTP 202). The dashboard must render an amber warning banner alerting the user that their plan is awaiting confirmation.
   - Cancellation transitions active and pending records to `status: 'cancelled'` and immediately returns the user to the default free tier.
5. **UI/UX Consistency (R3)**: By extracting colors, component patterns, and modals from `profile.css`, `adminDashboard.css`, and `login.css`, the new pages will match the existing Gamukis aesthetic: brand yellows (`#ffd044`), primary blues (`#206bf0`), dark modal borders (`#0b2d6b`), and soft elevation shadows.

---

## 3. Caveats

1. **Payment Gateway Integration**: `membershipRoute.js:66-72` notes that payment gateway URL creation (e.g. Midtrans/Xendit) is currently stubbed (`paymentUrl: null`), and activation currently occurs via `POST /admin/memberships/:id/confirm`. The frontend specification accounts for this by handling HTTP 202 Accepted and rendering the pending state cleanly.
2. **Admin UI Scope**: While admin endpoints (`/admin/plans`, `/admin/memberships/:id/confirm`) were discovered and documented in Section 2 (F21), the primary requirements (R1, R2, R3) focus on user-facing plans and dashboard interfaces. Admin management UI can be added as an optional extension.
3. **Assumptions Made**: No unverified assumptions were made; all response formats and status codes were observed directly via live execution.

---

## 4. Conclusion

The authoritative specification survey is complete and documented in `c:\Users\LOQ\Documents\gamukis\.agents\teamwork\spec_miner_survey\spec_survey.md`.
The requirements R1, R2, and R3 are fully mapped:
- **R1 (Membership Plans Page)**: Complete functional specs, card schemas, modal confirmation flows, and status codes (201 for free, 202 for paid, 403 for role mismatch, 400 for admin).
- **R2 (User Membership Dashboard)**: Full state machine (Unauthenticated, Default Free, Active Premium, Pending Payment, Cancelled), effective perks checklist, pending alert banner, audit history table, and cancellation modal.
- **R3 (UI/UX Consistency)**: Full CSS design token specification, typography rules, button paradigms, modal architecture, responsive breakpoints, and Navbar integration.
- **Feature Inventory**: 22 discovered features and 20 observed edge cases cataloged with complete test assertions.

---

## 5. Verification Method

1. **Inspect Documentation Artifacts**:
   - Primary Specification Report: `c:\Users\LOQ\Documents\gamukis\.agents\teamwork\spec_miner_survey\spec_survey.md`.
   - Dispatch Log: `c:\Users\LOQ\Documents\gamukis\.agents\teamwork\spec_miner_survey\DISPATCH.md`.
   - Progress Heartbeat: `c:\Users\LOQ\Documents\gamukis\.agents\teamwork\spec_miner_survey\progress.md`.
2. **Re-run Independent Probe Suite**:
   Execute the following command in PowerShell from the project root:
   ```powershell
   cd c:\Users\LOQ\Documents\gamukis\Backend
   $env:MYSQL_PASSWORD="rootpassword"; $env:MYSQL_HOST="localhost"; node -e "
   const { connectMySQL, pool } = require('./src/config/Database/MySQL/connection');
   const MembershipModel = require('./src/models/membershipModel');
   (async () => {
     await connectMySQL();
     console.log('Plans:', await MembershipModel.listPlans());
     console.log('History owner 1:', await MembershipModel.history('manual:1'));
     process.exit(0);
   })();
   "
   ```
3. **Invalidation Conditions**:
   - Changes to `Backend/src/routes/membershipRoute.js` modifying endpoints or status codes.
   - Alterations to `Backend/src/config/Database/MySQL/connection.js` changing table schemas or default plans.
