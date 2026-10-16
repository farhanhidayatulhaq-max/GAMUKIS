# PRD: 9Router Cost-Aware Adaptive Routing

## 1. Document control

- **Status:** Draft; approval required
- **Owner:** Project owner / designated Lead
- **Scope:** Cost-aware model routing inside the existing 9Router integration
- **Primary objective:** Reduce cost and unnecessary token consumption per successfully completed coding task while preserving task quality and reliability.
- **Non-goal:** Rebuild the combo engine or replace the existing `.agents/` orchestration system.

## 2. Context and current architecture

The repository already contains:
- `.agents/` as the shared agent-workflow and coordination layer.
- `AGENTS.md`, with a PRD-first workflow and restrictions on files outside the approved blueprint.
- `.agents/ORCHESTRATION.md`, `.agents/PLATFORMS.md`, skills, teamwork records, and memory.
- A `9router/` codebase that already supports model combos, provider/account fallback, format translation, usage/cost tracking, and RTK token-saving behavior.

Therefore, the implementation must extend and measure existing behavior rather than introduce a second independent combo/fallback engine. Confirm all paths and APIs against the current checkout before coding; this PRD was prepared from a project archive and is not proof that every line in the working tree is unchanged.

## 3. Problem statement

A combo can include multiple models, but a longer or poorly ordered combo may increase latency, retries, and total spend. Routing that optimizes only the nominal model price can also select a cheap model that fails or produces an unusable result, increasing total cost.

The project needs a transparent policy that:
1. classifies the task using explicit, inspectable signals;
2. chooses from existing configured combos/models;
3. respects required capabilities and provider availability;
4. uses fallback only for errors where retrying is meaningful;
5. accounts for actual usage across attempts when data is available;
6. measures cost per successful task, not only cost per request or token.

## 4. Goals

- Use existing combo presets and routing paths; do not create a parallel combo system.
- Make model/combo selection task-aware, capability-aware, and cost-aware.
- Avoid unnecessary retries and repeated attempts against a known-permanent failure.
- Reduce prompt/context size safely, preserving information needed for coding decisions.
- Record enough telemetry to compare cost, completion quality, latency, and fallback behavior.
- Keep the routing policy configurable and observable.
- Preserve API compatibility and existing default behavior when the new policy is disabled.

## 5. Non-goals

- Guarantee a fixed percentage of savings before baseline measurements.
- Automatically rewrite project source files or `.agents/` instructions during runtime.
- Change provider authentication, OAuth flows, or account management unless a blocker is demonstrated and separately approved.
- Replace existing combo execution, SSE streaming, translation, or RTK implementation.
- Send source code, prompts, or usage data to a new external analytics service.
- Use model self-reported confidence as the only quality signal.
- Route every task to the cheapest model regardless of task complexity or required capabilities.

## 6. User stories

1. As a developer, I want simple tasks to use an inexpensive suitable model so that routine work costs less.
2. As a developer, I want complex changes to use a stronger model when needed so that low-cost routing does not increase rework.
3. As an operator, I want fallback reasons and per-attempt usage to be visible so that I can identify costly failure loops.
4. As a maintainer, I want the feature to be disabled or rolled back without changing clients' API requests.
5. As a reviewer, I want reproducible tests showing that capability requirements and permanent errors are handled correctly.

## 7. Functional requirements

### FR-1 — Reuse existing combo engine
- Discover and call the current combo-selection and execution functions.
- Do not duplicate `getComboModels`, combo execution, or fallback loops under new names.
- Keep existing combo configuration as the source of available candidates.

### FR-2 — Explicit task classification
Support a small set of configurable classes:
- `simple`: explanation, small isolated edit, formatting, straightforward lookup in repository.
- `coding`: implementation across a few files, bug fix, test writing.
- `complex`: architectural change, multi-file refactor, difficult debugging, ambiguous requirements.
- `vision`: image/screenshot input requiring vision capability.
- `search`: task requiring an upstream search/tool capability, if supported by the existing request.
- `unknown`: insufficient signals; use a conservative compatible default.

Classification must use deterministic signals first (request shape, tool/capability requirements, configured client metadata where available). Do not infer unsupported capabilities from the natural-language prompt alone. When classification is uncertain, fall back to the existing configured default.

### FR-3 — Capability gate before price ranking
- Exclude candidates that do not satisfy required capabilities or request format.
- Respect provider/model availability and existing access rules.
- Never choose a cheaper candidate that cannot handle the request's required tools, vision, or structured output.

### FR-4 — Cost-aware candidate ordering
- Rank eligible candidates using available pricing and historical outcome data.
- Prefer a low-cost candidate only when its capability and reliability are acceptable for the task class.
- If pricing or historical data is missing, use the existing combo order rather than inventing a price.
- Do not claim that a subscription/free model has zero economic cost; report its tracked direct API charge as zero only when that is what the available data says.

### FR-5 — Error-aware fallback
Classify failures into categories:
- `transient`: timeout, retryable network failure, temporary upstream error, rate limit where waiting/another account/model can help.
- `capability_or_format`: unsupported tool, unsupported modality, invalid format for that provider/model.
- `auth_or_access`: expired/invalid credentials, revoked access, permission failure.
- `permanent_request`: invalid request, malformed payload, unsupported parameter that will not be fixed by repeating the same request.
- `unknown`: unclassified failure.

Retry/fallback only when the next attempt has a plausible chance of success. Do not repeat an identical request against the same failing account/model for permanent errors. Use existing token-refresh/account-fallback logic where appropriate; do not bypass it with a second competing implementation. Respect `Retry-After` or equivalent upstream hints if the current runtime supports them.

