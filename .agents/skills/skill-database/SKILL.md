---
name: skill-database
description: Use when designing, developing, fixing, or reviewing the Gamukis data layer across MySQL, Redis, MongoDB, and Firebase, including connections, queries, models, consistency, security, performance, and realtime persistence.
---

# Database Engineering — Gamukis

## 1. Mission

Maintain all Gamukis storage integrations securely, consistently, efficiently, and in strict accordance with each database's designated responsibilities.

This skill encompasses MySQL, Redis, MongoDB, Firebase, and their data layer integrations with the Express.js backend and client frontend.

The primary goal is not to force every database engine into every feature, but to employ the correct storage system based on architectural decisions and project requirements.

Follow `AGENTS.md`, the approved PRD, dispatch instructions, workflow rules, and established system contracts.

## 2. Gamukis Database Architecture

Use the actual directory layout as the initial inspection baseline:

```text
Backend/src/Database/
├── Api/
│   └── server.js
├── Firebase/
│   ├── admin.js
│   └── players.js
├── MongoDB/
│   ├── connection.js
│   ├── options.js
│   └── status.js
├── MySQL/
│   ├── connection.js
│   ├── options.js
│   └── status.js
└── Redis/
    ├── connection.js
    ├── connections.js
    ├── options.js
    ├── RealtimeGame.js
    └── status.js
```

Verify active implementations before drawing conclusions about module functionality. File names alone are not proof that connections, schemas, or storage policies are correct.

Also inspect dependencies in:

- `src/models/userModel.js`
- `src/models/sessionModel.js`
- `src/services/historyService.js`
- `src/services/profileService.js`
- `src/services/realtimeGameService.js`
- `src/services/roomService.js`
- `src/services/realtimeGameSocket.js`
- `src/middlewares/ratelimitMiddleware.js`
- `src/config/env.js`
- `src/config/storage.js`

This list provides initial inspection targets and may evolve with active code.

## 3. Mandatory Operating Procedures

1. Read project instructions, the active PRD/dispatch, and relevant backend skills.
2. Identify affected features and business workflows.
3. Trace callers of queries, models, services, and connection modules.
4. Identify which database serves as the authoritative source of truth.
5. Review existing schemas, data types, indexes, access controls, queries, and write patterns.
6. Check how the system handles connection failures, timeouts, retries, and reconnections.
7. Implement minimal, backward-compatible modifications.
8. Execute appropriate tests or validations.
9. Document schema changes, risks, and required migration steps.

Never invent schemas, fields, collections, keys, tables, or relationships based on speculation without reviewing active code and business needs.

## 4. Database Selection Guidelines

Every piece of data must have a clear single source of truth.

- **MySQL:** Primary candidate for relational data, referential integrity, and relational transactions.
- **Redis:** Primary candidate for transient state, caching, rate limiting, and ephemeral realtime coordination.
- **MongoDB:** Candidate for document-oriented structures where document shapes and access patterns are appropriate.
- **Firebase:** Encompasses Firebase Authentication, Realtime Database, Cloud Firestore, and admin services. Determine the exact service in use before modifying integrations.

This serves as selection guidance; verify actual usage in the repository.

Do not:

- maintain inconsistent permanent duplicate records across multiple databases;
- treat ephemeral caches as durable storage;
- switch database engines merely because a query is challenging to optimize;
- assume distributed transactions function seamlessly across heterogeneous databases;
- delete legacy data prior to an approved migration and verification process.

## 5. MySQL Specialist

### Design and Integrity

- Inspect active schemas, primary keys, foreign keys, unique constraints, data types, and nullability.
- Use normalization where appropriate without imposing structures that degrade necessary query access patterns.
- Maintain schema compatibility with dependent models and services.
- Use transactions for multi-row operations that must execute atomically within MySQL.
- Verify rollback behaviors and transaction failure handlers.

### Query and Performance

- Use parameterized queries or secure driver mechanisms.
- Prevent SQL injection; never concatenate raw user inputs into queries.
- Inspect `EXPLAIN` query plans before altering indexes based on conjecture.
- Index columns matching actual filter, join, ordering, and unique constraint access paths.
- Avoid redundant indexes that increase write overhead.
- Use pagination for large datasets; avoid unconstrained table scans.

