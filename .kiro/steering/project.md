
---
inclusion: always
---

# Gamukis — Project Engineering Standards

## 1. Mission

Maintain and improve Gamukis as a reliable web application with frontend, backend, database integrations, and game-related functionality.

Prioritize correctness, security, maintainability, compatibility, and preservation of existing behavior. Do not introduce architectural complexity without a demonstrated need.

## 2. Instruction Precedence

Follow these rules in order:

1. System, platform, and applicable safety requirements.
2. The user's explicit requirements for the current task.
3. The repository's root `AGENTS.md` and applicable local `AGENTS.md` files.
4. Shared workflows in `.agents/ORCHESTRATION.md` and `.agents/PLATFORMS.md`, when present.
5. The relevant skill in `.agents/skills/`.
6. This steering file and the applicable domain steering files.
7. Existing code conventions and general engineering practices.

If two instructions conflict, do not silently combine incompatible requirements. Follow the higher-priority instruction, explain material conflicts, and avoid destructive interpretations.

## 3. Repository Discovery

Before making changes:

1. Confirm the repository root and inspect relevant instructions.
2. Inspect the target files and their direct dependencies.
3. Search for existing implementations before adding new ones.
4. Identify the affected frontend, backend, database, authentication, game, and deployment boundaries.
5. Inspect package scripts and available tests before choosing validation commands.
6. Determine whether the change affects API contracts, stored data, authentication, realtime events, or existing users.

Do not assume a path, dependency, script, environment variable, endpoint, or feature exists merely because it is mentioned in documentation.

## 4. Change Discipline

- Make the smallest coherent change that fully satisfies the request.
- Preserve established architecture unless the task explicitly requires a change or evidence demonstrates a defect.
- Avoid unrelated refactoring, mass renaming, dependency upgrades, and formatting churn.
- Reuse existing services, components, middleware, models, and utilities when appropriate.
- Do not create duplicate implementations of existing functionality.
- Do not add a new orchestrator when an existing workflow already owns task routing.
- Keep public APIs, database schemas, event names, and serialized formats compatible unless a breaking change is explicitly approved.
- Never remove user changes simply to make a patch easier to apply.
- Do not overwrite configuration or documentation without understanding its purpose.

## 5. Accuracy and Uncertainty

Separate verified facts from assumptions.

When repository evidence is insufficient:

- Inspect more files or search for usage.
- Choose a conservative, reversible implementation where possible.
- Ask a focused question if a missing decision materially changes the implementation or risks data loss.
- Do not invent product requirements, security guarantees, test results, or platform capabilities.

## 6. Bug Prevention

For every code change, consider:

- Normal, boundary, empty, malformed, and unexpected inputs.
- Missing values, incorrect types, and invalid state transitions.
- Asynchronous failures, timeouts, retries, duplicate requests, and race conditions.
- Authentication, authorization, validation, and information disclosure.
- Resource cleanup, connection lifecycle, and memory leaks.
- API compatibility and database consistency.
- Realtime event ordering, reconnect behavior, and duplicate delivery where relevant.
- Regression risks and failure recovery.

Apply only the checks relevant to the affected code, but never ignore a known risk simply because the requested change appears small.

## 7. Security and Secrets

- Never expose passwords, API keys, access tokens, private keys, or production credentials.
- Do not read, print, or modify real secret values unless explicitly necessary and authorized.
- Treat `.env.example` as documentation, not as proof that runtime configuration is correct.
- Validate untrusted inputs at system boundaries.
- Use parameterized database queries and established authentication middleware.
- Enforce authorization on the server; frontend checks are not security boundaries.
- Avoid logging sensitive data.
- Do not disable security controls merely to make a test pass.

## 8. Validation

After implementation:

1. Inspect the final diff.
2. Run the narrowest relevant available tests.
3. Run relevant lint, type-check, build, or integration checks when configured.
4. Verify affected callers and interfaces.
5. Review error handling and likely regressions.
6. Report commands that were run and their actual results.

Never claim a test, build, deployment, or manual verification succeeded unless it was actually executed and the result was observed.

If a check cannot run, state why and identify the remaining risk.

## 9. Completion Report

Provide a concise report containing:

- Summary of the change.
- Files changed.
- Important design decisions.
- Tests and checks actually executed.
- Results, failures, and unverified areas.
- Known limitations or follow-up work.

Do not report a task as fully verified when critical checks remain outstanding.
