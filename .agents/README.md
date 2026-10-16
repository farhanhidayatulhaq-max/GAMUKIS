# .agents — Universal Multi-Agent Control Center

The `.agents/` directory is the command center and Single Source of Truth (SSOT) for all AI Coding Agents operating within this repository (**Antigravity, GitHub Copilot, Kiro, ChatGPT Codex, Claude Code, Hermes AI, and OpenClaw**).

This architecture is built on the **Zero-Migration** principle: you can switch between AI Agents at any time during feature development without losing context or altering the governance rules.

---

## 1. How the System Works (Zero-Migration Architecture)

All AI Agents are configured to adhere to a single overarching constitution:
- **Central Constitution**: `/AGENTS.md` (at project root)
- **Platform Bridges (Pointers)**:
  - **Claude Code** reads `/CLAUDE.md` $\rightarrow$ points to `/AGENTS.md`
  - **Antigravity / Gemini** reads `/GEMINI.md` $\rightarrow$ points to `/AGENTS.md`
  - **GitHub Copilot** reads `/.github/copilot-instructions.md` $\rightarrow$ points to `/AGENTS.md`
  - **ChatGPT Codex, Hermes AI, OpenClaw, Kiro** directly read `/AGENTS.md` and the `/.agents/` directory

---

## 2. Directory Map for `.agents/`

Below is the functional overview of each folder and file within `.agents/`:

```text
.agents/
├── README.md                  # Main guide to .agents architecture (this file)
├── ORCHESTRATION.md           # Workflow rules & creation sequence (Creation Flow)
├── PLATFORMS.md               # Platform-specific configurations for AI Agents
│
├── docs/                      # Document Standards & Specifications
│   └── prd-standard.md        # Mandatory PRD rules & File/Folder Blueprint
│
├── skills/                    # Agent Skill Modules (automatically synced to .github/skills/)
│   ├── gamukis-prd-guard/     # Gatekeeper: Prevents coding before PRD is APPROVED
│   ├── teamwork-dispatch/     # Breaks PRD down into task queues (Task Dispatch)
│   ├── teamwork-handoff/      # Records task handoff when switching AI Agents
│   └── teamwork-review/       # Validates final code against the PRD Blueprint
│
├── templates/                 # Coordination Document Templates
│   ├── DISPATCH.md            # Task assignment format derived from PRD
│   ├── PROGRESS.md            # In-progress file tracking format
│   └── HANDOFF.md             # Inter-agent handoff format
│
├── teamwork/                  # Active Project Memory
│   └── INDEX.md               # Active feature development status dashboard
│
└── platforms/                 # Platform-Specific Supplementary Configurations
    └── openclaw/              # Settings specific to OpenClaw (TOOLS.md, etc.)
```