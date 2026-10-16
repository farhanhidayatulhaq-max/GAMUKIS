# Test Plan — RAG Token Savings

## Principles

- Run tests on the checkout without any changes first to establish a baseline. Record any existing failures.
- Use deterministic mocks for the retriever, evaluator, rewriter, and web. Unit tests do not call paid services.
- Do not declare a test passed without running it. Results are reported with exact counts.
- Use tests, diffs, or reviewer rubrics as quality metrics, not the model’s self-evaluation of its own answers.

## 1. Unit Test Matrix

The “Reference” column lists the tests that have already passed in `reference/ragCore.reference.test.cjs` (20 tests, all passed on October 15, 2026). The Backend tests are actually ports of those tests.

| Scenario | Expected Behavior | Reference |
|---|---|---|
| Seven combinations of text/tables/images | Exactly seven flowchart classes | present |
| Markdown tables within text | `text+tables`; tables only → `tables` | yes |
| Concise vs. md vs. JSON serialization | concise < md < JSON; headers always present | yes |
| Column projection | Keys preserved; no match = all columns | yes |
| Line truncation | Marker `[+N lines not shown]` | yes |
| Images + fallbacks + non-visual queries | No pixels | yes |
| Visual queries, no fallbacks, or low confidence | Pixels + `needsVision` | yes |
| `tables+image` | Tables selected; images skipped unless visual intent | yes |
| Image cost | width × height / 750 if dimensions are known | yes |
| Packer | Sticks to budget, removes near-duplicates, deterministic | yes |
| Single item exceeds budget | Not truncated; `overBudget` | yes |
| Key terms | Path, identifier, number; truncated terms are not counted twice | yes |
| Gate | High → answer; medium → evaluate; empty or low → incorrect | yes |
| Direct path | 0 calls to evaluator/rewriter/web | yes |
| Ambiguous | Rewrite once, re-retrieve | yes |
| Incorrect | Web once | yes |
| Evaluator is always ambiguous | 2/1/1 limits not exceeded | yes |
| Web disabled | `uncertain`, `lowConfidence`, 0 web calls | yes |
| Evaluator error | Fail-open, flagged | yes |
| Evaluator accepts chunks | Max 240 characters per chunk | yes |
| Secret files | Never indexed; chunks containing credential patterns are rejected | **new** |
| Cache failure | Request still succeeds | **new** |
| Telemetry failure | Response remains successful | **new** |
| Web content contains instructions | Treated as data; does not change behavior | **new** |
| Narrow namespace, low scope | Expanded once and logged | **new** |
| Flag disabled | Behavior identical to baseline | **new** |

## 2. Integration Test

- The request actually reaches 9Router in the expected format; the key is read from an environment variable.
- The authorization header does not appear in the routine logs.
- Each phase records the token; the sum across phases does not count the same token twice.
- A cache hit returns the same packet as a miss for the same corpus; a change in the source invalidates the cache.
- Route Phase 2: `authenticateAny` + `requirePermission`; invalid input is rejected; the response is in Indonesian.

## 3. Fixed evaluation set

The nine initial “golden” questions from the repo corpus (answers and sources can be verified manually). Add product-related questions after Phase 0.

| # | Question | Expected source |
|---|---|---|
| 1 | Can `POST /history` be blocked by role permissions? | `prd-standard.md` §2, item 3 |
| 2 | Why does the startup fail with “Illegal mix of collations” and what are the rules? | `LESSONS_LEARNED` BUG-01 |
| 3 | Where should the `TextEncoder` polyfill for Jest be placed? | `LESSONS_LEARNED` BUG-02 |
| 4 | Which agent should be used to translate mockups/screenshots into the UI? | `Nanang.agent.md` |
| 5 | Which layer is created in the 8th step? | `prd-standard.md` §4 |
| 6 | Can `inGame.js` be modified in UI tasks outside of gameplay? | `DECISIONS` item 1 |
| 7 | Can the agent read the `.kilo/` folder? | `prd-standard.md` §1.1 |
| 8 | What is the endpoint for retrying a pending membership payment? | `DECISIONS` item 2 |
| 9 | Why is a static JWT fallback secret prohibited? | `LESSONS_LEARNED` BUG-04 |

Measure recall@k and MRR for expected sources, as well as the answer pass rate. Use the same set for both the baseline and candidates.

## 4. Shadow Mode for the Gate

Objective: To demonstrate that bypassing the evaluator does not degrade quality.

1. For a sample request, run the evaluator **even if the gate decides on `answer`**, but do not alter the answer.
2. Calculate the **false-pass rate** = the proportion of cases where the gate decides on `answer` but the evaluator rates it as `ambiguous` or `incorrect`.
3. Raise the threshold if the false-pass rate exceeds the owner’s approved limit. Enable the pass path only below that limit.
4. Repeat after major corpus changes.

## 5. Release Gate

1. No new critical regression tests.
2. False-pass rate is equal to the baseline on the tested path.
3. The false-pass rate at the gate is below the approved limit.
4. The call limits (2/1/1) are proven not to have been exceeded.
5. There are no confidential files in the index and no credentials in the logs.
6. The cost per successful task has improved, or quality has not fallen below the approved threshold.
7. Rollbacks are documented and tested.
