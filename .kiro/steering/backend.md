
---
inclusion: fileMatch
fileMatchPattern:
  - "Backend/**/*.js"
  - "Backend/**/*.json"
  - "Backend/**/*.sql"
  - "Backend/**/Dockerfile"
  - "Backend/**/docker-compose*.yml"
---

# Gamukis Backend Engineering Rules

## 1. Existing Architecture

Inspect the actual repository before changing the backend. Known areas include:

- `Backend/src/app.js`, `Backend/src/index.js`, and `Backend/src/server.js`
- `Backend/src/config/`
- `Backend/src/controllers/`
- `Backend/src/middlewares/`
- `Backend/src/models/`
- `Backend/src/routes/`
- `Backend/src/services/`
- `Backend/src/Database/Api/`
- `Backend/src/Database/Firebase/`
- `Backend/src/Database/MongoDB/`
- `Backend/src/Database/MySQL/`
- `Backend/src/Database/Redis/`

These paths are discovery hints, not proof that every file or responsibility remains unchanged. Inspect current imports and call sites before editing.

## 2. Responsibility Boundaries

- Routes define endpoint wiring and middleware order.
- Controllers handle request/response coordination.
- Services contain reusable business operations.
- Models and database modules own persistence-related behavior.
- Middleware handles cross-cutting request concerns such as authentication, authorization, rate limiting, uploads, and errors.
- Configuration modules centralize environment-dependent settings.

Follow the established project conventions where they differ. Do not move responsibilities across layers solely for stylistic preference.

## 3. API and Validation

- Validate request parameters, query values, and body fields at the boundary.
- Enforce authorization for every protected operation, including object-level access.
- Return consistent error responses without leaking stack traces or secrets.
- Use appropriate HTTP status codes and preserve existing response contracts.
- Avoid trusting client-provided user IDs, roles, ownership, prices, scores, or game state.
- Handle missing records, duplicate operations, malformed requests, and unexpected service failures explicitly.
- Avoid broad catch blocks that hide errors or return false success responses.

## 4. Authentication and Sessions

- Trace the full authentication path before changing login or registration behavior.
- Preserve existing token, cookie, session, and identity-provider contracts unless a change is required.
- Verify token expiration, signature validation, issuer/audience constraints where applicable, and authorization checks.
- Never log credentials, tokens, or sensitive authentication payloads.
- Do not weaken password, session, or rate-limit protections to bypass a failure.
- Test both permitted and forbidden access paths.

## 5. Database Integrations

Gamukis may integrate with Firebase, MongoDB, MySQL, and Redis. Identify the actual datastore and ownership of the data before changing persistence logic.

- Use existing connection and lifecycle patterns.
- Use parameterized queries for SQL.
- Validate data before writing it.
- Handle connection failures, timeouts, duplicate writes, and partial failures.
- Consider transaction boundaries and consistency when multiple writes must succeed together.
- Do not assume all stores are interchangeable or automatically synchronized.
- Avoid changing schemas or deleting data without an explicit migration and rollback strategy.
- Never run destructive queries against production by default.
- Ensure Redis keys, TTLs, and invalidation rules match their intended lifecycle.

## 6. Realtime and Game Services

Before changing realtime functionality, trace event producers, consumers, authentication, room membership, persistence, and reconnect behavior.

- Validate event payloads on the server.
- Verify that users can only act on rooms and resources they are authorized to access.
- Handle duplicate, stale, out-of-order, and invalid events where applicable.
- Ensure disconnect and reconnect paths do not leave stale state or unauthorized room membership.
- Preserve existing event names and payload contracts unless a breaking change is intentional.
- Test concurrent actions and repeated requests when they affect shared state.

## 7. Errors, Logging, and Resources

- Use the established error middleware and logging conventions.
- Log enough context for diagnosis without exposing secrets or personal data.
- Close or release resources according to their lifecycle.
- Avoid unhandled promise rejections and swallowed exceptions.
- Make retries bounded and safe; do not blindly retry non-idempotent writes.

## 8. Backend Verification

Inspect `Backend/package.json` and existing tests to identify valid commands. Do not invent scripts.

Run relevant checks where available, such as:

- Focused unit or integration tests.
- API tests for successful and rejected requests.
- Authentication and authorization tests.
- Database behavior tests.
- Linting and build checks, if configured.

Report skipped checks and environmental blockers explicitly.
