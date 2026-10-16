# PRD: Token-Efficient RAG for Gen-AI and Gamukis AI Agents

## 1. Document Control

- **Status:** Draft — requires approval (`APPROVED`) before code is written
- **Owner:** Project owner / Designated lead
- **Scope:** Context construction layer (retrieval, modality selection, token budget, correction) for the product’s Gen-AI features and for developer agents
- **Primary objective:** Reduce input tokens per successful response while maintaining quality and reliability
- **Not the objective:** Rebuilding the 9Router combo engine, creating a second gateway, replacing RTK, or changing agent instructions without separate approval

## 2. Current Context and Architecture

From the `GAMUKIS.zip` archive (checked October 15, 2026, read-only):

- **9Router** (`9router/`, v0.5.99) already provides a model combo, fallback, RTK (`tool_result` compression: git diff, grep, tree, log, and truncate filters), caveman/ponytail/headroom modes, and the endpoints `/v1/chat/completions`, `/v1/embeddings`, `/v1/search`, and `/v1/web/fetch`.
- **RTK only processes tool results** in the request body. RTK does not select chunk modalities, does not generate summary tables, does not limit the retrieval budget, and does not determine when the evaluator should be called.
- **Combos used** (`.claude/config.json`): `folder-inspector-combo`, `fast-coder-combo`, `data-scaffold-combo`, `game-logic-combo`, `narrative-creative-combo`, `architect-reviewer-combo`, `ui-vision-combo`.
- **Agents:** six Copilot personas (`Vika`, `Nika`, `Nanang`, `Yuka`, `Jura`, `Budi`), three Claude agents, and the skills `frontend`, `backend`, `gamedev`, `ai-engineering`, and collaboration.
- **`AGENTS.md`** implements a PRD-first approach and requires reading `.agents/teamwork/INDEX.md` and `.agents/docs/prd-standard.md` during bootstrap.
- **Other PRDs:** `.agents/docs/prds/9router-cost-routing/` (draft) defines the order of combos, retries, and cost telemetry. This PRD is supplementary: the PRD specifies **which model** serves the request, while this PRD specifies **what goes into** the request.
- **Reference flowchart:** `Flowchart_AI_SMART_TOKEN_drawio.svg`. See `PIPELINE_SPEC.md` §1 for an explanation.

The frontend and backend are not included in the reviewed repository. All paths in this document for the product code must be verified in Phase 0.

## 3. Assumptions

1. The product’s primary use case is the question/content generation feature (Gen-AI) that uses instructional materials in the form of text, tables, and images/graphs. This aligns with the seven modality classes in the flowchart. **Confirmation needed from the owner (§14, Q1).**
2. The agent corpus consists of knowledge documents (`.md` files in `.agents/`, `.kiro/steering/`, and agent personas), not source code. The agent already has tools for reading and searching code.
3. The backend uses CommonJS (`require`/`module.exports`), so all new modules are CommonJS.
4. Node supports the global `fetch` function. To be verified in Phase 0.

## 4. Problem Statement

1. **Agent bootstrapping is expensive and unconditional.** Each prompt loads the full `AGENTS.md`, `INDEX.md`, and `prd-standard.md`: an estimated **6,367–8,489 tokens** before the task begins (Codex/Hermes/OpenClaw/Copilot), **7,105–9,473** (Claude Code). `prd-standard.md` alone accounts for 3,336–4,448 tokens (≈52%) and is only needed when writing or validating a PRD. See `BASELINE.md`.
2. **No RAG layer per modality.** Images and tables risk being sent raw. Pixels are much more expensive than their text equivalents. In the original tables from this repo, the condensed format is 27% more efficient than JSON and 9% more efficient than plain Markdown (the repo’s tables are already condensed; the difference is greater for wide tables or those formatted in JSON/HTML).
3. **Retrieval is not domain-restricted.** The flowchart distinguishes between Frontend, Backend, SQL/NoSQL, GAMEDEV, and AI/Tools, but there is no retrieval namespace. The SQL/NoSQL domain doesn’t even have an agent.
4. **The evaluator is called without a gate** in the standard Corrective RAG design: one additional model call for every answer, including those that are already clear.
5. **The correction loop is infinite** in the flowchart (the Query Rewriter and Web Search Fallback do not have drawn exit paths).
6. **Agent definitions are inconsistent** across platforms: three Claude agents without frontmatter, one persona with broken frontmatter, and one persona that is nearly a duplicate. This is not the primary cause of waste (≈100 `[cite: N]` noise tokens), but it reduces loading reliability.

