# Dispatch: E2E Test Suite Creation

**Role**: `teamwork_preview_test_writer` (E2E Test Writer)
**Working Directory**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\test_writer_e2e\
**Authoritative Request**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\ORIGINAL_REQUEST.md
**Project Specification**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\orchestrator_1\PROJECT.md
**Spec Survey Reference**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\spec_miner_survey\spec_survey.md

**Write Ownership**:
- `Frontend/src/__tests__/membership/` (Exclusive ownership: test files and test utilities only)

**Objective**:
Design and implement a comprehensive opaque-box E2E and component test suite covering all requirements in `ORIGINAL_REQUEST.md` (R1, R2, R3) across 4 tiers:
- **Tier 1 (Feature Coverage, ≥5 per feature)**:
  - Test fetching and rendering plans for Siswa (`siswa_free`, `siswa_premium`).
  - Test fetching and rendering plans for Guru (`guru_free`, `guru_pro`).
  - Test active membership dashboard rendering with plan name and features.
  - Test subscription history table rendering with status badges.
  - Test trigger of subscribe endpoint (`POST /subscribe`) with plan code.
  - Test trigger of cancel endpoint (`POST /cancel`).
- **Tier 2 (Boundary & Corner Cases, ≥5 per feature)**:
  - Unauthenticated user state handling and login redirects.
  - User with default free plan (`source === 'default'`, null expiration).
  - User with active paid plan and valid expiration date.
  - User with pending subscription banner (`pending !== null`).
  - Empty subscription history (`history: []`).
  - API error handling (HTTP 401, 403, 404, 500) and toast/alert feedback.
  - Administrator account notice and disabled subscription.
- **Tier 3 (Cross-Feature Combinations)**:
  - Subscribing to paid plan creates pending state and updates dashboard.
  - Cancelling active subscription reverts status to free tier and updates history.
  - Switching between Plans page and Dashboard via navigation links.
- **Tier 4 (Real-World Application Scenarios)**:
  - Complete Student subscription lifecycle: browse plans -> subscribe -> view dashboard -> cancel.
  - Complete Teacher subscription lifecycle.
  - Responsive layout validation (desktop vs mobile card rendering).

**Execution**:
1. Check existing test runner in `Frontend` (e.g. `npm test -- --watchAll=false`).
2. Write tests under `Frontend/src/__tests__/membership/`.
3. Run the test suite and ensure it can execute.
4. Prepare `TEST_INFRA.md` and `TEST_READY.md` in your working directory.
5. Write `handoff.md` and report completion to parent.


## 2026-10-10T22:40:21Z
You are teamwork_preview_test_writer (E2E Test Writer).
Your working directory is: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\test_writer_e2e\
Project Root: c:\Users\LOQ\Documents\gamukis
Authoritative Request: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\ORIGINAL_REQUEST.md
Project Specification: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\orchestrator_1\PROJECT.md
Spec Survey Reference: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\spec_miner_survey\spec_survey.md
Dispatch details: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\test_writer_e2e\DISPATCH.md

Write Ownership:
Frontend/src/__tests__/membership/ (exclusive ownership: tests and test fixtures only)

Task:
Design and implement an opaque-box comprehensive E2E and component test suite covering requirements R1, R2, R3 across all 4 tiers (Tiers 1-4, ≥50 tests total):
- Tier 1: Feature Coverage (≥5 per feature): fetching plans, rendering plans for siswa/guru, fetching /me, rendering dashboard, fetching history, rendering table, triggering subscribe, triggering cancel.
- Tier 2: Boundary & Corner Cases (≥5 per feature): unauthenticated user handling, default free plan, active paid plan with expiry date, pending payment banner, empty history state, error codes 401/403/404/500, admin role exemption.
- Tier 3: Cross-Feature Interactions: subscribing creating pending order and dashboard updates, cancelling reverting active to free, navigation links between plans and dashboard.
- Tier 4: Real-World Scenarios: Student subscription lifecycle, Teacher subscription lifecycle, responsive layout adaptations.

Execute tests using the project's test command (e.g. in Frontend: npm test -- --watchAll=false).
Create TEST_INFRA.md and TEST_READY.md in your working directory.
Write handoff.md and send a completion message to your parent (conversation ID: 444ae9e4-4bba-40fd-b20d-21b6e3d504c9).
