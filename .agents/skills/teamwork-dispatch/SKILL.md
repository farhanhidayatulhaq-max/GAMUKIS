---
name: teamwork-dispatch
description: Use when delegating or accepting cross-agent tasks (Codex, Antigravity, Copilot, OpenClaw, etc.), writing DISPATCH files, establishing file boundaries and ownership, or verifying dispatch completeness before starting work.
---

# Teamwork Dispatch

## Delegating a Task (Lead)
1. Copy `.agents/templates/DISPATCH.md` to `.agents/teamwork/<task-name>/DISPATCH.md`.
2. Complete all sections. The three most commonly omitted sections with the highest downstream cost:
   - **Allowed to modify** and **Owned by another agent**: a single file must have only one owner at any given time.
   - **Deliverables**: must be inspectable (files, findings with `path:line` numbers, contract decisions, verification results). "Implement everything" is not an acceptable deliverable.
   - **Verification**: specify commands permitted to run and checks that must NOT be executed.
3. Assign the recipient's role based on capability rather than agent brand. Refer to `.agents/ORCHESTRATION.md`.
4. Add or update the task entry row in `.agents/teamwork/INDEX.md`.
5. If direct communication channels are absent, the dispatch file is the sole delivery mechanism. Do not mark "accepted" until the recipient confirms receipt in `progress.md`.

## Accepting a Task
1. Read `AGENTS.md`, `DISPATCH.md`, followed by the latest `handoff.md` and `progress.md` in the task directory.
2. Inspect the git status and diff within the assigned file boundary.
3. If discrepancies or ambiguities exist (contracts, ownership, scope), record the questions in `handoff.md` and halt that specific branch. Do not broaden scope or unilaterally alter contracts.
4. Record formal acceptance in `progress.md` signed as `agent · model · date`.

## Small Tasks
Dispatches may be concise, but must still explicitly state the objective, deliverables, and ownership boundaries.
