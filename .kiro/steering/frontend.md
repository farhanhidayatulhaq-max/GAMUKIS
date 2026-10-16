
---
inclusion: fileMatch
fileMatchPattern:
  - "Frontend/src/**/*.js"
  - "Frontend/src/**/*.jsx"
  - "Frontend/src/**/*.ts"
  - "Frontend/src/**/*.tsx"
  - "Frontend/src/**/*.css"
  - "Frontend/public/**/*"
---

# Gamukis Frontend Engineering Rules

## 1. Existing Application

Gamukis includes a React frontend. Existing areas may include route definitions, pages, shared components, Firebase integration, and game interfaces.

Inspect the current source tree and package scripts before selecting an implementation pattern. Do not assume a library, routing convention, state manager, or test framework is installed.

## 2. Component Design

- Reuse existing components and styling conventions.
- Keep components focused on a clear responsibility.
- Separate reusable business logic from presentation when that matches the existing architecture.
- Avoid unnecessary global state, prop drilling, duplicated logic, and excessive abstraction.
- Preserve established routes, URL behavior, accessibility, and user-facing contracts.
- Do not replace a working framework or major dependency without explicit justification.

## 3. State and Asynchronous Operations

- Define loading, success, empty, and error states where applicable.
- Prevent stale asynchronous results from overwriting newer state.
- Clean up event listeners, subscriptions, timers, sockets, and other resources when appropriate.
- Prevent duplicate submissions and unintended repeated mutations.
- Avoid stale closures and effects with incorrect dependencies.
- Handle network failures and expired sessions predictably.
- Do not hide failures behind empty data or misleading success messages.

## 4. API and Firebase Integration

- Follow the existing API client and Firebase initialization patterns.
- Do not duplicate configuration or initialize services repeatedly without need.
- Treat all client-side data as untrusted.
- Never expose server secrets or privileged credentials in frontend code.
- Do not rely on frontend checks as authorization.
- Validate response shapes before relying on them when the API can return variable or untrusted data.
- Handle unavailable services and authorization failures explicitly.

## 5. UI Quality and Accessibility

- Preserve responsive behavior across relevant screen sizes.
- Use semantic HTML and accessible labels for controls.
- Ensure keyboard interaction and visible focus where applicable.
- Keep error messages understandable and actionable.
- Avoid layout regressions, accidental overflow, and broken navigation.
- Respect the project's existing design system rather than introducing inconsistent styles.

## 6. Game UI and Realtime Behavior

When changing game-related frontend behavior:

- Identify the authoritative source of game state.
- Do not assume the client is trusted to determine game outcomes or permissions.
- Handle reconnects, duplicate events, delayed updates, and room changes.
- Prevent listeners from accumulating across renders or route transitions.
- Keep event payloads consistent with backend contracts.
- Distinguish optimistic UI state from confirmed server state.

## 7. Frontend Verification

Inspect the frontend package manifest and available test setup.

Run relevant checks where available:

- Focused component or logic tests.
- Lint and type checks.
- Production build.
- Route and API integration checks.
- Responsive and accessibility checks for affected UI.

Do not claim visual verification unless the interface was actually inspected.