### FR-6 — Context and token budget
- Measure input/output tokens when providers return usage.
- Reuse existing RTK/token-saving hooks rather than introducing a competing compressor.
- Any compression must preserve code, paths, stack traces, error messages, constraints, and relevant tool output.
- Compression must fail open: if the transform fails, continue with original content.
- Skip or avoid transforming error payloads and structured/tool content when transformation could change semantics.
- Never silently truncate critical user requirements to satisfy a budget.

### FR-7 — Usage and outcome telemetry
Capture, when available:
- request/task correlation ID;
- task class and selected combo/model;
- attempt number and fallback reason;
- provider/model identifiers;
- input/output token counts;
- reported cost and pricing-data availability;
- latency and outcome (success/failure/cancelled);
- whether token/context optimization was applied.

Do not log API keys, OAuth tokens, secrets, or full source prompts by default. Minimize retention and avoid adding external telemetry.

### FR-8 — Feature flag and rollback
- New adaptive policy must be behind a configuration flag.
- Disabled mode must preserve existing routing behavior as closely as possible.
- Invalid configuration must fail safely to the existing default policy.
- Document the flag, default, and rollback procedure before release.

### FR-9 — Explainability
For each routing decision, record a concise reason code such as:
`capability_required`, `low_cost_eligible`, `historical_success`, `transient_fallback`, `permanent_error_no_retry`, `default_policy`.
Avoid storing chain-of-thought or private reasoning; only store operational reason codes.

## 8. Non-functional requirements

- Maintain existing API compatibility and streaming behavior.
- Do not add a new runtime dependency without explicit approval.
- Keep routing deterministic for equivalent inputs and equivalent telemetry/configuration, apart from provider availability and other external conditions.
- Avoid unbounded retry loops; every request has a clear attempt limit and termination path.
- Telemetry write failures must not break a successful model response.
- Do not expose credentials or sensitive prompt data in logs.
- Performance overhead introduced by classification/ranking should be measured and bounded.
- Keep changes local to approved files and directories in the blueprint.

## 9. Success metrics

Establish a baseline before enabling adaptive routing. Compare on a representative, repeatable task set.

Primary:
- **Cost per successful task** = total measured cost across all attempts / number of successfully completed tasks.
- **Task completion rate** = successful tasks / all eligible tasks.
- **Quality pass rate** = tasks passing the same acceptance checks / evaluated tasks.

Secondary:
- p50 and p95 end-to-end latency.
- Average attempts per request.
- Fallback rate by reason.
- Percentage of requests with missing/estimated cost.
- Input tokens and RTK compression rate.
- Regression rate, defined by failed tests or reviewer rejection after a routed implementation.

A reduction in raw token count is not a success if completion rate or quality materially degrades.

## 10. Acceptance criteria

- [ ] Existing combo path remains the sole combo execution mechanism.
- [ ] Required capabilities are checked before cost ranking.
- [ ] Missing pricing data does not cause fabricated rankings or prices.
- [ ] Permanent request/auth failures do not trigger futile identical retries.
- [ ] Retryable failures can fall back within a bounded attempt budget.
- [ ] Feature flag off preserves legacy routing behavior in tests.
- [ ] Telemetry captures per-attempt cost/usage where upstream data exists.
- [ ] Telemetry failures do not fail user requests.
- [ ] No secrets or full prompts are added to routine logs.
- [ ] RTK/context transformation remains fail-open and preserves error/critical content.
- [ ] Tests cover simple, coding, complex, vision/tool-required, unknown, transient, permanent, and missing-pricing scenarios.
- [ ] Baseline and post-change results are documented using the same evaluation set.
- [ ] Project tests relevant to touched files pass, or existing known failures are documented with evidence.
- [ ] Changes comply with `AGENTS.md`, PRD standard, and the approved File & Folder Blueprint.

## 11. Rollout plan

1. **Audit only:** trace current combo selection, fallback classification, pricing, usage storage, and RTK hooks. No code changes.
2. **Baseline:** collect or replay a representative task set with the legacy policy.
3. **Minimal implementation:** add policy behind a feature flag, reusing current combo and fallback paths.
4. **Offline evaluation:** compare completion, quality, cost/task, attempts, and latency.
5. **Canary:** enable only for a small, explicitly configured scope.
6. **Decision:** keep, tune, or roll back based on acceptance criteria.
7. **Default change:** only after owner approval and evidence that quality remains acceptable.

## 12. Risks and mitigations

- **Cheap model causes rework:** measure quality and cost per successful task; preserve escalation path.
- **Fallback duplicates existing logic:** map and reuse current handlers before implementation.
- **Pricing data is incomplete:** mark unknown/estimated values; do not rank on fabricated cost.
- **Telemetry adds latency:** use lightweight local writes and ensure failures are non-fatal.
- **Compression removes crucial context:** fail open; test with representative tool outputs and stack traces.
- **Tests are flaky or baseline is already failing:** establish a known baseline and report pre-existing failures separately.

## 13. Open questions requiring owner decision

1. Which task classes should be enabled in the first rollout?
2. What maximum attempt count is acceptable for one request?
3. Is the priority lowest cost, or lowest cost subject to a minimum quality/completion threshold? Recommended default: the latter.
4. What retention period is acceptable for aggregate usage telemetry?
5. Which representative Gamukis tasks will form the fixed evaluation set?

## 14. Approval gate

This PRD remains a draft until the project owner approves it. After approval, verify the blueprint against the live repository and update it before touching runtime code. No implementation should be inferred as authorized merely because this file exists.
