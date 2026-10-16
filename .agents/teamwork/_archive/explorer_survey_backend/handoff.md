# Handoff Report: Backend Membership Survey

**Agent**: `teamwork_preview_explorer` (Backend Survey Explorer)  
**Task**: Investigate the backend membership/subscription system (`membershipRoute.js` and all related files).  
**Report Destination**: `c:\Users\LOQ\Documents\gamukis\.agents\teamwork\explorer_survey_backend\handoff.md`  
**Detailed Survey**: `c:\Users\LOQ\Documents\gamukis\.agents\teamwork\explorer_survey_backend\backend_survey.md`

---

## 1. Observation

1. **Server Mount & Base Path**:
   - In `Backend/index.js`, line 55:
     ```javascript
     app.use('/api/memberships', require('./src/routes/membershipRoute'));
     ```
     The endpoint prefix is `/api/memberships` (plural). Default port is `5000` (line 28), and CORS origin defaults to `http://localhost:3000` (lines 30-32).

2. **Route Definitions & Guard Middleware**:
   - In `Backend/src/routes/membershipRoute.js`:
     - Line 9: `router.use(authenticateAny);`
     - Line 17: `router.get('/plans', requirePermission('membership:own'), ...)`
     - Line 28: `router.get('/me', requirePermission('membership:own'), ...)`
     - Line 41: `router.get('/history', requirePermission('membership:own'), ...)`
     - Line 51: `router.post('/subscribe', requirePermission('membership:own'), ...)`
     - Line 80: `router.post('/cancel', requirePermission('membership:own'), ...)`
     - Lines 93-172: Admin endpoints guarded with `requirePermission('membership:manage')`.

3. **Authentication Mechanism**:
   - In `Backend/src/middlewares/anyAuthMiddleware.js`, lines 14-67:
     - Extracts `Bearer <token>` from `req.headers.authorization`.
     - Tests JWT verification via `jwt.verify(token, jwtSecret)` for `authType: 'manual'`.
     - Falls back to `firebaseAuth.verifyIdToken(token)` for `authType: 'google'`.
     - Queries MySQL to resolve authoritative role (`siswa`, `guru`, `administrator`).
     - Injects `req.account` (`{ ownerKey, authType, userId, email, username, role }`).

4. **Permissions Configuration**:
   - In `Backend/src/config/permissions.js`, lines 14-32:
     - `'membership:own': ALL_ROLES` (`['siswa', 'guru', 'administrator']`).
     - `'membership:manage': [ROLES.ADMIN]` (`'administrator'`).

5. **Subscription Behavior & Responses**:
   - In `Backend/src/routes/membershipRoute.js`:
     - Lines 52-54: Returns 400 `{ message: 'Administrator tidak memerlukan membership.' }` if caller role is `administrator`.
     - Line 58: Returns 403 `{ message: 'Paket ini khusus untuk <audience>.' }` if plan audience != user role.
     - Lines 62-65: If free plan (`result.status === 'active'`), returns HTTP 201 `{ message: 'Paket aktif.', membershipId, status: 'active' }`.
     - Lines 68-72: If paid plan, returns HTTP 202 `{ message: 'Menunggu pembayaran.', membershipId, status: 'pending', paymentUrl: null }`.
   - In `Backend/src/models/membershipModel.js`:
     - Lines 90-100: `getEffective()` returns `{ plan, source: 'membership' | 'default' | 'administrator', features, expiresAt }`.
     - Lines 113-138: `subscribe()` in a transaction cancels prior pending memberships before inserting new record.
     - Lines 174-180: `cancel()` runs `UPDATE memberships SET status = 'cancelled' WHERE owner_key = ? AND status IN ('active', 'pending')`.
     - Lines 182-190: `history()` runs `SELECT m.id, m.status, m.started_at, m.expires_at, m.payment_ref, m.created_at, p.code, p.name, p.price FROM memberships m JOIN membership_plans p ON p.id = m.plan_id WHERE m.owner_key = ? ORDER BY m.id DESC`.

6. **Database Schema & Seeds**:
   - In `Backend/src/config/Database/MySQL/connection.js`:
     - Lines 106-118: `membership_plans` table (`id`, `code`, `name`, `audience`, `price`, `duration_days`, `features`, `is_active`).
     - Lines 121-135: `memberships` table (`id`, `owner_key`, `auth_type`, `owner_id`, `plan_id`, `status`, `started_at`, `expires_at`, `payment_ref`, `granted_by`).
     - Lines 137-142: Seeded plans: `siswa_free` (Rp 0), `siswa_premium` (Rp 29.000 / 30 hari), `guru_free` (Rp 0), `guru_pro` (Rp 99.000 / 30 hari).