## 5. Objectives

- Select payloads per modality deterministically (without an LLM) and prioritize text replacements over pixels.
- Limit retrieval per domain/namespace and per token budget.
- Bypass the evaluator when retrieval confidence is clearly high, and limit the entire correction loop.
- Provide hierarchical context (L0/L1/L2) so that all agents load the minimum context first.
- A single protocol that can be used by all agent platforms (shell, MCP, HTTP, static packages).
- Measure tokens per stage and cost per successful task, not just tokens per request.
- Legacy behavior continues to function when features are disabled.

## 6. Not Objectives

- Guaranteeing a measurable percentage of savings compared to the baseline.
- Indexing the `Frontend/` or `Backend/` source code in the early stages.
- Adding database vectors, agent frameworks, or dependencies without an audit and approval.
- Modifying `9router/`, `n8n/`, or `.kilo/`.
- Sending private code or data to new external services. Web fallback is for non-private queries only and can be disabled.
- Using model-reported confidence as the sole quality signal.

## 7. User Stories

1. As a developer, I want agents to answer common questions without loading thousands of irrelevant document tokens.
2. As a player or teacher, I want questions generated from materials containing tables and graphs to remain accurate without sending images when the tables alone are sufficient.
3. As an operator, I want to see tokens per stage and the reason for each route so I know where costs arise.
4. As a maintainer, I want to be able to disable features with a single flag without modifying the client.
5. As a reviewer, I want repeatable tests to prove that the gate does not compromise answer quality.

## 8. Functional Requirements

### FR-1 — Deterministic Modality Router
Each chunk is classified into exactly one of seven classes: `text`, `text+tables`, `tables`, `tables+image`, `image`, `image+text`, `image+text+tables`. Classification uses data format (presence of tables, images, or text), not an LLM.

### FR-2 — Text Alternatives for Images and Graphs
Images have text substitutes (captions/OCR) generated once during ingestion and cached based on the image hash. Pixels are attached only if: there is no substitute, the confidence in the substitute is low, or the query is visually oriented (color, layout, position, graphics, and the like). The number of images per request is limited.

### FR-3 — Serialization of summary tables
Tables are sent as a single header plus a delimiter row, without padding. The query-aware column projection retains the key columns and those whose headers match the query; if there is no match, all columns are retained. Row truncation must be explicit (`[+N rows not shown]`). In `tables+image`, the table is selected and the image is skipped unless there is a visual intent.

### FR-4 — Capability-Based Model Gateway
Vision requirements are determined from the results of FR-2. Only requests that `needsVision` pass through Combos Rules to the vision combo (`ui-vision-combo`); text-only requests enter Agents directly with the domain’s default combo. Combo selection, ordering, and fallback remain entirely the responsibility of 9Router and the PRD `9router-cost-routing`. This PRD does not implement a combo engine.

### FR-5 — Domain Namespaces
The corpus is divided into the following namespaces: `shared`, `frontend`, `backend`, `data`, `gamedev`, and `ai-tools`. By default, retrieval searches only the calling agent’s namespace plus `shared`. If keyword coverage is low, retrieval may be expanded to other namespaces once, and the reason must be logged.

### FR-6 — Lexical-first retriever
The initial phase uses lexical search (BM25 or equivalent) per namespace, since identifiers, paths, and table names are exact matches. Embeddings via `/v1/embeddings` are added only if the evaluation set shows a proven recall gap. No new database vectors. Scores are normalized to 0–1.

