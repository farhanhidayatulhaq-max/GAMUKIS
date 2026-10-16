---
name: skill-frontend
description: Use when developing, fixing, or reviewing the Gamukis React frontend, including pages, components, CSS, navigation, client-side authentication, Firebase/API/realtime integration, profiles, admin views, and game UI.
---

# Frontend Engineering — Gamukis

## 1. Purpose and Authority

Build the Gamukis frontend while preserving existing React architecture, integration contracts, user experience, and feature backward compatibility.

This skill does not replace `AGENTS.md`, the approved PRD, `.agents/skills/gamukis-prd-guard/SKILL.md`, or active platform instructions.

Order of precedence:
1. Follow `AGENTS.md` and the approved PRD/dispatch.
2. Check PRD standards and guard skills where relevant.
3. Inspect active code and package manifests before making decisions.
4. If documentation conflicts with active code, document the discrepancy and request a Lead/Architect decision for changes affecting contracts or critical behavior.

## 2. Stack and Project Structure

The frontend is built with React JavaScript (`react-scripts`/Create React App), `react-router-dom`, component-scoped CSS stylesheets, and client-side integrations with Firebase and realtime API modules.

Identified areas:

- `Frontend/src/pages/`: page views such as `home`, `about`, `login`, `register`, `profile`, `completeProfile`, `adminDashboard`, `characterCustomization`, `game`, `gamePage`, `result`, `showgame`, `tutorial`, `loading`, and `notfound`.
- `Frontend/src/component/`: reusable components, including navigation, registration, and game UI containers.
- `Frontend/src/database/`: data access modules such as `adminApi.js`, `firebaseAuth.js`, `firebaseConfig.js`, `firebaseDatabase.js`, `manualAuth.js`, and `realtimeGame.js`.
- `Frontend/src/images/`: sprites, illustrations, icons, logos, and background art.

Verify the active checkout structure and file contents before modifying architecture. Do not perform framework migrations or directory restructurings merely to follow generic patterns.

## 3. When to Use This Skill

Use when the task involves:
- Pages, React components, CSS, layouts, or navigation.
- Forms, client-side validation, loading, error, and empty states.
- Login, registration, profile management, role assignment, and character customization.
- Admin dashboard, leaderboards, match results, tutorials, and content presentation.
- Frontend integration with Firebase, backend APIs, or realtime events.
- Responsiveness, accessibility, performance, and UI testing.

For changes primarily affecting gameplay mechanics, animation loops, collision, or score calculation, consult the `gamedev` skill.

For endpoints, databases, permissions, or server-side business logic, coordinate with the `backend` skill.

## 4. Operating Procedures

### A. Understand the Feature

1. Identify routes, entry point pages, and utilized components.
2. Search all callers, imports, routes, and associated CSS before renaming or relocating files.
3. Trace data sources: React state, Firebase Auth, Firebase Database, API modules, or realtime modules.
4. Check relevant user conditions: guests, authenticated users, incomplete profiles, users with assigned roles, and administrators where access differs.
5. Record existing behavior before modifying code.

### B. Implement Backward-Compatible Changes

1. Maintain established component and CSS patterns used in that area.
2. Prioritize the smallest change that satisfies the PRD.
3. Do not construct new design systems, state managers, service layers, or duplicate API folders without proven justification.
4. Decouple display state from data operations and side effects where existing patterns allow.
5. Handle loading, success, error, and empty states for asynchronous operations.
6. Prevent duplicate submissions and stale asynchronous responses from overwriting current state.
7. Preserve routes, event names, payloads, response fields, and data shapes consumed by other views.
8. Reuse available visual assets before introducing duplicates.

### C. Verification

1. Inspect scripts available in `package.json`; do not guess script names.
2. Execute available and authorized lint, test, or build commands.
3. Check console errors, failed network requests, navigation, responsiveness, and diverse user personas.
4. Report modified files, executed commands, actual outputs, risks, and cross-layer coordination needs.

## 5. Gamukis-Specific Conventions

- API modules, Firebase, manual authentication, and realtime clients reside in `Frontend/src/database/`. Use existing modules; do not create duplicate `src/api/` or `src/services/` directories without approval.
- Inspect active implementations of `adminApi.js`, `firebaseAuth.js`, `firebaseConfig.js`, `firebaseDatabase.js`, `manualAuth.js`, and `realtimeGame.js` before deciding responsibilities.
- Do not build parallel authentication or token mechanisms. Preserve existing Firebase and manual auth flows.
- Never store backend secrets, service account credentials, private keys, or privileged tokens in the frontend.
- Never rely on hiding buttons or menus as access control. Privileged actions must be verified on the backend.
- Inspect routes and relationships before modifying `profile`, `completeProfile`, `characterCustomization`, `adminDashboard`, `gamePage`, `result`, `showgame`, or `tutorial`.
- Never delete routes, response keys, fallbacks, or components that may still be in active use.
- Do not alter backend or database contracts as a side effect of UI work. If contract changes are required, document and coordinate with Lead/backend.

## 6. React and UI Quality

- Adhere to consistent component patterns and JavaScript style matching adjacent code.
- Do not introduce TypeScript or additional UI frameworks without authorization.
- Avoid side effects during component render cycles.
- Clean up event listeners, subscriptions, timers, and realtime socket listeners on component unmount.
- Avoid duplicate state that causes UI desynchronization.
- Ensure forms feature accessible labels, validation feedback, and clear submission states.
- Use semantic HTML elements, visible keyboard focus indicators, and accessible controls.
- Check responsive behavior across mobile and desktop viewports.
- Consider asset file sizes, dimensions, scaling, and aspect ratios for sprites and background art.
- Avoid adding third-party UI dependencies for small needs addressable with existing patterns.

## 7. Constraints

- Do not modify files outside the assigned dispatch/PRD scope.
- Do not replace routers, auth flows, folder structures, or integration contracts as incidental refactors.
- Never assume Firebase, backend, or realtime systems function without verifying against source evidence.
- Never commit personal data, tokens, credentials, or production data to source files, screenshots, logs, or fixtures.
- Never assert that lint, test, or build checks passed without executing them.

## 8. Completion Criteria

- Changes satisfy the PRD and remain compatible with active routes and contracts.
- Loading, error, empty states, and relevant user flows are handled.
- Responsiveness, accessibility, and subscription cleanup are verified within scope.
- Available tests/lint/builds are executed with recorded results.
- Handoff documents modified files, verification evidence, risks, and backend/gamedev coordination needs.
