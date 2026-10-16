# Collaboration Task Index

This is the single source list of tasks and their status. Update the row when the status changes (with the responsible lead/integrator).

Status vocabulary: `draft`, `ready`, `in-progress`, `blocked`, `review`, `done`, `superseded`, plus `stale` for notes that conflict with other records or with the code.

> The rows below were created on 13 October 2026 from the contents of the file (the last snapshot changed on 11 October 2026 at 23:56). The “Status” column is an inference from the document, not a verification against the code. Confirm with the lead before moving or archiving anything.

## Active or unfinished tasks

| Entry | Topic | Agent | Status | Evidence and reconciliation notes |
|---|---|---|---|---|
| `sprite-preview-fixes` | Character preview Skill 1, Hair Model 2 Walk anchoring, and shirt Idle/Walk alignment | Codex | `done` | Approved PRD at `.agents/docs/prds/sprite-preview-fixes/PRD.md`; original Idle shirt anchors are restored, Walk mirrors them, and unsupported shirt row remapping remains removed. `npm test -- --watchAll=false --runInBand --runTestsByPath src/__tests__/game/character_customization_walk_skill.test.js` passed 46/46; `npm run build` succeeded with five unrelated ESLint warnings |
| `sprite-preview-regression-audit` | Detail audit and repair of Idle, Walk, and Skill 1 character preview layout and coordinates | Antigravity | `done` | Preserved Idle offsets intact; unified Walk and Skill 1 layer transforms (`scale(1.1)`); enabled `walk-head` animated sheet; eliminated duplicate idle hands during actions; synchronized walk hair animation duration (0.8s); suppressed base body layer when clothed to eliminate clipping. `npm test` passed 46/46; `npm run build` succeeded (0 errors). |
| `admin_crud` | Admin dashboard CRUD upgrade | Codex (Architect), Antigravity (lead/core), Copilot (UI), ChatGPT (Analyst) | `in-progress` | M4 completed (shared component, 8 tests). M0–M3 have no recorded results; Antigravity and Copilot acceptance has not been confirmed; M5 is waiting on M3. `RULES.md` references `QUESTIONS_TO_ARCHITECT.md` and `analysis/`, but neither exists |
| `orchestrator_1` | Membership (plans, dashboard, API client) | Antigravity | `in-progress` | M1–M4 are complete; M5 (Tier 5 forensic audit) is in progress. Cross-agent logs report continued work and state that Tier 5 has not yet been closed |
| `orchestrator_3` | Game: walking animation, custom avatar, repeated questions, server-authoritative damage | Antigravity, Codex | `stale` | The milestone checklist in `progress.md` is unchecked, even though the lower section reports work as completed (Backend 35 tests, Frontend 219 tests) and one manual test remains open. Reconcile the checklist with the “Update” section |
| `COPILOT_TO_CHATGPTCODEX_TO_ANTIGRAVITY.md` | Membership and game phase handoff log | Copilot, Codex, Antigravity | `stale` | One file contains three agents and the identities are mixed (“Copilot (Codex)”). The first entry has been superseded by the lower entry (for example, 35 tests skipped → 105 passed). Read from the bottom up |
| `COPILOT_ROLE_API_TASK.md` | Teacher role selection before access to teacher APIs | Copilot | `ready` | Dispatch only; no results recorded |
| `ANTIGRAVITY_MYSQL_COLLATION_SUPPORT.md` | Diagnosis of `Illegal mix of collations` on startup | Copilot → Antigravity | `review` | Read-only. The next diagnostic step has not been run (requires restarting `npm run dev` and reading the first MySQL log) |

## Antigravity subagents (`teamwork_preview_*`)

The parent is determined from the date and contents of `DISPATCH.md`; confirm if needed.

| Entry | Parent | Status | Notes |
|---|---|---|---|
| `explorer_survey_backend` | orchestrator_1 | `done` | `backend_survey.md` and handoff exist |
| `explorer_survey_frontend` | orchestrator_1 | `done` | `frontend_survey.md` and handoff exist |
| `spec_miner_survey` | orchestrator_1 | `done` | `spec_survey.md`, handoff. The handoff includes a local database password in the example command (see `agents.mjs normalize`) |
| `test_writer_e2e` | orchestrator_1 | `done` | 105 tests; `TEST_READY.md` |
| `worker_m1_api` | orchestrator_1 | `done` | `membershipApi.js` complete |
| `worker_m2_plans` | orchestrator_1 | `stale` | `progress.md` still says “In Progress”, while the Plans page is already accepted as the current implementation |
| `worker_m3_dashboard` | orchestrator_1 | `stale` | `progress.md` shows all items unchecked, while the Dashboard has already been accepted |
| `orchestrator_2` | (initial game session) | `stale` | `progress.md` states “Gate: FAIL / INTEGRITY VIOLATION” for M1, while `GATE_STATUS.md` states “ready for Milestone 1”. Replaced by `orchestrator_3`? Needs confirmation |
| `explorer_game_survey_1` | orchestrator_2 | `done` | `analysis.md`, handoff; message to the orchestrator has not yet been sent |
| `explorer_game_survey_2` | orchestrator_2 | `stale` | “In Progress”; no `analysis.md` or `handoff.md` |
| `explorer_game_survey_3` | orchestrator_2 | `done` | `analysis.md`, handoff |
| `worker_game_m1` | orchestrator_2 | `stale` | All implementation steps remain unchecked; no handoff |
| `explorer_survey_anim` | orchestrator_3 | `stale` | “In progress”; only `BRIEFING`, `DISPATCH`, and `progress` exist, with no `report.md` |
| `explorer_survey_custom` | orchestrator_3 | `done` | `report.md` exists |
| `explorer_survey_questions` | orchestrator_3 | `done` | `report.md` exists |
| `spec_miner_survey_reqs` | orchestrator_3 | `stale` | Only `DISPATCH.md`; no result |
| `challenger_2_questions_redis` | orchestrator_3 | `done` | Verdict `APPROVE` |
| `auditor_integrity_verification` | orchestrator_3 | `done` | Verdict `CLEAN` |
| `reviewer_final_gate` | orchestrator_3 | `review` | Verdict `REQUEST_CHANGES`: the files tested in the scratch folder differ from the active files, and the history-save failure was swallowed. Codex was updated in `orchestrator_3/progress.md` and now states that the failure holds the reset and provides a retry; no re-verification has been performed by the reviewer |

## Top-level coordination files

| Entry | Function | Notes |
|---|---|---|
| `BRIEFING.md` | Briefing Sentinel (Antigravity) | Contains conversation IDs and cron entries canceled due to quota. Reference only |
| `handoff.md` | Handoff Sentinel | Reference only |
| `ORIGINAL_REQUEST.md` | Original user request (verbatim) | Source of truth for game and membership requirement R1–R3. Do not edit |

## Maintenance rules

- New tasks: copy from `../templates/`, create a `teamwork/<task-name>/` folder, and add a row to the first table.
- Tasks marked `done` and already integrated may be moved to `teamwork/_archive/` only after the lead confirms and references this entry. Do not move folders still referenced by active dispatches.
- `node scripts/agents.mjs check` ensures every entry in this folder is listed here.
