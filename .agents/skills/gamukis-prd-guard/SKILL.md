---
name: gamukis-prd-guard
description: Use before modifying inGame features, score history, profile and role selection, auth tokens, membership, or Gamukis admin endpoints, providing a checklist of non-negotiable PRD invariants and their source files.
---

# Gamukis PRD Guard

Full specifications are detailed in `.agents/docs/prd-standard.md` (§1 structure, §2 inGame, §3 profiles). Inspect this checklist before and after editing.

## Structure
- API clients, Firebase SDK, and Socket.IO client instances reside exclusively in `Frontend/src/database/`. It is strictly prohibited to create `Frontend/src/api` or `Frontend/src/services`.
- Backend architecture: `routes/<feature>Route.js`, `services/<feature>Service.js`, `models/<feature>Model.js`. MySQL connection pool must use `utf8mb4`.

## inGame and Score History
- Realtime events: `game:join`, `player:move`, `player:updated`, `coin:claimed`, `leaderboard:updated`; session state stored in Redis.
- Game completion or game over triggers `saveGameHistory()` → `POST /api/players/history` → `historyService.js` → MySQL `history` table.
- `POST /history` MUST NOT be blocked by role-based `requirePermission` middleware. Guests and users without an assigned role must still be permitted to persist scores.
- Guests use the default sprite; registered users with customization load color, hair, and clothing preferences from their profile.

## Profiles and Roles
- Manual accounts: `personalInfo.js` → `POST /api/auth/manual/profile` → tables `users` + `users_detail` (linked via `user_id`).
- Google accounts: `completeProfile.js` / `personalInfo.js` → `POST /api/auth/profile` or `PUT /api/auth/complete-profile` → `google_user_profiles` (PK `firebase_uid`), mirrored to Firebase RTDB.
- `getEffectiveToken` must prioritize the Firebase ID token when logged in via Firebase, avoiding stale manual tokens in `localStorage` (preventing 401 Unauthorized errors).
- Student role is activated immediately. Teacher role creates a record in `teacher_applications` with status `pending`; administrators approve or reject via `POST /api/admin/teacher-applications/:id/approve|reject`; upon approval, role becomes `teacher`.
- An unset role must not be treated as confirmed, and permissions must not be broadened merely to make requests succeed.

## Admin and Security
- All administrative actions require: `authenticateAny` + `requirePermission(...)`; server-side input validation; destructive operations must have guards (409) and audit logging.
- Do not delete existing routes or response keys.
- `JWT_SECRET` must be configured in production; do not introduce static fallback secrets.
- Never read or write credentials (`.env`, `firebase-service-account.json`, `id_rsa*`, database passwords).

## Discrepancies Between Documentation and Code
Running code represents ground truth. Report discrepancies in the handoff log and request an Architect/Lead decision; do not align them silently.
