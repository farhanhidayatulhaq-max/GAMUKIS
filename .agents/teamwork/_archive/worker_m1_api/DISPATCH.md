# Dispatch: Milestone 1 — Membership API Service Layer

**Role**: `teamwork_preview_worker`
**Working Directory**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\worker_m1_api\
**Authoritative Request**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\ORIGINAL_REQUEST.md
**Project Specification**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\orchestrator_1\PROJECT.md
**Backend Survey Reference**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\explorer_survey_backend\backend_survey.md

**Write Ownership**:
- `Frontend/src/database/membershipApi.js` (Exclusive ownership)

**Mandatory Integrity Warning**:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**Task Requirements**:
1. Implement `Frontend/src/database/membershipApi.js`.
2. Extract authentication token dynamically:
   - Check `localStorage` / `sessionStorage` for `gamukis_manual_token` (from manual login in `manualAuth.js`).
   - If not present, check `auth.currentUser` from `./firebaseAuth` and call `getIdToken()`.
   - If neither is present, proceed without token (letting backend return 401 if unauthorized).
3. Connect to backend base URL:
   - `const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';`
   - Target route prefix: `/memberships` (since Backend mounts at `/api/memberships`).
4. Implement and export all required functions:
   - `getPlans()`: `GET /memberships/plans` -> returns `{ plans: [...] }` or `data.plans`.
   - `getMyMembership()`: `GET /memberships/me` -> returns `{ membership: {...}, pending: ... }`.
   - `getMembershipHistory()`: `GET /memberships/history` -> returns `{ history: [...] }` or `data.history`.
   - `subscribePlan(planCode)`: `POST /memberships/subscribe`, body `{ planCode }`.
   - `cancelMembership()`: `POST /memberships/cancel`, method `POST`.
5. Error handling:
   - Parse error messages from response JSON (`error.message || 'Permintaan membership gagal'`) and throw descriptive Errors.
6. Verify implementation by running syntax checks or tests in `Frontend`.
7. Write `handoff.md` with verification commands and output, and notify parent.


## 2026-10-10T22:40:21Z
You are teamwork_preview_worker (Milestone 1 API Service Worker).
Your working directory is: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\worker_m1_api\
Project Root: c:\Users\LOQ\Documents\gamukis
Authoritative Request: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\ORIGINAL_REQUEST.md
Project Specification: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\orchestrator_1\PROJECT.md
Backend Survey Reference: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\explorer_survey_backend\backend_survey.md
Dispatch details: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\worker_m1_api\DISPATCH.md

Write Ownership:
Frontend/src/database/membershipApi.js (exclusive ownership)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Task:
Implement the complete API client module in Frontend/src/database/membershipApi.js:
1. Support dual auth: extract manual JWT token from localStorage/sessionStorage ('gamukis_manual_token') or Firebase ID token from auth.currentUser.getIdToken(). Attach Authorization: Bearer <token>.
2. Base URL: process.env.REACT_APP_API_URL || "http://localhost:5000/api". Route prefix: /memberships.
3. Export:
   - getPlans()
   - getMyMembership()
   - getMembershipHistory()
   - subscribePlan(planCode)
   - cancelMembership()
4. Ensure error responses throw Errors with message from response body.
5. Verify your implementation by running build / syntax check / node verification.
6. Write handoff.md with execution results and send completion message to parent (conversation ID: 444ae9e4-4bba-40fd-b20d-21b6e3d504c9).