### Migrations and Data Management

- Design schema modifications to be planned, verifiable, and reversible.
- Assess the impact of column alterations, constraints, data types, and indexes on live application traffic.
- Never execute destructive operations (`DROP`, `TRUNCATE`) without explicit approval.
- Never alter primary keys or `AUTO_INCREMENT` behaviors without checking existing data and foreign key references.
- Prepare backups or recovery procedures prior to executing high-risk operations.

## 6. Redis Specialist

### Usage and Lifecycle

- Verify whether Redis serves realtime game state, cache, sessions, rate limiting, or other concerns.
- Follow established connection and configuration patterns in `src/Database/Redis/`.
- Apply TTLs to transient data matching its domain lifecycle.
- Define eviction, persistence, and recovery policies based on actual requirements.
- Never assume Redis data is permanently persistent or unconditionally available.

### Keys and Data Structures

- Use consistent key naming conventions aligned with project standards.
- Select Redis data types (`STRING`, `HASH`, `SET`, `ZSET`, `LIST`) matching concrete access patterns.
- Avoid unexpiring keys for temporary data.
- Avoid unbounded memory growth or runaway collection sizes.
- Verify the blast radius of key schema changes across all producers and consumers.

### Concurrency and Realtime

- Use atomic operations or appropriate synchronization primitives when multiple concurrent requests mutate shared state.
- Do not rely on non-atomic read-modify-write patterns for critical state.
- Ensure reconnections and Redis outages do not cause silent state corruption or false score generation.
- When using distributed locks, enforce safe expirations and release mechanisms.
- Ensure idempotent replay operations do not duplicate rewards or side effects.

### Rate Limiting

- Review `src/middlewares/ratelimitMiddleware.js` and associated Redis configs.
- Preserve agreed rate limiting thresholds.
- Account for fail-open versus fail-closed behaviors during Redis outages.
- Never disable rate limiting simply to bypass connection errors without evaluating security risks.

## 7. MongoDB Specialist

### Document Modeling

- Verify active MongoDB usage and access patterns prior to creating collections or mutating document shapes.
- Decide between embedding and referencing based on document size, read frequency, and update rates.
- Avoid unbounded growing arrays.
- Enforce schema validation and data typing at the application or database level.
- Maintain backward compatibility with previously stored documents.

### Queries and Indexes

- Review filters, sorting, projections, pagination, and aggregation pipelines.
- Establish indexes matching active query patterns.
- Guard against full collection scans on high-frequency queries.
- Restrict returned document counts and project only required fields.

### Consistency and Migration

- Do not assume cross-document operations are atomic unless explicit multi-document transactions are configured.
- Handle duplicate key errors, validation exceptions, and connection drops gracefully.
- Plan incremental document migrations when schema changes affect existing data.
- Never alter or drop collections without analyzing all dependencies.

## 8. Firebase Specialist

### Product Identification

Clearly distinguish between:

- **Firebase Authentication:** user identity and token lifecycle.
- **Realtime Database:** hierarchical JSON storage and realtime client synchronization.
- **Cloud Firestore:** collection/document structured database.
- **Firebase Admin SDK:** privileged server-side administrative access.

Do not treat these distinct services as interchangeable. Verify exact SDK dependencies and configurations.

### Server Integration

- Inspect `src/Database/Firebase/admin.js` and `src/Database/Firebase/players.js`.
- Maintain clean separation between client-side and server-side access paths.
- Load server credentials exclusively via secure configuration or secret management.
- Never expose private keys or service account credentials to client bundles.
- Never write credentials into logs, documentation, or version control.
- Validate user identity tokens server-side before associating Firebase records with backend accounts.

### Security Rules and Access

- Inspect active Firebase Security Rules before altering permissions.
- Apply least privilege principles.
- Never rely on client-side frontend validation as data authorization.
- Ensure security rules prevent cross-user unauthorized access.
- Note that the Firebase Admin SDK bypasses Security Rules; enforce server-side authorization checks for all Admin SDK operations.

### Realtime and Lifecycles

