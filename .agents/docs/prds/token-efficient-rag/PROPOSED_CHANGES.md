# Proposed Changes (NOT IMPLEMENTED)

None of the files listed below are modified by this package. Section A amends the agent constitution and requires separate approval. Section C stands on its own and should be addressed **now**, without waiting for the PRD.

## A. Token Savings

### A1. `AGENTS.md` §1 becomes nested

Replacement text (`reference/proposed_section1.md`, 208–278 tokens):

```markdown
## 1. BOOTSTRAP PROTOCOL (STAGED, TOKEN-EFFICIENT)

Load the context in stages. Do not read all documents at every prompt.

| Tier | Loaded when | Contents |
| :--- | :--- | :--- |
| L0 | Always | This file: PRD gateway (§2) and anti-slop (§5) |
| L1 | On trigger | Writing or validating the PRD: `.agents/docs/prd-standard.md`. Create files after the PRD is `APPROVED`: §3. Continue, assign, or review tasks: `.agents/teamwork/INDEX.md` and §4. Interact with the Backend or Frontend: `.github/instructions/<layer>.instructions.md` |
| L2 | As needed | Targeted queries: `node .agents/rag/ragQuery.js --ns <namespace> --q “<question>” --budget 1500`. Without a shell: request relevant document snippets, not the entire file |

General questions that do not require code changes can be answered with L0.
```

Implementation order: The L2 line refers to the CLI, which will be available after Phase 1. Before then, implement the version without the L2 line (L0 + L1 only); the greatest savings (not loading `prd-standard.md` and `INDEX.md` in every prompt) are already achieved with L0 + L1.

### A2. Move sections 3 and 4 of `AGENTS.md` to L1

Section 3 (497–662 tokens) is only relevant when creating files after the PRD is `APPROVED`. Section 4 (262–349 tokens) repeats the contents of the `teamwork-*` skill. Leave a single reference line for each.

### A3. `GEMINI.md` and `.claude/CLAUDE.md`

Replace “must read all three files in full before answering anything” with “load L0; load L1 according to the trigger in `AGENTS.md` §1.”

### A4. Split `prd-standard.md` (13,345 characters, 3,336–4,448 tokens)

Separate the PRD validity core and the §4 sequence table (L1) from the feature flows in §2 and §3 (retrieved via L2 per the `gamedev` and `backend` namespaces). At the same time, remove the remaining pasted text (“And in **Table §4.1 ...** the order becomes:”) and align the “§4.1” reference with the existing section title.

## B. Clarity and Validity of the Agent Definition

| # | Findings | Recommendations |
|---|---|---|
| B1 | `.github/agents/Budi.agent.md`: frontmatter is not closed; 47% of the content is identical to `Nika.agent.md` | Close the frontmatter. The owner should decide: merge it into Nika, or differentiate its role |
| B2 | `.claude/agents/*`: three files lack `name` and `description` in frontmatter. Claude Code subagents require both to be registered | Add frontmatter |
| B3 | `.claude/agents/backend-agent.md.md` has a double file extension | Rename to `backend-agent.md` |
| B4 | `.claude/config.json`: `defaultAgent` and the keys `inspector`, `tilemap`, `combat`, `narrative`, `architect`, `vision` have no corresponding agent files | Create the corresponding agents, or remove unused keys |
| B5 | 37 `[cite: N]` markers in 6 files (Claude memory and agents) | Remove them. Does not change the `VERIFIED-RESOLVED` status |
| B6 | `.agents/memory/DECISIONS.MD` (uppercase extension) vs. reference to `DECISIONS.md` in `prd-standard.md` | Match the filenames. On case-sensitive file systems (Linux, Docker), the reference fails |
| B7 | `AGENTS.md` requires `.github/instructions/{backend,frontend,teamwork}.instructions.md`, but that folder does not exist in the archive | Create the files (available in the previous agent setup package) or remove the requirement |
| B8 | 18 files end with CRLF lines, including `ORCHESTRATION.md` and `README.md` | Add `.gitattributes` with `*.md text eol=lf` |

## C. Security (high priority, regardless of PRD)

| # | Finding | Action |
|---|---|---|
| C1 | `.claude/config.json` contains the **9Router API key in plain text** (`apiKey`). The repository lacks a `.gitignore` file in the root directory | Rotate the key in the 9Router dashboard. Move it to an environment variable (the `NINEROUTER_KEY` convention is already used in `9router/skills/README.md`). Add the file to `.gitignore`. Check the Git history: `git log -S“<key-prefix>” --all` |
| C2 | `9router/data/jwt-secret` and `9router/data/machine-id` (64 bytes each) are included in the archive. `9router/.gitignore` already ignores `data/`, so they aren’t added to Git, but the archive includes them | Do not share the entire archive. If the archive has ever been shared, regenerate the 9Router JWT secret |
| C3 | `.agents/teamwork/_archive/spec_miner_survey/handoff.md` still contains the local database password in the example command | Replace it with a placeholder; rotate the password when used outside the local machine |
| C4 | 62 files in `.agents/`, `.claude/`, `.github/`, `.kiro/` contain the absolute path `C:\Users\...`; `.kilo/kilo.jsonc` locks access to the same absolute path | Replace with relative paths. `.kilo/` must not be modified by agents (restricted zone), so the owner must make changes |
| C5 | RAG indexes risk containing the secrets listed above | FR-16 PRD: allowlist document files, blocklist `config.json`/`.env*`, scan for credentials before chunks are saved |

Key and secret values are **not** copied to this package.

## D. Platform

| # | Findings | Recommendations |
|---|---|---|
| D1 | The `AGENTS.md` file is titled “SYSTEM OVERRIDE & IDENTITY,” and the word “WAJIB” appears repeatedly. Hermes scans context files for prompt-injection patterns and may block any files that are detected. I do not know the exact pattern | Run Hermes from the root of the repo and ensure `AGENTS.md` is loaded (not blocked). If blocked, replace the title with a neutral term such as “Agent Constitution” |
| D2 | Kiko (`.kilo/kilo.jsonc`) uses `runSafeCommands: false` | The L2 CLI requires manual approval in Kiko; provide a static package (`AGENT_INTEGRATION.md` §4) |
| D3 | `.agents/platforms/` contains only `openclaw/`; the Hermes kit and validation scripts from the previous package are missing | Apply if Hermes is used |
