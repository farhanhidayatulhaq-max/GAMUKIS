---
name: skill-backend
description: Use when developing, fixing, or reviewing the Gamukis Node.js and Express.js backend, including APIs, routes, controllers, services, middleware, authentication, profiles, registration, rooms, Socket.IO, and database integrations.
---

# Backend Engineering — Gamukis

## 1. Mission

Develop a secure, consistent, maintainable Gamukis backend that remains backward-compatible with the frontend and existing realtime systems.

The backend is the authoritative owner of server business logic, data validation, authorization, request lifecycle management, database integration, and API contracts.

This skill serves as technical guidance. Always adhere to `AGENTS.md`, the approved PRD, dispatch briefs, and repository workflow rules.

## 2. Scope

Use this skill when working on:

- REST APIs and Express.js routing.
- Registration, login, Google authentication, and session lifecycle.
- User profiles and user data mutations.
- Room administration and game room orchestration.
- Socket.IO, realtime communication, and game service integration.
- Middleware for authentication, admin authorization, error handling, rate limiting, and file uploads.
- Services and models connecting business logic with persistence layers.
- Frontend integration with endpoints, realtime events, and response contracts.
- Server configuration, environment variables, Docker, and backend deployment.

Do not use this skill to broadly alter gameplay mechanics, frontend UI, or database schemas without appropriate scope and coordination.

## 3. Gamukis Backend Architecture

Use the actual directory layout as the initial reference. Inspect repository files before applying modifications.

```text
Backend/
├── index.js
└── src/
    ├── app.js
    ├── index.js
    ├── server.js
    ├── config/
    │   ├── env.js
    │   ├── jwt.js
    │   ├── mailer.js
    │   └── storage.js
    ├── Database/
    │   ├── Api/
    │   ├── Firebase/
    │   ├── MongoDB/
    │   ├── MySQL/
    │   └── Redis/
    ├── controllers/
    ├── middlewares/
    ├── models/
    ├── Register/
    ├── routes/
    ├── services/
    └── utils/
```

Layer responsibilities:

- **Routes:** define endpoints and mount required middleware.
- **Controllers:** handle HTTP request/response lifecycles and delegate business operations to services.
- **Services:** execute core business logic and orchestrate domain operations.
- **Models:** manage database queries and data representation according to established patterns.
- **Middlewares:** handle authentication, authorization, rate limiting, file uploads, and error handling.
- **Config:** manage configurations for environment variables, JWT, email delivery, and storage.
- **Database:** isolate connections and drivers for respective database engines.
- **Utils:** provide reusable internal helper functions.

Do not shift responsibilities wholesale across architectural layers merely to enforce arbitrary design patterns.

## 4. Mandatory Operating Procedures

1. Read `AGENTS.md`, task PRD/dispatch, `.agents/docs/prd-standard.md`, and relevant workflow skills.
2. Inspect `package.json`, server entrypoints, route definitions, controllers, services, middleware, models, and configurations.
3. Trace the feature lifecycle from incoming HTTP request through response handling and database operations.
4. Locate callers from frontend and dependent services before changing any contract.
5. Identify authentication, authorization, input validation, side effects, and potential state mutations.
6. Make the smallest coherent change that satisfies requirements. Preserve existing conventions unless they conflict with security or approved PRD requirements.
7. Execute available and relevant tests.
8. Document changed files, technical decisions, verification outputs, and unresolved risks.

Never guess implementation details from file names alone. Always inspect active code first.

## 5. API and HTTP Contracts

- Preserve HTTP methods, paths, status codes, field names, response payloads, and error behaviors currently in use.
- Before modifying an API contract, verify all frontend and service callers.
- Validate path parameters, query strings, request bodies, data types, string lengths, and domain boundaries.
- Return appropriate HTTP status codes and structured error responses matching project conventions.
- Never expose stack traces, credentials, database connection strings, or internal infrastructure details to the client.
- Avoid exposing sensitive fields from user models.
- Apply pagination and limit boundaries to endpoints returning bulk data.
- Avoid introducing duplicate endpoints when an existing path can be safely extended.
- Document contract modifications and coordinate with frontend owners where necessary.

## 6. Authentication and Authorization

Inspect active implementations across:

- `src/controllers/authController.js`
- `src/middlewares/authMiddleware.js`
- `src/middlewares/adminMiddleware.js`
- `src/models/sessionModel.js`
- `src/models/userModel.js`
- `src/routes/authRoute.js`
- `src/routes/firebaseAuthRoute.js`
- `src/routes/manualAuthRoute.js`
- `src/services/googleauthService.js`
- `src/services/loginService.js`
- `src/services/registerService.js`

This list provides an inspection baseline; verify the complete flow in the codebase.

Rules:

- Preserve manual, Google, Firebase, and session auth flows in accordance with actual implementations.
- Do not create parallel token or session mechanisms without approved requirements.
- Validate tokens server-side and verify expiration and subject identity.
- Distinguish authentication from authorization: successful login does not imply administrative privileges.
- Enforce the principle of least privilege across endpoints and database operations.
- Never trust client-provided user IDs, roles, room ownership, or privileged flags.
- Do not alter guest policies, registered user rules, or role assignments without reviewing all dependent flows.
- Never store plaintext passwords. Use the project's established cryptographic hashing mechanisms.
- Never write tokens, passwords, or credentials to logs.

