## 1. BOOTSTRAP PROTOCOL (STAGED, TOKEN-EFFICIENT)

Load the context in stages. Do not read all documents at every prompt.

| Tier | Loaded when | Contents |
| :--- | :--- | :--- |
| L0 | Always | This file: PRD gateway (§2) and anti-slop (§5) |
| L1 | On trigger | Writing or validating the PRD: `.agents/docs/prd-standard.md`. Create files after the PRD is `APPROVED`: §3. Continue, assign, or review tasks: `.agents/teamwork/INDEX.md` and §4. Interact with Backend or Frontend: `.github/instructions/<layer>.instructions.md` |
L2 | As needed | Targeted query:
`node scripts/rag/ragQuery.js --ns <backend|frontend|data|gamedev|ai-tools|shared> --q "<question>" --budget 1500`.
Without a shell: request a relevant document snippet, not the entire file.

General questions that do not involve code changes can be answered with L0.