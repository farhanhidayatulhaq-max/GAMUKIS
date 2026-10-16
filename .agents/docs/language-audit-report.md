# Gamukis Language Audit Report

## 1. Scope
This report covers developer-maintained, architecture, and operational content across `Project Membuat AI` (Gamukis multi-agent repository) and strictly excludes restricted folders (`.kilo/`, `9router/`, and `n8n/`) per repository governance rules.

## 2. Classification Legend
- `INDONESIAN_ONLY`: Originally authored in Indonesian without English equivalents.
- `MIXED_LANGUAGE`: Contains mixed Indonesian and English in the same developer-facing section.
- `ENGLISH_ONLY`: Fully aligned with the English language standard.
- `USER_FACING_OR_EXTERNAL_DATA`: End-user copy, external datasets, or verbatim historical user prompts that must remain in their original language.
- `COMPATIBILITY_SENSITIVE`: Technical identifiers, database tables/columns, route parameters, Redis keys, or event names that must not be renamed without architectural approval.

## 3. Comprehensive Findings & Status

| File | Section | Status | Proposed English Translation / Action | Risk | Recommended Action |
|---|---|---|---|---|---|
| `AGENTS.md` | Entire document | `ENGLISH_ONLY` | Standardized to English; verified. | Low | Retain as SSOT constitution. |
| `.agents/README.md` | Whole document | `ENGLISH_ONLY` | Standardized to English; verified. | Low | Core architecture guide. |
| `.agents/ORCHESTRATION.md` | Whole document | `ENGLISH_ONLY` | Standardized to English; verified. | Low | Multi-agent collaboration flow. |
| `.agents/PLATFORMS.md` | Whole document | `ENGLISH_ONLY` | Standardized to English; verified. | Low | Platform support matrix & smoke tests. |
| `.agents/docs/prd-standard.md` | Blueprint annotations & workflows | `ENGLISH_ONLY` | Cleaned up inline directory annotations to English. | Low | Standardized PRD blueprint rules. |
| `.agents/memory/DECISIONS.md` | Architectural decisions & milestones | `ENGLISH_ONLY` | Standardized to English; preserved identifiers verbatim. | Medium | Retain decisions record. |
| `.agents/memory/LESSONS_LEARNED.md` | Bug validation log (`BUG-01` to `BUG-06`) | `ENGLISH_ONLY` | Standardized to English; preserved verification proofs. | Medium | Retain bug validation history. |
| `.agents/teamwork/INDEX.md` | Collaboration index & task status | `ENGLISH_ONLY` | Standardized to English; preserved task vocabulary. | High | Single source of truth for tasks. |
| `.agents/templates/DISPATCH.md` | Task dispatch template | `ENGLISH_ONLY` | Standardized to English; verified. | Low | Standard dispatch template. |
| `.agents/templates/HANDOFF.md` | Handoff template | `ENGLISH_ONLY` | Standardized to English; verified. | Low | Standard handoff template. |
| `.agents/templates/PROGRESS.md` | Progress tracking template | `ENGLISH_ONLY` | Standardized to English; verified. | Low | Standard progress template. |
| `.agents/platforms/openclaw/` | `README.md`, `TOOLS.md`, `gitignore.snippet` | `ENGLISH_ONLY` | Standardized to English; verified. | Low | OpenClaw adapter configs. |
| `.claude/agents/frontend-specialist.md` | Specialist instructions & rules | `INDONESIAN_ONLY` | Translate division prompt and rules to English. | Medium | Batch 2 migration item. |
| `.agents/skills/gamukis-prd-guard/SKILL.md` | PRD invariant gatekeeper skill | `INDONESIAN_ONLY` | Translate frontmatter and rule checklist to English. | High | Batch 2 migration item. |
| `.agents/skills/skill-backend/SKILL.md` | Backend engineering guide | `INDONESIAN_ONLY` | Translate architecture and middleware rules to English. | Medium | Batch 2 migration item. |
| `.agents/skills/skill-database/SKILL.md` | Database engineering guide | `INDONESIAN_ONLY` | Translate multi-database connection and query rules to English. | Medium | Batch 2 migration item. |
| `.agents/skills/skill-frontend/SKILL.md` | Frontend React architecture | `INDONESIAN_ONLY` | Translate atomic structure and state guidelines to English. | Medium | Batch 2 migration item. |
| `.agents/skills/skill-gamedev/SKILL.md` | Game logic and animation rules | `INDONESIAN_ONLY` | Translate gameplay loop and event guidelines to English. | Medium | Batch 2 migration item. |
| `.agents/skills/skill-ai-engineering/SKILL.md` | AI engineering & 9Router gateway | `INDONESIAN_ONLY` | Translate prompt, context, and combo rules to English. | Medium | Batch 2 migration item. |
| `.agents/skills/teamwork-*/SKILL.md` | Multi-agent coordination skills | `INDONESIAN_ONLY` | Translate dispatch, handoff, and review skills to English. | Low | Batch 2 migration item. |
| `.agents/teamwork/COPILOT_ROLE_API_TASK.md` | Active role selection dispatch | `INDONESIAN_ONLY` | Translate dispatch and blueprint steps to English. | Medium | Batch 3 migration item. |
| `.agents/teamwork/TASK_MEMBERSHIP_RETRY_UI.md` | Active membership retry dispatch | `INDONESIAN_ONLY` | Translate task instructions and verification criteria to English. | Medium | Batch 3 migration item. |
| `.agents/teamwork/ORIGINAL_REQUEST.md` | Verbatim initial user prompt | `USER_FACING_OR_EXTERNAL_DATA` | Retain verbatim in Indonesian for requirement provenance. | Low | Preserve unchanged. |
| `.agents/docs/prds/token-efficient-rag/reference/` | Test titles and mock test data | `MIXED_LANGUAGE` | Translate test description strings in `.cjs` test suites. | Medium | Batch 3 migration item. |
| `.agents/teamwork/_archive/` | Historical collaboration archives | `INDONESIAN_ONLY` | Translate legacy task notes to English. | Low | Batch 4 migration item. |
| `9router/public/i18n/literals/*.json` | End-user locale strings | `USER_FACING_OR_EXTERNAL_DATA` | Preserve original localization payloads. | Low | Restricted & user-facing. |