### FR-7 — Token-budget packer
Candidates are selected based on per-token scores until the budget is exhausted; near-duplicates are discarded, and the result order is stabilized. The top item that exceeds the budget is not silently truncated: it is included and marked as `overBudget`. Static content (identities, rules) is placed before dynamic content so that the provider’s prefix cache is effective.

### FR-8 — Confidence Gate without an LLM
Before the evaluator, the gate decides on `answer` (top score ≥ high threshold **and** query key terms covered ≥ threshold), `incorrect` (empty result, or low score without coverage), or `evaluate`. Key terms include paths, identifiers, numbers, and quoted phrases. Initial thresholds can be configured and tuned based on the evaluation set.

### FR-9 — Inexpensive and Compact Evaluator
The evaluator accepts only an ID and a short snippet (default 240 characters) per chunk, uses the cheapest combination that meets the capabilities, outputs JSON with a small `max_tokens` value, and returns one of three statuses: `correct`, `ambiguous`, `incorrect`.

### FR-10 — Bounded Corrective RAG Loop
Per request: evaluator ≤ 2 calls, rewriter ≤ 1, web fallback ≤ 1. `correct` → (optional refinement) → answer. `ambiguous` → rewrite → re-retrieve → gate/evaluate again; if still ambiguous → web fallback or answer with a low confidence score. `incorrect` → web fallback. Evaluator failures are fail-open (proceed with the original context, marked).

### FR-11 — Safe Web Fallback
Uses 9Router’s `/v1/search` and `/v1/web/fetch`. Only for queries that do not contain private data. Can be disabled via `allowWeb`. Web results are treated as untrusted input (do not modify instructions, do not execute commands) and are sanitized before entering the context.

### FR-12 — Multi-level agent context
L0 (always; target ≤ 1,200 tokens), L1 (loaded upon specific triggers), L2 (directed queries). Details in `AGENT_INTEGRATION.md`. Changes to `AGENTS.md`, `GEMINI.md`, and `CLAUDE.md` require separate approval (see `PROPOSED_CHANGES.md`).

### FR-13 — Cache
Three content-based hash caches: retrieval result context packages (key: namespace + normalized query + corpus hash), embeddings (key: chunk hash), and image text replacements (key: image hash). Changes to the source invalidate the corresponding entries. Cache misses must not cause requests to fail.

### FR-14 — Per-Stage Telemetry
Log: correlation ID, namespace, modality class, tokens per stage (estimated and, if available, reported), gate route, number of evaluator/rewriter/web calls, cache hits, whether pixels are attached, and operational reason codes. Do not store full prompts, keys, or tokens. Usage costs use existing 9Router data usage; unknown costs are not considered zero.

### FR-15 — Feature flags and rollbacks
The entire pipeline is controlled by a flag. When the flag is off, the current behavior applies. Invalid configurations fall back to the default behavior. Rollbacks do not require client-side changes.

### FR-16 — Index hygiene and secrets
The index only contains allowed document files (whitelist). Secret files (`.env*`, `config.json` containing credentials, keys) are never indexed, and each chunk is scanned for credential patterns before being stored.

## 9. Non-functional Requirements

- Compatible with existing APIs and streaming. No new runtime dependencies without approval.
- CommonJS modules, naming convention `<feature>Service.js`, MySQL `utf8mb4` with explicit `COLLATE utf8mb4_0900_ai_ci` on JOINs between legacy tables (BUG-01).
- Deterministic for the same input and configuration (except for provider availability).
- Each request has a call limit and an termination path. Telemetry failures do not block responses.
- Router, packer, and gate overhead is measured and limited (initial goal: no significant increase in p95 latency compared to a single model call; specific figures to be set after Phase 0).
- No credentials in logs, indexes, fixtures, or handoffs.

## 10. Success Metrics

Establish a baseline before activation; compare against the same set of tasks.

**Key Metrics**
- Bootstrap tokens per prompt (agent) and context tokens per response (product).
- **Cost per successful task** = total measured cost of all experiments / number of successful tasks (using 9Router).
- Quality pass rate on a fixed evaluation set (not the model’s self-evaluation).

