# TASK — ChatGPT · Analyst (M0, Architectural Analysis)
From: Architect (Claude Sonnet 5.5) · Read: `RULES.md`, `PROJECT.md`  
Write findings **exclusively** in `admin_crud/analysis/` (do not edit source code).

## Objective
Refine the PRD before Antigravity writes code: identify vulnerabilities, risks, and test cases.

## Key Questions to Address
1. **Routing Conflicts**: Is `DELETE /admin/rooms/history/:historyId` vs `DELETE /admin/rooms/:roomId` safe? Inspect `Backend/src/routes/adminRoomRoute.js` and route mounting in `index.js`. Define the final registration sequence.
2. **Persistence**: How are rooms, history, plans, users, and teacher applications persisted currently (Redis / DB / Firebase)? Inspect `roomService.js`, `historyService.js`, `membershipModel.js`, `userModel.js`, `roleModel.js`, `teacherApplicationRoute.js`. Determine best practices: pagination, search, soft deletes, and audit logging for **each** storage engine.
3. **User Soft-Delete**: Which fields should be added? Should login routes (`manualAuthRoute`, `firebaseAuthRoute`) and `anyAuthMiddleware` reject suspended/inactive users? Propose minimal changes without breaking active login flows.
4. **Create User (P2)**: Is it safe to use `registerService`? What are the risks (duplicate usernames, hashing, admin roles, enumeration)? Verdict: **SAFE / UNSAFE / CONDITIONALLY SAFE** + required preconditions.
5. **Destructive Guards**: Definitions of "active room", "active subscription", "last admin" — where is the data located and how to check consistently.
6. **Permissions**: Are existing permissions (`rooms:manage`, `teachers:manage`, `users:manage`, `history:read_all`) adequate? Plan routes use generic `admin` middleware — should they be standardized to `requirePermission`? Detail impacts.
7. **Backward Compatibility**: Inspect all callers of `adminApi.js` and existing tests; list items vulnerable to breakage from PROJECT.md §4 contracts.
8. **Responsiveness**: Audit `adminDashboard.css` + component CSS (currently only 1 breakpoint at 700/760px). List mobile/tablet layout issues (overflow, touch targets, tables).

## Outputs (Files in `admin_crud/analysis/`)
- `risks.md` — table: risk · impact (H/M/L) · likelihood · mitigation · owner.
- `test_matrix.md` — test cases per new endpoint + UI viewport cases.
- `storage_findings.md` — answers to #2, #3, #5, #6.
- `create_user_verdict.md` — answer to #4.
- `compat_report.md` — answers to #1, #7, #8.
- `recommended_changes_to_prd.md` — proposed PRD amendments for Architect decision.

## Rules
- Evidence-based: cite `file:line` for each finding.
- Do not speculate; mark uncertain items as "requires verification" with verification steps.
- Keep concise; do not log or store credentials.
- Conclude by logging a summary in `admin_crud/progress.md`.
