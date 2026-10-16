# Gamukis Agent Orchestration Rules

Applies to all agents operating in this project: ChatGPT Codex, Antigravity, GitHub Copilot, OpenClaw, Claude Code, and others. These rules are independent of any single platform's proprietary features. Instructions on how each platform loads them can be found in `PLATFORMS.md`.

## Document Precedence

1. User instructions for the active task.
2. The latest PRD/brief explicitly applicable to the task.
3. Project rules in `.kiro/steering/project.md`, `.kiro/steering/frontend.md`, and `.kiro/steering/backend.md`.
4. These orchestration rules and `AGENTS.md`.
5. Task-specific dispatch or handoff documents in `.agents/teamwork/`.

A specific dispatch governs the scope and verified facts of its assigned task, but legacy restrictions or past ownership do not automatically apply to subsequent tasks. In case of conflict, do not overwrite files owned by another agent; request that the lead designate an updated sequence or revised file boundaries.

---

## 1. Capability-Based Roles (Role Definitions)

Roles attach to the **active task**, NOT to the brand or name of the AI Agent. All AI Agents (Antigravity, GitHub Copilot, Kiro, ChatGPT Codex, Claude Code, Hermes AI, OpenClaw) have equal standing and capability to assume any role below:

| Role | Primary Responsibility | Mandatory Output |
| :--- | :--- | :--- |
| **Architect** | Drafts PRDs, API contracts, database schemas, and the **File & Folder Blueprint** | PRD document with `APPROVED` status |
| **Lead / Integrator** | Deconstructs PRD into `INDEX.md`, allocates tasks, and integrates outputs | Updates in `.agents/teamwork/INDEX.md` |
| **Core Engineer** | Implements Backend & core logic (models, repositories, services, controllers, routes, state/hooks) | Code files adhering to Steps 1–6 in the PRD |
| **UI Engineer** | Implements display components, pages, styling, and accessibility | UI files adhering to Steps 7–10 in the PRD Blueprint |
| **Analyst / Reviewer** | Validates created files against the PRD (`teamwork-review`), writes & executes tests | Review report & test results |
| **Operator** | Records progress (`PROGRESS.md`) and compiles handoffs (`HANDOFF.md`) at session close | Latest handoff log entry |

---

## 2. Flexible Operating Modes (Solo vs. Multi-Agent Mode)

Before starting work, every Agent MUST inspect `.agents/teamwork/INDEX.md` to determine its operating mode automatically:

### Mode A: SOLO AGENT MODE (Default — when only 1 Agent is active)
When the user directs feature implementation directly and no sub-agent breakdown is defined in `INDEX.md`:
- **Full-Stack Execution**: The currently active Agent **automatically assumes all roles sequentially**:
  1. Acts as **Architect** (drafts/validates PRD & folder blueprint schema).
  2. Acts as **Core Engineer & UI Engineer** (creates files from Backend to Frontend in PRD order).
  3. Acts as **Reviewer & Operator** (verifies final results and updates completion status in `INDEX.md`).
- **Tool Failover (Quota Limits)**: If the current Agent's quota is exhausted mid-task and the user switches to a different Agent, the new Agent immediately takes over all remaining responsibilities by continuing the checklist in `INDEX.md`.

### Mode B: MULTI-AGENT / TEAM MODE (Active when > 1 Agent is utilized)
When the user runs more than one Agent (either in parallel across distinct features or divided by architectural layer on the same feature):
- **Scope Isolation (Feature / Layer Division)**:
  Each Agent may touch only the file list assigned to it in the `DISPATCH` table within `.agents/teamwork/INDEX.md`.
  - *Scenario 1 (Different Features)*: Agent A handles all files for `FEAT-001`, while Agent B handles all files for `FEAT-002`.
  - *Scenario 2 (Single Feature, Layered Roles)*: Agent A acts as **Core Engineer** (modifying only files in `Backend/`), while Agent B acts as **UI Engineer** (modifying only files in `Frontend/`).
- **Anti-Collision Rule (File Locking)**:
  It is STRICTLY PROHIBITED to edit or create files marked with `IN_PROGRESS` status by another Agent in `.agents/teamwork/INDEX.md`.

Agent identity does not alter security rules, PRD requirements, or project conventions.

