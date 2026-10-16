# Test Plan — Cost-Aware Adaptive Routing

## Test principles

- First run tests on the unmodified checkout to establish a baseline.
- Reuse the repository's existing test framework and patterns.
- Do not claim all tests pass if the repository already has known failures; record exact baseline and post-change outcomes.
- Use deterministic mocks for price, provider response, capability, and failure category.
- Do not require live paid API calls for unit tests.

## Unit test matrix

| Scenario | Setup | Expected behavior |
|---|---|---|
| Feature flag off | Adaptive policy disabled | Existing combo ordering and behavior retained |
| Simple task | Two eligible candidates, reliable pricing/history | Cheapest candidate meeting configured reliability threshold ranks first |
| Complex task | Low-cost candidate has poor success history | Better-performing eligible candidate may rank first |
| Vision required | One vision-capable and one text-only candidate | Text-only candidate excluded |
| Tool/search required | Candidate lacks required capability | Candidate excluded before ranking |
| Unknown price | One candidate has no price record | Do not invent price; use safe configured-order fallback for unknown comparison |
| Missing token usage | Provider response has no usage | Cost marked estimated or unknown according to available data |
| Temporary upstream error | First candidate times out, second is eligible | Bounded fallback occurs |
| Rate limit | Retry hint supplied | Existing retry/backoff handling is respected |
| Malformed request | Same request fails validation | No futile identical retry |
| Invalid auth | Credential refresh fails | Existing auth handling is used; no unbounded retries |
| Unsupported format | Candidate rejects request format | Candidate skipped or failure classified; no same-candidate loop |
| Retry budget exhausted | All attempts fail | Request terminates with existing compatible error semantics |
| Telemetry write fails | Usage persistence throws | Model response remains successful if upstream succeeded |
| RTK transform throws | Compression hook errors | Original content continues (fail-open) |
| Error/tool payload | Error result or critical structured content | No destructive compression |
| Streaming partial output | First candidate emits content then fails | No unsafe duplicate stream retry |
| Secrets | Authorization data present in request context | Secrets are absent from routine logs |

## Integration tests

- Existing combo selection and autoswitch test coverage remains intact.
- The selected model actually receives the request with the expected translated format.
- Per-attempt usage is recorded for success and failure when usage data exists.
- Multiple attempts aggregate into task-level cost without double-counting.
- SSE chunks and final response shape remain compatible.
- Feature flag can be toggled without a database migration unless the approved design explicitly requires one.

## Evaluation set

Create a fixed, non-sensitive set of representative tasks:
- simple explanation / one-line edit;
- small bug fix;
- multi-file feature;
- test creation and test-failure diagnosis;
- complex refactor or architecture reasoning;
- vision task if the project actually uses vision;
- tool/search-required task if supported;
- malformed request and simulated transient failure.

Use the same tasks and acceptance checks for baseline and candidate. Prefer tests, diffs, or reviewer rubric over a model's self-assessment.

## Release gates

1. No new critical test regression.
2. Feature flag off matches baseline behavior for covered paths.
3. Capability correctness does not regress.
4. Retry loops are bounded and permanent failures do not cause pointless retries.
5. Cost per successful task improves or remains justified by a measured quality/reliability gain.
6. Task completion/quality do not fall below owner-approved thresholds.
7. Rollback is documented and tested.
