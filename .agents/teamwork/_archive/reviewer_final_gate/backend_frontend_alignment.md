# Gamukis Frontend–Backend Alignment Audit

Date: October 11, 2026  
Type: Static audit of active source; does not modify code or execute tests.

## Summary

I identified gaps affecting user experience: Google/Firebase administrators cannot utilize the admin dashboard, the leaderboard on the game page queries an endpoint forbidden to students, score history persistence failures are unhandled, character customization is saved only in browser localStorage despite backend per-account storage, and the health endpoint can report healthy when MySQL is impaired.

## Findings and Recommendations

### P1 — Google/Firebase Administrators Cannot Use Admin Dashboard

- The frontend reads admin sessions exclusively via `getManualUser()` in `Frontend/src/pages/adminDashboard.js:28` and uses `request` from `manualAuth` in `Frontend/src/database/adminApi.js:1`.
- Backend admin routes accept both manual and Google/Firebase accounts via `authenticateAny`, such as `Backend/src/routes/adminRoomRoute.js:7` and `Backend/src/routes/teacherApplicationRoute.js:7`.
- Consequently, Google admins are unrecognized by the UI; even when navigating directly to endpoints, `adminApi` does not supply the Firebase token.
- Solution: Unified auth state and API client resolving manual/Firebase tokens and roles from `/api/access/me`. Dashboard waits for auth resolution before redirecting and provides re-login if sessions expire.

### P1 — In-Game Leaderboard Fails for Student Accounts with Swallowed Errors

- `Frontend/src/pages/gamePage.js:89` renders `Leaderboard` without `playersData`; `Frontend/src/component/component_game/leaderboard.js:36-48` polls `getPlayers()` every 5 seconds and swallows errors.
- `GET /api/players` in `Backend/src/config/Database/Firebase/players.js:64` requires `players:read_all`; this permission is restricted to Teacher/Admin (`Backend/src/config/permissions.js:22`). Students and guests receive 403 Forbidden.
- Impact: Leaderboard appears empty as if no players exist, with no error notification or retry option.
- Solution: Provide a dedicated public leaderboard endpoint returning only public names, scores, and avatars; grant read permissions without exposing full `/players` records. Frontend should display loading, empty, error, and retry states, throttling polling on inactive tabs.

### P1 — Session History Persistence Can Fail While Game Treats It as Complete

- `Frontend/src/component/component_game/inGame.js:174-201` locks `historySavedRef` prior to request dispatch; errors are logged only to console. `restartGame` continues reset after `persistGameHistory` resolves.
- `POST /api/players/history` uses `requirePermission('history:create')` (`Backend/src/config/Database/Firebase/players.js:27`). Permission applies only to roles in `ALL_ROLES` (`Backend/src/config/permissions.js:17`), whereas anonymous accounts have `null` role and are rejected.
- MySQL `history` table does not persist owner or session IDs (`Backend/src/config/Database/MySQL/connection.js:39`), preventing linking to accounts for personal history.
- Solution: Persist owner key, auth type, session ID, and outcome; add owner-scoped `GET /api/players/history/me`; make persistence idempotent per session. Display "saved" only upon success, provide retries on failure, and establish an explicit policy for guests. Do not reset sessions before persistence errors are resolvable.

### P1 — Custom Characters Lack Per-Account Backend Persistence

- Frontend persists selections to localStorage in `Frontend/src/component/component_customization_char/characterCustomization.js:443-448`; game reads from localStorage in `Frontend/src/component/component_game/inGame.js:56-63`.
- Backend provides authenticated character CRUD and quota limits in `Backend/src/routes/characterRoute.js:33-56`, but no `/api/characters` invocations exist in `Frontend/src`.
- Impact: Customizations are lost when browser storage clears and do not sync across devices.
- Solution: Authenticated accounts load/persist active characters via `/api/characters`; localStorage serves as guest cache/fallback.

### P2 — `/health` Only Checks Redis, Not MySQL

- `Backend/index.js:39-45` responds `status: ok` after pinging Redis only. MySQL is mandatory at startup for auth, profiles, membership, and history.
- Impact: Monitoring reports healthy while primary APIs fail due to database downtime.
- Solution: Split into `/health/live` (process alive) and `/health/ready` (MySQL, Redis, and Firebase dependencies). Return HTTP 503 if mandatory dependencies fail.

### P2 — Admin Room/History Errors Render as Empty Data

- `Frontend/src/pages/adminDashboard.js:46-58` uses `Promise.allSettled`, but only retains Teacher application errors. If rooms or history fail to load, state remains `[]` and the UI suggests no data exists.
- Solution: Store status/error per panel, preserve previous data during failed refreshes, and display update timestamps and retry controls.

## Recommended Remediation Sequence

1. Unify auth client and admin session handling for manual + Firebase accounts.
2. Introduce a public-scoped leaderboard endpoint with explicit error states.
3. Establish history persistence contracts (owner/session, guest policy, idempotency) and support retries.
4. Connect character editor and game canvas to `/api/characters` for registered accounts.
5. Upgrade health check readiness endpoints and admin panel error states.

## Audit Boundaries

Findings derived from static inspection of active source files and API call mapping. Live tests, builds, and browser sessions were not executed.
