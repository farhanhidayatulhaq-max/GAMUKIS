---
name: teamwork-review
description: Use for final review or integration of one or more agents' outputs, validating combined diffs against PRD requirements, contracts, auth and permissions, and regressions, then reporting an APPROVE or REQUEST_CHANGES verdict.
---

# Teamwork Review

1. Gather context: task PRD/brief, `DISPATCH.md`, all related `handoff.md` files, and the combined diff (not per-agent diffs).
2. Verify against active repository paths. Do not review copies in scratch or temporary directories; record any discrepancies between such copies and active files.
3. Verify that:
   - Every PRD requirement is satisfied, backed by `path:line` evidence or verification results.
   - Cross-service contracts have not changed without an Architect decision; legacy routes and response keys remain intact.
   - Auth and permissions: administrative actions route through `authenticateAny` + `requirePermission`; validation occurs on the server; teachers are not elevated to admin privileges.
   - Project invariants in the `gamukis-prd-guard` skill are strictly respected.
   - No modifications from other agents were overwritten, no credentials were leaked, and no files outside dispatch boundaries were touched.
4. Execute only checks permitted by the task. Mark unexecuted checks as "not executed"; never infer that unrun tests passed.
5. Treat agent claims ("tests passing", "complete") as unverified findings until corroborated with source evidence.
6. Report in the reviewer's `handoff.md` adhering to this structure:
   - **Verdict:** `APPROVE` or `REQUEST_CHANGES`
   - **Blockers** (each item: `path:line`, issue description, expected remediation)
   - **Non-blockers**
   - **Verification:** executed / not executed
   - **Constraints:** aspects requiring live services (MySQL, Firebase, Midtrans) or active authenticated sessions
7. The lead updates `teamwork/INDEX.md` following the verdict. "Done" reported by an individual agent does not indicate completed integration.
