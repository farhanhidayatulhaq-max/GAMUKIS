# Gamukis English Language Standard

## Purpose
This standard defines English as the required language for all newly written and maintained developer-facing content in the Gamukis repository.

Users may give instructions in Indonesian or another language. This standard governs content stored in the repository; when a solution is recorded in project files, write it in English.

## Scope
This standard applies to:
- documentation and PRDs
- code comments, docstrings, and JSDoc
- developer-facing logs and diagnostics
- test names and test descriptions
- maintenance notes, handoff files, and review checklists
- commit messages and pull request descriptions

This standard does not replace or override:
- product localization files
- user-facing translations
- user-generated content
- external datasets
- compatibility-sensitive identifiers and API contracts

## Mandatory rule
All new and maintained developer-facing content must be written in clear, natural, technically accurate English unless an explicit exception applies.

## Required translation behavior
1. Preserve the original meaning and technical intent.
2. Keep the original document structure and headings where possible.
3. Prefer existing project terminology and naming patterns.
4. Do not mechanically translate identifiers that are part of:
   - database schemas
   - environment variables
   - serialized payloads
   - API routes
   - JSON keys
   - import/export names
   - external integrations
5. When a name is compatibility-sensitive, document it and handle it under a separate migration plan rather than renaming it silently.

## Naming conventions
Follow the repository conventions already in use:
- `camelCase` for JavaScript variables and functions
- `PascalCase` for React component classes and exported component names where applicable
- `kebab-case` for file names when repository conventions require it

## Allowed exceptions
English is not required for the following:
- localization files for end users
- external or third-party datasets and translations
- user-generated data preserved for authenticity
- compatibility-sensitive identifiers that must remain unchanged for operational reasons

## Review and migration workflow
1. Audit developer-facing content for Indonesian-only or mixed-language usage.
2. Classify each issue as `INDONESIAN_ONLY`, `MIXED_LANGUAGE`, `ENGLISH_ONLY`, `USER_FACING_OR_EXTERNAL_DATA`, or `COMPATIBILITY_SENSITIVE`.
3. Translate developer-facing text in small, reviewable batches.
4. Preserve technical names and contract keys during migration.
5. Validate the diff and run the smallest relevant checks available for the changed files.

## Batch plan
### Batch 1
Repository governance and workflow content:
- `AGENTS.md`
- `.agents/teamwork/INDEX.md`
- `.agents/memory/DECISIONS.md`
- `.agents/memory/LESSONS_LEARNED.md`
- `.agents/templates/DISPATCH.md`
- `.agents/templates/HANDOFF.md`
- `.agents/platforms/openclaw/README.md`
- `.claude/agents/frontend-specialist.md`
- `.agents/teamwork/_archive/admin_crud/handoff.md`

### Batch 2
Any remaining developer-facing Indonesian or mixed-language documents under `.agents`, `.claude`, and similar operational folders.

## Sign-off
This standard is approved for incremental rollout. The migration should proceed in small, reviewable batches while preserving compatibility and product localization requirements.
