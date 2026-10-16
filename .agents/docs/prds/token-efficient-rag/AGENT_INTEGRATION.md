# Integration for All AI Agents

**Objective:** Ensure every agent, regardless of platform, loads the minimum context first and retrieves the remaining context through a single, consistent protocol.

## 1. Tiered Context

| Tier | Loading Condition | Contents | Target |
|---|---|---|---|
| L0 | Always | Core `AGENTS.md` content: PRD gate (§2), anti-slop rules (§5), and the L1/L2 trigger table | ≤ 1,200 tokens |
| L1 | When triggered | `prd-standard.md` (writing or validating a PRD); §3 (creating files after a PRD is `APPROVED`); `INDEX.md` and §4 (continuing, handing off, or reviewing tasks); layer-specific instructions | Loaded per trigger |
| L2 | As needed | Targeted queries against each namespace with a token budget | 1,500–6,000 tokens per query |

**Measured size:** Header + proposed §1 + §2 + §5 = **897–1,196 tokens**, compared with the current bootstrap size of 6,367–8,489 tokens.

Questions that do not involve code changes should require only L0. Tasks that modify code must still load the relevant L1 context; the savings will be smaller and must be measured rather than assumed.

## 2. Unified Context Retrieval Protocol

1. **Classify the task.** If the task does not modify code and does not require project-specific facts, answer using L0.
2. **Select a namespace** based on the domain (§3). The `shared` namespace must always be included.
3. **Query within a budget** instead of opening entire files. Specify paths, identifiers, or table names whenever available, because lexical retrieval depends on these terms.
4. **Respect retrieval gate results.** If the results are marked `lowConfidence` or `uncertain`, state `Requires Verification`, in accordance with `AGENTS.md` §5. Do not fabricate information.
5. **Reference rather than copy.** Cite chunk IDs or `path:section` references. Do not paste lengthy text into handoffs.
6. **Record context usage in the handoff** using one line:

   `Context loaded: L0 + L1(<trigger>) + L2(<namespace>, ~<token_count> tokens)`

## 3. Domain, Namespace, Agent, and Combo Mapping

Namespaces are logical identifiers used for context retrieval. They do not need to match skill directory names or source-code directory names.

The mappings below are proposed configurations based on the currently documented repository structure. Agent availability is determined by the platform-specific agent definitions, while 9Router combo selection must be verified separately. Proposed mappings do not imply that a combo is already configured or active.

| Flowchart Domain | Namespace | Existing Agent Definitions | Proposed Combo (Unverified) | Context Sources |
|---|---|---|---|---|
| Frontend | `frontend` | `.claude/agents/frontend-specialist.md`; `.github/agents/frontend-specialist.agent.md` | `fast-coder-combo`; use a vision-capable combo only when visual analysis is required | `.agents/skills/skill-frontend/SKILL.md`, `.kiro/steering/frontend.md`, relevant frontend documentation |
| Backend | `backend` | `.claude/agents/backend-specialist.md`; `.github/agents/backend-specialist.agent.md` | `fast-coder-combo`; `architect-reviewer-combo` for architecture reviews | `.agents/skills/skill-backend/SKILL.md`, `.kiro/steering/backend.md`, relevant backend documentation |
| SQL / NoSQL | `data` | No dedicated database agent definition is listed in the supplied tree; existing backend specialists may assist when appropriate | `data-scaffold-combo` | `.agents/skills/skill-database/SKILL.md`, `.agents/memory/LESSONS_LEARNED.md`, relevant database documentation |
| Game Development | `gamedev` | `.claude/agents/gamedev-specialist.md`; `.github/agents/gamedev-specialist.agent.md` | `game-logic-combo`; `narrative-creative-combo` for narrative work | `.agents/skills/skill-gamedev/SKILL.md`, `.agents/memory/DECISIONS.MD`, relevant game-development documentation |
| AI Engineering / AI Tools | `ai-tools` | No dedicated AI engineering agent definition is listed in the supplied tree | `architect-reviewer-combo` | `.agents/skills/skill-ai-engineering/SKILL.md`, relevant PRDs in `.agents/docs/prds/` |
| Cross-cutting | `shared` | `.github/agents/gamukis-orchestrator.agent.md`; `.claude/agents/code-reviewer.md`; `.github/agents/code-reviewer.agent.md`; other applicable agents | The lowest-cost combo that satisfies the task's required capabilities | `AGENTS.md`, `.agents/ORCHESTRATION.md`, `.agents/PLATFORMS.md`, `.agents/memory/`, and relevant shared documentation |

### Mapping Rules

1. **Namespace names are logical identifiers.** The RAG implementation must explicitly map each namespace to its source documents.
2. **Skills provide domain instructions.** Use the existing skill directories instead of creating duplicate skills solely to match namespace names.
3. **Agent definitions are platform-specific.** A corresponding agent file on one platform does not prove that the same agent exists or is available on another platform.
4. **Combo mappings are proposals.** Verify combo names and model mappings against the actual 9Router configuration before activation.
5. **Cross-cutting context is shared.** Include shared orchestration, project rules, and relevant memory when required by the retrieval protocol.