## 7. Services and Business Logic

Inspect relevant domain services, including:

- `loginService.js`
- `profileService.js`
- `registerService.js`
- `historyService.js`
- `roomService.js`
- `realtimeGameService.js`
- `realtimeGameSocket.js`

Rules:

- Place business logic in services or designated domain layers, avoiding duplication across route handlers.
- Avoid controllers that perform raw database queries or duplicate business logic.
- Validate domain invariants before executing state-mutating operations.
- Account for retries, timeouts, duplicate requests, and partial failures.
- Use transactions when multiple operations must succeed or fail atomically, where supported by the underlying engine.
- Never assume atomic distributed transactions across MySQL, Redis, MongoDB, and Firebase.
- Do not introduce silent fallbacks that fabricate dummy data when a backend service fails.

## 8. Socket.IO and Realtime

- Inspect active implementations in `realtimeGameService.js`, `realtimeGameSocket.js`, and associated Redis modules.
- Preserve event names, payload schemas, and lifecycle hooks expected by the client.
- Validate player identity, room IDs, action types, and numeric parameters on the server.
- Never trust client-reported scores, rewards, inventory ownership, or match outcomes.
- Ensure proper handling of reconnections, disconnects, room cleanup, and idempotent event delivery.
- Avoid heavy blocking database queries in realtime event loops.
- Coordinate event or payload schema modifications with `gamedev` and `frontend` specialists.

## 9. Database Integration

Refer to `.agents/skills/skill-database/SKILL.md` for dedicated data persistence decisions.

Before modifying database interactions:

1. Identify the exact database engine utilized by the feature.
2. Trace connection modules, models, services, configs, and callers.
3. Review data schemas, queries, indexes, and consistency constraints.
4. Establish the authoritative source of truth for the affected data.
5. Preserve legacy behavior unless an explicit migration decision has been made.
6. Avoid dual-writing across databases without an explicit consistency and reconciliation strategy.

Never assume MySQL, Redis, MongoDB, and Firebase are interchangeable.

## 10. Validation, Error Handling, and Reliability

- Validate all untrusted inputs on the server boundary.
- Use parameterized queries or safe ORM/ODM driver abstractions.
- Handle errors explicitly and leverage designated error-handling middleware.
- Never swallow exceptions silently without proper logging or client responses.
- Define appropriate timeouts and failure strategies for external dependencies.
- Restrict retries on operations that produce non-idempotent side effects.
- Guard against race conditions during login, profile updates, room management, score tracking, and rewards.

## 11. Security

- Store secrets exclusively in environment variables or designated secret stores.
- Maintain non-sensitive variable names and placeholders in `.env.example`.
- Never commit `.env` contents, Firebase service accounts, or private keys to source code, docs, or logs.
- Never disable security middleware to make tests pass or features appear functional.
- Apply rate limiting to sensitive endpoints.
- Validate upload file types, extensions, MIME types, and sizes.
- Prevent path traversal, SQL/NoSQL injection, mass assignment, and cross-tenant privilege escalation.
- Configure CORS according to deployment requirements; do not open permissive wildcards unnecessarily.

## 12. Testing and Verification

Select checks appropriate to the change:

- Unit tests for services, validation helpers, and domain business logic.
- Integration tests for routes, middleware, and database operations.
- Auth tests for invalid tokens, expiration, and unauthorized access attempts.
- API contract tests for status codes, schemas, and error structures.
- Realtime tests for socket events, reconnections, action validation, and state synchronization.
- Smoke tests for server startup and core dependency availability.

Execute commands configured in `package.json`. Never claim tests passed without executing them.

Clearly differentiate between:
- passed tests;
- failed tests;
- unexecuted tests;
- checks blocked due to missing runtime dependencies or credentials.

## 13. Modification Boundaries

- Do not modify files outside the assigned dispatch scope.
- Do not alter database schemas or execute destructive migrations without explicit authorization.
- Do not remove endpoints, events, response keys, or authentication paths merely for aesthetic cleanup.
- Do not introduce new dependencies before verifying whether existing dependencies suffice.
- Do not construct parallel frameworks duplicating active architecture.
- Do not mutate frontend or gameplay behavior indirectly without identifying impacts and coordinating.

## 14. Completion Criteria

Backend work is complete when:

- implementation fulfills the PRD and dispatch criteria;
- API contracts and socket events remain backward-compatible or properly coordinated;
- validation, authorization, and error handling are enforced;
- database operations use the authoritative source of truth;
- relevant tests have executed and results are logged;
- no secrets or sensitive data are introduced;
- changes, risks, and next steps are explicitly reported in the handoff.

## 15. Handoff Format

Report adhering to:

1. **Objective:** problem or feature addressed.
2. **Changes:** modified files and updated responsibilities.
3. **Contracts:** affected endpoints, responses, events, or data structures.
4. **Database:** persistence layers touched and schema impacts.
5. **Verification:** executed test commands and exact results.
6. **Risks:** limitations, required migrations, config steps, or remaining tasks.
