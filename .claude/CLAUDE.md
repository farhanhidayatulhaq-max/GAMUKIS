
# Gamukis — Claude Code Project Instructions

## Mission

Implement, debug, review, and maintain Gamukis with high correctness, minimal unintended changes, strong security practices, and explicit verification.

## Instruction Loading

Before acting:

1. Read the root `AGENTS.md`, if present.
2. Follow the shared workflow in `.agents/ORCHESTRATION.md` and `.agents/PLATFORMS.md`, if present.
3. Read the applicable skill in `.agents/skills/`.
4. Inspect relevant source files, callers, configuration, and tests.
5. Follow the applicable domain instructions in `.kiro/steering/` only when useful and compatible with the current task.

Do not assume that a referenced file exists. Confirm its presence before relying on it.

## Project Context

Gamukis contains a React frontend and a Node.js backend, with database integrations and realtime game functionality.

Known backend areas include:

- `Backend/src/config/`
- `Backend/src/controllers/`
- `Backend/src/middlewares/`
- `Backend/src/models/`
- `Backend/src/routes/`
- `Backend/src/services/`
- `Backend/src/Database/`

The frontend may include React pages, routes, Firebase integration, and realtime game interfaces.

Treat this list as an initial map. Inspect the current repository before editing.

## Mandatory Engineering Rules

- Understand the existing implementation before proposing a replacement.
- Make the smallest coherent change that satisfies the request.
- Preserve existing architecture, public APIs, database contracts, and realtime event contracts unless the task requires a deliberate change.
- Reuse existing utilities and dependencies where appropriate.
- Avoid unrelated refactoring and duplicate implementations.
- Validate all untrusted inputs at system boundaries.
- Enforce authorization on the server.
- Never expose secrets or privileged credentials.
- Handle asynchronous failures, resource cleanup, and invalid states explicitly.
- Consider race conditions, duplicate requests, stale events, and reconnect behavior when relevant.
- Do not disable security controls to bypass errors.
- Do not execute destructive operations without explicit authorization and a safe recovery plan.

## Investigation Before Editing

For each task:

1. Identify the expected behavior and acceptance criteria.
2. Locate the relevant implementation and all important callers.
3. Trace data flow across frontend, backend, and persistence when necessary.
4. Identify edge cases and regression risks.
5. Determine the narrowest relevant tests and validation commands.
6. Implement only after the scope and constraints are understood.

Ask a focused question when a missing requirement materially affects safety, correctness, or compatibility. Otherwise, proceed with clearly stated and conservative assumptions.

## Testing and Verification

Inspect package manifests and available scripts before executing commands.

Run the most relevant available checks, such as focused tests, linting, type checks, builds, or integration tests.

Do not claim a check passed unless it actually ran and produced a successful result. Do not treat code inspection as proof of runtime behavior.

If tests cannot run, report the exact blocker and remaining uncertainty.

## Delegation

Use a specialized subagent only when its expertise or independent analysis provides a meaningful benefit.

- Keep delegated tasks narrow and non-overlapping.
- Specify relevant files, constraints, expected output, and validation requirements.
- Avoid parallel modifications to the same files.
- Review delegated findings and patches before accepting them.
- Do not create a second orchestrator if an existing repository workflow already handles routing.

## Completion Report

Summarize:

- Changes made and files affected.
- Important implementation decisions.
- Tests and checks actually run.
- Failures and environmental blockers.
- Remaining risks and unverified behavior.

Never claim that the entire project is bug-free or that an unexecuted test passed.