## 4. Compatibility-Sensitive Identifiers (Invariant Contract)
These technical identifiers must remain strictly stable and cannot be translated:
- Core Module: `inGame.js`
- Database Objects: `questions_bank`, `match_history`, `user_achievements`, `teacher_applications`, `users`, `users_detail`, `google_user_profiles`, `history`
- API Routes: `/api/questions/random`, `POST /api/players/history`, `POST /api/memberships/pending/retry`, `/api/auth/*`
- Realtime Events: `game:join`, `player:move`, `player:updated`, `coin:claimed`, `leaderboard:updated`
- Core Functions: `saveGameHistory()`, `getEffectiveToken()`, `authenticateAny`, `requirePermission`

## 5. Migration Execution Batches
- **Batch 1 (Completed):** Repository Governance, Constitution, Memory & Templates (`AGENTS.md`, `.agents/README.md`, `ORCHESTRATION.md`, `PLATFORMS.md`, `prd-standard.md`, `DECISIONS.md`, `LESSONS_LEARNED.md`, `INDEX.md`, `templates/`, `platforms/openclaw/`).
- **Batch 2 (Active):** Agent Skills & Specialist Prompts (`.agents/skills/`, `.claude/agents/frontend-specialist.md`, `.vscode/settings.json`).
- **Batch 3 (Pending):** Active Task Dispatches & Reference Implementations (`COPILOT_ROLE_API_TASK.md`, `TASK_MEMBERSHIP_RETRY_UI.md`, `token-efficient-rag/reference/`).
- **Batch 4 (Pending):** Historical Archive Documents (`.agents/teamwork/_archive/`).
