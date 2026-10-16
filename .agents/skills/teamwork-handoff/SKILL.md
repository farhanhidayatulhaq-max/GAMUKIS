---
name: teamwork-handoff
description: Use when handing off work, reporting results, or resuming another agent's work, writing progress and handoffs with verification evidence and reconciling stale status before editing.
---

# Teamwork Handoff

## Before Resuming Another Agent's Work
Status in `progress.md` and `PROJECT.md` frequently lags behind the actual code. Reconcile first:
1. Read `.agents/teamwork/INDEX.md`, then the task's `DISPATCH.md`, `progress.md`, and `handoff.md`.
2. Inspect git status and diff. Treat existing modifications as belonging to another agent unless the dispatch explicitly states otherwise.
3. Compare document claims against actual code. Run permitted quick smoke checks if needed.
4. Record any discrepancies as a new entry. Never overwrite historical entries.

## Writing Handoffs
Use `.agents/templates/HANDOFF.md` and append new entries to the bottom (append-only):
- Sign: `agent · model · date`. Never write on behalf of another agent, even when relaying user requests.
- List modified files along with justifications. For read-only findings, provide `path:line` references.
- Verification: specify exact commands executed and actual output (passed/failed counts). Note unperformed checks as "not executed" with rationale.
- Separate verified facts from hypotheses.
- Conclude with the first actionable step for the subsequent agent and files requiring priority reading.

## Writing Progress
First line: `Status: <draft|ready|in-progress|blocked|review|done|superseded>`. Update the task row in `teamwork/INDEX.md` when the status changes.

## Prohibitions
- Machine-specific absolute paths (starting with Windows drive letters or home directories): use relative paths from repository root.
- Credentials, tokens, or passwords, including in command examples. Use placeholders such as `<MYSQL_PASSWORD>`.
- Copying raw chat logs. Record only current status and active decisions.