- Clean up listeners, handle disconnections, and manage reconnections properly.
- Avoid redundant duplicate listeners and wasteful write operations.
- Validate incoming data payloads before passing them to core business logic.
- Preserve event and data contracts expected by the frontend.

## 9. Single Source of Truth and Cross-Database Consistency

For any feature touching multiple databases, explicitly document:

1. Exactly what data is stored.
2. Which database holds the authoritative source of truth.
3. Which databases serve purely as caches or derived projections.
4. Read and write execution order.
5. System behavior when one database fails.
6. Synchronization, retry, or reconciliation strategies.
7. Conditions ensuring safe idempotent retries.

Never assume cross-database consistency simply because a write succeeded in one system. Define partial failure mitigation before implementing multi-store writes.

## 10. Integration with Gamukis Backend

- Preserve the project's layered separation: routes, controllers, services, models, and connection modules.
- Do not instantiate new connection pools per HTTP request; reuse singleton connection instances.
- Manage connection lifecycles gracefully during application startup and shutdown.
- Consume configurations exclusively through environment abstractions.
- Do not alter API contracts simply because internal database structures change.
- Coordinate cross-layer modifications with `backend`, `frontend`, or `gamedev` skills.
- End-to-end flows must be verified when mutating game state, scores, match history, or rooms.

## 11. Security and Data Privacy

- Never log passwords, tokens, private keys, session secrets, or connection strings.
- Enforce parameterized queries and strict input validation.
- Enforce authorization prior to reading or mutating user data.
- Restrict database user privileges according to service needs.
- Never expose database ports publicly without authorization and firewalling.
- Avoid exposing sensitive PII fields.
- Use synthetic test fixtures; do not import raw production data into tests.

## 12. Observability and Reliability

- Inspect existing health/status modules before introducing new ones.
- Differentiate application server health from individual database health.
- Log failures with sufficient diagnostic context while redacting secrets.
- Handle connection timeouts, auth failures, query errors, and reconnects according to driver capabilities.
- Avoid unbounded retries on non-idempotent operations.
- Monitor connection pool saturation, query latencies, and key growth.
- Never declare a system healthy solely because the HTTP process started.

## 13. Testing and Verification

Tailor verification to the changes made:

- Connection success and failure handling.
- Queries, writes, validation, and error states.
- Relational integrity or document schema validation.
- Redis TTLs, expiry, reconnects, and atomic operations.
- Firebase Authentication and access controls.
- Schema migration backward compatibility against legacy data.
- Service-to-database integration tests.
- Partial failure behavior across multiple databases.

Execute tests in appropriate sandbox environments. Never run destructive operations against production data. Report passed, failed, and unexecuted checks with clarity.

## 14. Constraints and Decisions Requiring Approval

- Do not alter the authoritative source of truth without approval.
- Do not introduce new database engines simply because they are available.
- Do not execute destructive schema alterations without a documented migration plan.
- Do not drop data, collections, key patterns, or indexes without checking dependencies.
- Do not execute cross-database migrations without a consistency and recovery plan.
- Do not infer architecture from outdated documentation if active code demonstrates otherwise.

## 15. Completion Criteria

Database engineering tasks are complete when:

- database usage aligns with requirements and approved architecture;
- authoritative sources of truth and storage boundaries are clear;
- schemas, queries, and key changes are backward-compatible with callers;
- security, integrity, and failure handling are enforced;
- data impacts and migrations are documented;
- relevant tests have executed with recorded results;
- no credentials or sensitive data are leaked;
- risks and next steps are explicitly reported.

## 16. Handoff Format

Report adhering to:

1. **Affected Databases:** MySQL, Redis, MongoDB, Firebase, or active combinations.
2. **Changes:** connections, schemas, queries, indexes, keys, documents, or rules modified.
3. **Source of Truth:** authoritative data locations and roles of secondary caches.
4. **Consistency:** transaction impact, synchronization, retries, and partial failure handling.
5. **Security:** access control and credential updates without exposing secrets.
6. **Verification:** executed commands and actual outputs.
7. **Risks:** migrations, rollback steps, configuration requirements, and subsequent actions.