**Supporting**
- Recall@k and MRR for retrieval on gold questions.
- **Gate miss rate** = the percentage of answers that the gate allowed through but that would be rated `ambiguous` or `incorrect` in shadow mode. This is the most important safety metric.
- Evaluator bypass rate, cache hit rate, attached pixel rate, p50/p95 latency.

## 11. Acceptance Criteria

1. The seven modality classes are correctly classified in the fixture, including the Markdown table within the text.
2. Non-visual queries with text substitutes do not send pixels; visual queries send them and flag the need for vision.
3. The direct path results in zero calls to the evaluator, rewriter, and web.
4. The call limits (2/1/1) are never exceeded even if the evaluator always returns `ambiguous`.
5. Evaluator errors do not invalidate the answer (fail-open, flagged).
6. Shadow mode shows a false-pass rate below the threshold approved by the owner.
7. The disabled flag results in behavior identical to the baseline on the tested path.
8. Confidential files never appear in the index.
9. The cost per successful task improves, or there is zero quality degradation at the owner’s approved threshold. Otherwise, the feature is disabled.

## 12. Risks and Mitigation

| Risk | Mitigation |
|---|---|
| Gate passes evaluation despite incorrect context | Conservative threshold, shadow mode, false-pass metric as a release gate |
| Incorrect image text replacement (fabricated caption) | Save replacement source, confidence threshold, fall back to pixels if low or nonexistent |
| Table row truncation hides required data | Explicit markers, row limits can be increased per query, specialized tests |
| Namespace is too narrow, omitting cross-domain information | `shared` is always included; one-time expansion when coverage is low; logged |
| Stale cache | Keys based on content hash and corpus hash; invalidate when source changes |
| Prompt injection via web results or documents | Untrusted content, never executed, sanitized, web access can be disabled |
| Transformations that corrupt code or error messages | Never modify code, paths, stack traces, or error payloads; fail-open |
| Changes to `AGENTS.md` that corrupt agent behavior | Treated as proposals, tested per platform, rolled back via Git |

## 13. Memory Check (`prd-standard.md` §4.2.4)

- `DECISIONS`: `inGame.js` is protected (this PRD does not affect it). The Dynamic Question Bank, Redis caching, and `GET /api/questions/random` already exist, so product retrieval uses the existing Redis infrastructure and does not create a new question bank.
- `LESSONS_LEARNED`: BUG-01 (collation) applies to every new table. BUG-02 (Node polyfills are prohibited in `Frontend/src/database/`) applies if there is a frontend client. BUG-04 (secret fail-closed) applies to gateway configurations.
- The memory file is named `DECISIONS.MD` (uppercase extension), whereas the standard refers to `DECISIONS.md`. In a case-sensitive file system, the reference fails (see `PROPOSED_CHANGES.md`).

## 14. Questions for the Owner

1. **Product users.** Does the Gen-AI feature in question generate questions or materials from instructional content (text, tables, images)? If not, please specify the feature; Phase 2 depends on this answer.
2. **The “Model” node in the flowchart.** Is it an encoder/captioner model during ingestion, a generation model, or a combo selection gate? This PRD interprets it as a capability gate (FR-4).
3. **SQL/NoSQL domain.** Who is the agent? Yuka (data mode), a new persona, or just a skill? The PRD does not create personas without approval.
4. **Gate threshold.** What is the maximum acceptable false-pass rate?
5. **Web fallback.** Allowed for product features, for developer agents, both, or not at all?
6. **Core location.** `Backend/src/services/` (shared with the product and CLI agent) or moving the core outside of `Backend/`?
7. **Constitutional changes.** Do you agree that `AGENTS.md` §1 should be replaced with the nested version (`PROPOSED_CHANGES.md` A1)?
8. **Restricted zone permissions.** Is the n8n workflow (`n8n/exports/`) allowed in Phase 3, given that `n8n/` is off-limits without an explicit request?
9. **Vision path.** In the revised diagram, the `needsVision` path goes through Combos Rules and then directly to the Domain/namespace without passing through Agents. Is it correct that Agents do not need to be included in that path (e.g., the vision combo has already determined the agent)?