---

## Collaboration Principles

- An agent may assist at any appropriate stage: exploration, PRD mapping, solution design, implementation, review, documentation, or verification.
- Before beginning, read the active PRD, project rules, latest brief/handoff, and git diff status in the target area.
- Every task must yield an inspectable outcome: findings with `path:line` references, modified files, contract decisions, or verification results. Avoid open-ended tasks such as "do everything".
- Exactly one lead/integrator per collaborative task.
- Work division follows non-overlapping PRD slices rather than agent quotas. A single agent should complete the entire task if parallelization merely increases collision risk.
- Never assume another agent has been notified or accepted a task. Do not mark tasks as "accepted" until explicit written confirmation appears in the progress log.

## Flexible Task Breakdown

| Focus | Example Contributions |
| :--- | :--- |
| Analysis | Locates active PRDs, traces structure, inspects contracts and dependencies, identifies risks/gaps |
| Product / UX | Translates requirements into user flows, state diagrams, acceptance criteria, and UI recommendations conforming to Gamukis |
| Frontend | Pages, components, styling, routing, and API clients in relevant frontend folders |
| Backend | Routes, validation, auth/permissions, models, services, and database integrations |
| Review / Verification | Reviews diffs against PRD, checks integration integrity, runs permitted tests, reports gaps |
| Documentation | Updates PRDs, handoffs, requirement matrices, or architectural decision logs that materially changed |

## File Boundaries & Synchronization

- Before dispatch, the lead specifies permitted files/folders, files owned by other agents, dependencies, and who integrates the final result.
- Agents may work in parallel if files are disjoint or changes can be isolated cleanly. For shared files, select a single owner or define explicit turns.
- Do not overwrite, reset, move, or delete changes outside your assigned task. Inspect git status/diff before editing and before integration.
- Cross-boundary needs (e.g., an API contract change requiring simultaneous frontend and backend updates) must be proposed to the lead as a new allocation; do not expand scope silently.
- The integrator reviews the combined diff, ensures all requirements remain satisfied, and resolves conflicts explicitly.

## When Direct Channels Are Unavailable

Many AI sessions cannot message other agents directly, and sessions may terminate unexpectedly (quota exhaustion, restarts). Therefore, task state resides in files, not in ephemeral chat history:

- Dispatches, progress, and handoffs are recorded in `.agents/teamwork/<task>/` using `templates/`.
- `teamwork/INDEX.md` is the single authoritative registry of tasks and statuses. Update it whenever status changes.
- Provide sufficient context so that another agent can resume work without reading past conversation transcripts: objective, decisions, files, verification commands, and next steps.
- Sign every entry with `agent · model · timestamp`. A single handoff file shared among multiple agents must clearly indicate who wrote each section.
- Handoff logs are append-only. Corrections must be written as new entries.
- Always use paths relative to the repository root.

## Dispatch Format

Use `templates/DISPATCH.md`. Small tasks may be abbreviated, but must still explicitly specify the objective, deliverables, and ownership boundaries.

## Handoffs and Reporting

Every agent concluding or handing over work must document (see `templates/HANDOFF.md`):

- summary of achievements and key decisions;
- list of changed files (or `path:line` references for read-only findings);
- addressed PRD requirements;
- verified commands actually executed along with exact results;
- incomplete items, assumptions, and dependencies for the next agent.

Status vocabulary: `draft`, `ready`, `in-progress`, `blocked`, `review`, `done`, `superseded`.

## Final Review

- Inspect the integrated diff against the PRD, project structure, cross-service contracts, auth/permissions, and existing features.
- Verify against active repository paths, not copies in scratch or temporary folders. Past reviews have rejected submissions because tested files differed from active source files.
- Treat agent claims ("tests passing", "completed") as unconfirmed findings until verified against source evidence.
- Execute only checks authorized by task instructions. Document unperformed checks as "unverified" without asserting success.
- Deliver a concise summary to the user: scope, primary files, verification evidence, and remaining constraints.

---

## Gamukis PRD Directory Standards & Workflow

Relocated to `docs/prd-standard.md` (retaining original section numbering §1–§3). Legacy references such as "ORCHESTRATION §2" continue to correspond to §2 in that document.
