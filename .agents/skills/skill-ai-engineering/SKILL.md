---
name: skill-ai-engineering
description: Use when designing or implementing AI features in Gamukis, including model integration, prompts, tool calling, retrieval/RAG, output evaluation, token/context efficiency, and 9Router gateway usage.
---

# AI Engineering — Gamukis

## Purpose

Build testable, secure, context-efficient, and measurable AI features without duplicating existing routing capabilities. This skill addresses AI feature engineering; it is not a directive to always employ a specific model.

## When to Use

Use when the task involves:
- LLM or multimodal model integrations;
- prompt templates and structured output schemas;
- tool/function calling or agent workflows;
- retrieval, embeddings, document search, or RAG architectures;
- evaluating output quality, safety, latency, token consumption, and cost;
- utilizing 9Router as a model gateway, where relevant to the task.

## Operating Procedures

1. Read `AGENTS.md`, the applicable PRD/dispatch, and related documentation. Determine whether the task modifies product features, agent workflows, or internal 9Router code; these three areas have distinct boundaries.
2. Define testable requirements: inputs, expected outputs, constraints, failure modes, and acceptance criteria.
3. Audit existing integrations, request/response formats, model configurations, logging, caching, and error mechanisms. Do not introduce a secondary client or gateway without strong justification.
4. Establish capability requirements prior to model selection: text, vision, tool calling, structured output, context window, and provider constraints.
5. When 9Router is used, adhere to approved endpoints and configurations. Rely on 9Router to manage combos, provider routing, and fallback policies according to its existing configuration; do not construct parallel combo engines in application code.
6. Decouple prompt/instruction templates from business logic where project architecture supports it. Version critical prompts when required for evaluation and rollback.
7. Validate model outputs before using them to trigger actions, persist to databases, or return product responses. Treat model output as untrusted input.
8. Explicitly handle timeouts, rate limits, malformed output, provider errors, and cancellations. Restrict retry attempts and avoid blindly re-executing non-idempotent operations.
9. Evaluate quality in tandem with cost and latency. Employ fixed test sets, acceptance criteria checks, or reviewer rubrics; never rely on a model to self-evaluate its own output.
10. Execute permitted tests and clearly distinguish between mocked tests versus live network calls.

## Routing, Tokens, and Cost

- Select models based on required capabilities and minimum acceptable quality first, followed by cost optimization.
- Do not route all tasks exclusively to the cheapest model; failure rates and repeated attempts increase total expenditure.
- Distinguish between measured costs, estimates, and unavailable cost telemetry. Do not treat unknown costs as zero.
- Measure cost per successfully completed task, not merely tokens per individual request.
- Leverage existing token and context optimization mechanisms. Do not introduce redundant compressors without prior audit.
- Do not strip constraints, essential code snippets, paths, stack traces, errors, or required tool outputs merely to compress tokens.
- If context transformation fails, prioritize proceeding with original content under existing fail-open designs.

## Security and Privacy

- Never embed API keys, OAuth tokens, passwords, or credentials in prompts, source code, fixtures, or logs.
- Do not transmit user data or private source code to external providers unless explicitly authorized by project configuration and policy.
- Minimize logging of full prompts and sensitive outputs; log operational reason codes where sufficient.
- Treat model outputs, retrieved documents, and tool execution outputs as untrusted input; validate before invoking system commands or modifying data.
- Never grant models direct authority to bypass authentication, authorization permissions, or server-side security guards.
- Do not store raw chain-of-thought traces. Persist only necessary final outputs and approved operational telemetry.

## Constraints

- Do not modify internal code under `9router/` unless the dispatch explicitly authorizes it.
- Do not alter providers, default models, combos, costs, or production fallback policies without approval.
- Do not introduce agent frameworks, vector databases, or new dependencies before auditing existing project alternatives.
- Do not claim cost savings or quality improvements without empirical measurement.
- Do not execute paid or live network evaluations without explicit authorization if they incur financial cost or transmit data externally.

## Completion Criteria

- Requirements and acceptance criteria are measurable and verified.
- Model outputs are validated prior to consumption by downstream systems.
- Error handling, retries, and cancellation are properly bounded.
- Evaluation encompasses quality, cost, and latency.
- Secrets and sensitive data are excluded from logs and artifacts.
- Handoff explicitly documents utilized models and configurations, evaluation metrics, executed tests, and unverified limitations.