### Initial Token Budget per Query

The following are proposed starting budgets, not measured token usage. Tune them during Phase 1 using retrieval quality, context relevance, latency, and actual token usage.

| Query Type | Initial Budget |
|---|---:|
| Simple, narrowly scoped questions | 1,500 tokens |
| Standard domain queries (`frontend`, `backend`, `data`, `gamedev`) | 3,000 tokens |
| Cross-domain architecture or AI engineering queries | 6,000 tokens |

The retrieval implementation may return fewer tokens when sufficient evidence is available. Budgets are maximum targets, not requirements to fill the entire context window.

### Corpus Scope

The initial RAG corpus consists of selected knowledge documents, including skills, project instructions, architecture documentation, PRDs, decisions, and lessons learned.

Source code is excluded from the initial knowledge-document index unless explicitly configured otherwise. Agents must use their native file-reading and search tools to inspect implementation code, verify behavior, and validate changes.

### Verification Status

The repository tree confirms the presence of the listed skill directories and platform-specific agent definition files. It does not establish that the proposed combos exist, that every platform automatically loads the referenced files, or that the proposed namespace indexes have already been implemented.

Configuration-specific findings, including missing agent mappings, invalid frontmatter, duplicate content, and measured content-overlap percentages, must be documented separately after inspecting the relevant files and reproducing the checks.

## 4. How Each Platform Accesses L2

L0 and L1 are already accessible to all platforms through files they read. Platform-specific conventions must be verified in `.agents/PLATFORMS.md`. The primary difference is how each platform accesses L2.

| Platform | L0 | L1 (Skills) | L2 |
|---|---|---|---|
| ChatGPT Codex | `AGENTS.md` | `.agents/skills/` | CLI (shell) |
| GitHub Copilot, VS Code | `AGENTS.md`, personas in `.github/agents/` | `.agents/skills/` | CLI or MCP |
| GitHub Copilot, cloud agent and CLI | `AGENTS.md` | `.github/skills/` (copies) | CLI |
| Antigravity | `AGENTS.md`, `GEMINI.md` | `.agents/skills/` | CLI or MCP |
| Claude Code | `CLAUDE.md` → `@AGENTS.md` | `.claude/skills/` (copies) | CLI or MCP |
| Hermes | `AGENTS.md` | `.agents/skills/` | CLI or MCP |
| OpenClaw | `AGENTS.md` in the workspace | `.agents/skills/` | CLI or MCP |
| Kilo (`.kilo`) | `AGENTS.md` | — | **Static package**: `kilo.jsonc` sets `runSafeCommands: false`, so each CLI invocation requires manual approval |
| Kiro | `.kiro/steering/*.md` | — | CLI if a terminal is available |
| Chat without tools (e.g., ChatGPT web) | Paste L0 | — | **Static package** for the relevant namespace, pasted by the user |
| n8n / services | — | — | HTTP (Backend route), Phase 3 |

There are four L2 access methods, all calling the same core implementation:

1. **CLI:** `ragQuery` for agents with terminal access (Phase 1).
2. **Static packages:** `.agents/rag/packs/<namespace>.md`, namespace-specific summaries generated from the index, for agents without tools or permission to execute commands (Phase 1).
3. **HTTP route:** A Backend route for product features and other services (Phase 2).
4. **MCP server:** A thin wrapper (Phase 3). This introduces a new dependency and therefore requires separate approval. MCP support will be verified for each platform during Phase 3.

## 5. Draft `rag-context` Skill (Not Yet Active)

This draft is stored here because creating a new skill directory requires an `APPROVED` PRD.

The frontmatter is intended to meet cross-platform requirements: `name` must match the directory name, and `description` must be a single line without a colon followed by a space.

```markdown
---
name: rag-context
description: Use before reading many project documents to answer questions or begin tasks, by loading tiered context and retrieving relevant chunks by domain within a token budget.
---

# RAG Context — Gamukis

1. If the task does not modify code and does not require project-specific facts, answer using the already-loaded L0 context.
2. Determine the namespace: frontend, backend, data, gamedev, or ai-tools. Always include the shared namespace.
3. Retrieve relevant chunks instead of opening entire files:

   node .agents/rag/ragQuery.js --ns <namespace> --q "<question>" --budget 1500

4. If results are marked `lowConfidence` or `uncertain`, state `Requires Verification`. Do not fabricate information.
5. Reference chunk IDs or `path:section`. Do not paste lengthy text.
6. Record the following in the handoff:

   Context loaded: L0 + L1(<trigger>) + L2(<namespace>, ~<token_count> tokens)

7. If command execution is not permitted, ask the user to paste the static package at `.agents/rag/packs/<namespace>.md`.
```

## 6. Agent Definition Maintenance

To ensure all platforms load agent definitions correctly and avoid unnecessary token consumption, see section B of `PROPOSED_CHANGES.md` for the proposed fixes concerning Claude agent frontmatter, duplicate file extensions, `Budi.agent.md`, and `[cite: N]` markers.