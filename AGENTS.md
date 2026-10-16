# AGENTS.md — UNIVERSAL AI AGENT CONSTITUTION (SSOT)

> **IDENTITY & SCOPE**:
> This file is the **Single Source of Truth (SSOT)** for all AI Coding Agents operating in this repository (including but not limited to: **Antigravity, GitHub Copilot, Kiro, ChatGPT Codex, Claude Code, Hermes AI, and OpenClaw**).
> Every Agent MUST comply with the rules below. Context is loaded **in tiers** (§1) to conserve tokens; the PRD gate (§2) and anti-slop protocol (§5) always apply.

---

## 1. TIERED BOOTSTRAP PROTOCOL (TOKEN-EFFICIENT)

Load context in stages according to task type. Do not read all documents in every prompt.

| Tier | Loaded when | Content |
| :--- | :--- | :--- |
| L0 | Always | This file: PRD gate (§2), summary flow (§3), multi-agent protocol (§4), anti-slop (§5) |
| L1 | Based on task type | Supporting documents listed in the trigger table below |
| L2 | As needed | For large documents, search for and read only the relevant sections (headings, lines, or related functions), not the entire file |

### L1 Triggers

| Task Type | Load |
| :--- | :--- |
| Questions, explanations, or discussions without code changes | L0 Sufficient |
| Modifying code or creating files | Related PRDs in `.agents/docs/prds/` (check status and the File & Folder Blueprint per §2). After `APPROVED`: `.agents/docs/creation-flow.md`. Also `.agents/teamwork/INDEX.md` to check active tasks and update status. Then the rules for the layer below |
| Writing or validating PRDs | `.agents/docs/prd-standard.md`, `.agents/memory/`, and `.agents/docs/directory-blueprint.md` (if present) or check the existing folder structure to ensure it does not violate the architecture |
| Continue tasks, dispatch, handoff, or review | `.agents/teamwork/INDEX.md` and the skills in §4 |

**Layer rules** (apply according to the scope of the task, if the files exist):
- Backend $\rightarrow$ `.github/instructions/backend.instructions.md`
- Frontend $\rightarrow$ `.github/instructions/frontend.instructions.md`
- Team Coordination/Multi-Agent $\rightarrow$ `.github/instructions/teamwork.instructions.md`

---

## 2. STRICT PRD-FIRST GATEKEEPER (`gamukis-prd-guard`)

You operate under the rules of **Strict PRD-Driven Development**.

### 2.1 Absolute Blocking Conditions (HARD BLOCK)
You are **strictly prohibited** from creating new code files, modifying feature logic, or creating new folders when:
- There is no relevant PRD document in `.agents/docs/prds/` (or in the location specified by the user).
- The PRD status is still `DRAFT` or `REVIEW` rather than `APPROVED`.
- The PRD does not include a **File & Folder Blueprint** section detailing the full path of every file that will be created or changed.

### 2.2 Actions When a Hard Block Is Triggered
If the user asks to create a feature directly without an approved PRD:
1. **Politely reject the implementation request.**
2. Run the protocol in `.agents/skills/gamukis-prd-guard/SKILL.md`.
3. Offer to draft a PRD first according to `.agents/docs/prd-standard.md`, including a table describing the planned files and folders.
4. Wait for the user to confirm `APPROVED` before beginning any code changes.

### 2.3 Fast-Track Hotfix Exception (PRD-Guard Bypass)
PRD requirements and the hard block are bypassed ONLY when:
- The user prompt explicitly includes `[HOTFIX]`, `[DEBUG]`, `[SPIKE]`, or `[QUICKFIX]`.
- OR the task is a minor scoped change (e.g., typos, isolated styling adjustments, or single-line bug fixes $\le 3$ lines) that introduces no new architecture, database schemas, or external endpoints.
- In hotfix mode, modify only the targeted lines, perform immediate test/build verification, and record the change in `.agents/templates/PROGRESS.md` or `.agents/teamwork/INDEX.md` without drafting a full PRD.

---

## 3. FILE & FOLDER CREATION PROCESS (SUMMARY)

Applies once the PRD has an `APPROVED` status. Strict rules that always apply:
- **Zero-Improvisation**: Create only the folders and files explicitly listed in the **File & Folder Blueprint** in the PRD.
- **No Unplanned Helpers**: Do not create `utils/`, `helpers/`, `common/`, or `temp/` directories outside of what is agreed upon in the PRD. If additional files are needed, pause the process and request approval to update the PRD.
- **Bottom-Up Sequence**: contracts and schemas → core logic (repository/service) → interfaces (controller/route/API client) → presentation and state (frontend) → testing and state documentation.

Complete rules (naming conventions and steps for each stage): `.agents/docs/creation-flow.md`, refer to `.agents/ORCHESTRATION.md`.

---

## 4. MULTI-AGENT PROTOCOL & PLATFORM SWITCHING (ZERO-MIGRATION)

Users can switch between AI Agents (e.g., Claude Code, Copilot, Kiro, Antigravity, or OpenClaw) at any time. Use:

| When | Use |
| :--- | :--- |
| Starting a new task | `.agents/skills/teamwork-dispatch/SKILL.md` and `.agents/templates/DISPATCH.md` to break down the PRD blueprint into a checklist of measurable files |
| Working on a task | `.agents/templates/PROGRESS.md`: record every file that has been created or modified so that no other agent overwrites it |
| Ending a session or requested handoff | `.agents/skills/teamwork-review/SKILL.md` to validate that 100% of the files comply with the PRD; then `.agents/skills/teamwork-handoff/SKILL.md` and `.agents/templates/HANDOFF.md`, and update `.agents/teamwork/INDEX.md` |

---

## 5. ANTI-SLOP & ANTI-HALLUCINATION PROTOCOL (MUST BE FOLLOWED)

1. **Do Not Guess Code (Read-Before-Write)**:
   - DO NOT assume the contents of files, function names, or table schemas without first reading the active source files in `Frontend/src/` or `Backend/src/`.
   - If a condition cannot be confirmed (e.g., requires a live DB connection or a login session), explicitly state it as `Requires Verification` — do not make false claims.

2. **No Sloppy or Monolithic Code**:
   - Adhere to the structure of `.agents/docs/prd-standard.md`. Break down UI components into `atoms/` and `molecules/`, reuse existing shared components, and do not stack multiple components into a single `index.js` file.
   - Maintain *backward compatibility* (do not remove old API response keys or break existing routes).

3. **Do Not Claim “Done” Without Evidence-Based Verification**:
   - Every code change MUST be verified by running the relevant tests (`npm test`) and `npm run build`.
   - Record the exact commands executed along with the number of tests that passed in the `handoff.md` / `progress.md` report. Without proof of execution, the status will be limited to `FIXED-UNVERIFIED`.

---

## 6. BILINGUAL INTERACTION & LANGUAGE PROTOCOL

1. **User Communication (Prompt Matching)**:
   - Always converse and respond to the user in the language of their prompt (e.g., if the user prompts in Indonesian, answer in natural, clear Indonesian; if in English, answer in English).
2. **Developer-Facing Artifacts & Code (Strict English SSOT)**:
   - All developer-maintained artifacts—including source code, variable names, functions, docstrings, inline code comments, git commit messages, PRD specifications, and task tracking records—MUST remain strictly in professional technical English.
3. **User-Facing Localization & Data Preservation**:
   - Never translate user-facing localization files (`9router/public/i18n/literals/*.json`), external datasets, or verbatim historical user prompts unless explicitly authorized.