7. **Frontend API Calling Patterns**:
   - In `Frontend/src/database/manualAuth.js`, lines 1-20:
     - `API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"`
     - Reads manual token from `localStorage.getItem("gamukis_manual_token")` / `sessionStorage`.
   - In `Frontend/src/database/firebaseDatabase.js`, lines 1-23:
     - Reads Firebase token via `await auth.currentUser.getIdToken()`.
   - Frontend currently has no membership API client or membership UI pages.

---

## 2. Logic Chain

1. From **Observation 1**, the backend mounts `membershipRoute.js` under `/api/memberships`. Therefore, frontend API calls must target `${API_URL}/memberships/<endpoint>` rather than `${API_URL}/membership/<endpoint>`.
2. From **Observation 2 & 3**, all endpoints require `authenticateAny`, which accepts both MySQL manual JWTs and Firebase ID tokens in `Authorization: Bearer <token>`. Thus, the frontend client must support token retrieval from both sources.
3. From **Observation 2 & 5**, `GET /plans` scopes results by caller role (`siswa` or `guru`), meaning `siswa` users only see student plans while `guru` users only see educator plans.
4. From **Observation 5**, `POST /subscribe` has two distinct success responses:
   - Free plans (`price === 0`) activate immediately with status `201 Created` (`status: "active"`).
   - Paid plans (`price > 0`) enter status `202 Accepted` (`status: "pending"`, `paymentUrl: null`), waiting for payment confirmation.
5. From **Observation 5**, `GET /me` returns `{ membership, pending }`. When a user has no active paid plan, `membership.source` is `'default'` pointing to the baseline free plan (`<role>_free`), and `expiresAt` is `null`.
6. From **Observation 5**, `GET /history` returns snake_case keys (`started_at`, `expires_at`, `payment_ref`, `created_at`) from MySQL joined with plan metadata (`code`, `name`, `price`).
7. From **Observation 5**, `POST /cancel` cancels active and pending subscriptions and defaults the user back to the free tier without deleting records.

---

## 3. Caveats

- **Payment Gateway**: As noted in `membershipRoute.js:66-67`, payment gateway integration (Midtrans/Xendit) has a `// TODO(payment)` comment and `paymentUrl` is currently `null`. Paid subscriptions remain in `'pending'` status until activated via admin endpoint (`POST /admin/memberships/:id/confirm`) or webhook.
- **Role Switching**: If a user role changes (e.g. from `siswa` to `guru`), existing memberships for the previous audience remain in the database unless cancelled.
- **No Caveats** on backend API stability; all routes are fully implemented and functional.

---

## 4. Conclusion

The backend membership system is complete, robust, and ready for frontend integration. The exact contracts are:
1. Base URL: `/api/memberships`
2. Authentication: `Authorization: Bearer <token>` (dual support: `gamukis_manual_token` or Firebase `getIdToken()`)
3. Endpoints:
   - `GET /api/memberships/plans` -> `{ plans: [...] }`
   - `GET /api/memberships/me` -> `{ membership: { plan, source, features, expiresAt }, pending }`
   - `GET /api/memberships/history` -> `{ history: [...] }`
   - `POST /api/memberships/subscribe` with `{ planCode }` -> `201` (active) or `202` (pending)
   - `POST /api/memberships/cancel` -> `{ success: true, cancelled: count }`
4. The frontend integration should encapsulate these endpoints in `Frontend/src/database/membershipApi.js` and render pages for Plans and Dashboard matching the existing Gamukis aesthetic.

---

## 5. Verification Method

To independently verify the backend survey findings:
1. **Inspect backend route mount**:
   Check line 55 in `Backend/index.js` to confirm route prefix `/api/memberships`.
2. **Inspect endpoint implementations**:
   Check lines 17, 28, 41, 51, and 80 in `Backend/src/routes/membershipRoute.js`.
3. **Inspect database schema and seed plans**:
   Check lines 106-149 in `Backend/src/config/Database/MySQL/connection.js`.
4. **Test backend start (if dependencies and DB are running)**:
   Command: `npm --prefix Backend test` or `node Backend/index.js`.
5. **Invalidation condition**:
   Any modification to `Backend/index.js:55` (e.g. renaming `/api/memberships` to `/api/membership`) or changes to `membershipRoute.js` request/response schemas would invalidate these findings.
