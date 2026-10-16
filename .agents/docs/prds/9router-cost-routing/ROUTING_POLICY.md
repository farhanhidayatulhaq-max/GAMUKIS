# Proposed Routing Policy

This is a human-readable policy specification, not executable configuration.

## Decision order

1. **Validate request** using existing validation.
2. **Detect required capabilities** from the request and existing runtime metadata.
3. **Resolve the existing combo/configuration** selected by the client or operator.
4. **Filter ineligible candidates**: missing modality/tool support, unavailable provider/account, access restrictions, incompatible format.
5. **Classify task** into `simple`, `coding`, `complex`, `vision`, `search`, or `unknown`.
6. **Order remaining candidates**:
   - First rollout: retain operator-configured order unless the feature flag is enabled.
   - Adaptive mode: prefer candidates with known lower effective cost only when capability and observed reliability meet the configured threshold.
   - Unknown price/reliability: preserve configured order; mark data as unknown.
7. **Execute through the existing combo engine**.
8. **Classify failure** and decide whether fallback is useful.
9. **Stop** on success, cancellation, permanent failure, or exhausted attempt budget.
10. **Record per-attempt usage and outcome** without storing secrets or full prompts.
11. **Return response using existing API/SSE semantics**.

## Suggested initial policy by task class

| Task class | Routing preference | Escalation rule |
|---|---|---|
| `simple` | Lowest-cost eligible candidate with acceptable historical success | Escalate after a meaningful failure, not after every transient network error |
| `coding` | Cost/reliability balance; prefer candidates that pass coding tasks | Escalate if output/test acceptance fails where an evaluator exists |
| `complex` | Stronger proven candidate or existing high-capability combo | Avoid multiple cheap attempts that produce unusable work |
| `vision` | Candidate must explicitly support the required vision input | Never route to text-only model |
| `search` | Candidate/tool chain must support the required search capability | Do not assume search from model name alone |
| `unknown` | Existing configured default order | Do not gamble on unsupported capability or unknown pricing |

## Retry policy

- Retry only within a fixed, configured attempt budget.
- Use existing provider/account fallback and token-refresh logic where possible.
- For rate limits, respect upstream retry hints if available; otherwise use existing backoff behavior.
- A network timeout or temporary upstream error may justify another eligible candidate.
- A malformed request should not be resent unchanged.
- An authentication failure should trigger the existing refresh/account handling; if credentials/access remain invalid, stop or switch only to an independently authorized account/provider.
- An unsupported capability/format should skip that candidate, not retry it unchanged.
- Do not treat a streamed partial response as safe to retry blindly if doing so could duplicate user-visible output. Respect existing streaming semantics.

## Cost model

Use actual reported usage/cost when available. Distinguish:
- `reported`: provider or router reports a measured cost;
- `estimated`: calculated from known token counts and a known price table;
- `unknown`: insufficient usage/pricing information.

For task-level analysis:
`cost_per_successful_task = sum(cost of all measured attempts in the evaluation window) / count(successful tasks)`

Report unknown-cost attempts separately. Never silently treat unknown as zero.

## Safety and privacy

- Do not log API keys, OAuth tokens, or raw authorization headers.
- Avoid routine storage of full prompts, source files, and tool output.
- Keep routing explanations to operational reason codes, not model chain-of-thought.
- Keep token/context transformations fail-open and preserve critical code and error details.
