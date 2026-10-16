---
name: skill-gamedev
description: Use when developing or reviewing Gamukis gameplay in the React/JavaScript frontend, including game views, update/render loops, input, collision, characters, game assets, match outcomes, scores, and realtime integration.
---

# Game Development — Gamukis

## 1. Purpose and Authority

Maintain a seamless and consistent Gamukis gameplay experience across player input, game state, rendering, match outcomes, and server synchronization.

Follow `AGENTS.md`, the approved PRD/dispatch, and `.agents/skills/gamukis-prd-guard/SKILL.md`.

Do not assume external game engines like Unity, Godot, or Phaser. The repository structure demonstrates that the game runs inside the React/JavaScript frontend; inspect active implementations before assuming engine details.

## 2. Identified Game Architecture

Areas visible in the project structure:

- `Frontend/src/pages/game.js`
- `Frontend/src/pages/gamePage.js` and `gamePage.css`
- `Frontend/src/pages/showgame.js`
- `Frontend/src/pages/result.js` and `result.css`
- `Frontend/src/pages/tutorial.js`
- `Frontend/src/component/`, including game feature containers and `component_showGame`.
- `Frontend/src/database/realtimeGame.js` for realtime integration.
- `Frontend/src/images/` with sprites, coins, characters, backgrounds, and visual game assets.

Verify file names and contents on the active checkout before editing. Do not move or consolidate files merely because their names appear adjacent.

## 3. When to Use This Skill

Use when the task involves:
- Game start flows, tutorials, gameplay loops, game over, restarts, and match results.
- Keyboard, pointer, or touch input handlers.
- Update loops, animations, canvas rendering, coordinates, collision, and arena boundaries.
- Sprites, backgrounds, coins, items, skills, and visual feedback.
- Scoring, leaderboards, match history persistence, and game outcomes.
- Realtime integration, room/session lifecycles, reconnects, and state synchronization.
- Browser performance and game component lifecycles.

Use alongside the `frontend` skill for UI layouts, routing, modals, or React components.

Use alongside the `backend` skill if modifications touch score validation, permissions, score persistence, or server socket events.

## 4. Operating Procedures

1. Read core rules, the PRD/dispatch, and guard skills.
2. Trace the flow from the initiating view through gameplay, outcomes, leaderboards, and score persistence.
3. Identify the single source of truth for each state: local component state, Firebase, backend, or realtime Redis.
4. Understand how game and render loops execute. Verify cleanup of animation frames, intervals, listeners, and subscriptions on route changes or unmounting.
5. Preserve existing input bindings and gameplay rules unless the PRD specifies a change.
6. For collision/movement, check arena boundaries, repeated collisions, removed entities, delta time, and lag conditions.
7. For scores and match results, trace the end-to-end flow from score calculation to storage and the results view. Do not create secondary persistence paths.
8. For realtime interactions, use established modules and preserve event names and payload schemas consumed by client and server. Verify active event names in code.
9. Test game start, active play, game over, restart, result displays, and reconnects within scope.
10. Report whether testing was mocked, performed locally, or verified against live realtime/backend services.

## 5. Gamukis Invariants and Integrations

- `realtimeGame.js` serves as the realtime integration module. Audit its implementation before introducing socket clients, Firebase listeners, or alternative synchronization layers.
- Modules `firebaseAuth.js`, `firebaseDatabase.js`, `manualAuth.js`, and `firebaseConfig.js` reside in the database directory. Do not conflate their responsibilities or introduce parallel state stores without proof of requirement.
- Ensure changes across `game`, `gamePage`, `showgame`, `tutorial`, and `result` do not break navigation or state passed to downstream views.
- When gameplay records scores or history, trace the active function and endpoint. Preserve guest/registered user support and role constraints.
- Never substitute frontend checks for server-side authorization.
- Do not alter score formats, realtime events, room structures, or server payloads without approval and cross-layer testing.
- Never trust the client as the sole authoritative source for scores, rewards, or data-mutating actions.
- If guard documentation and active code conflict, record the discrepancy and request a Lead decision before altering critical behavior.

## 6. Performance and Lifecycles

- Avoid instantiating new objects, timers, listeners, or subscriptions every frame.
- Cancel animation frames, timers, event listeners, and subscriptions when gameplay pauses or components unmount.
- Avoid expensive DOM layout recalculations within update/render loops.
- Use delta time or consistent ticks where applicable; do not bind game speed directly to fluctuating frame rates without justification.
- Verify asset scaling and canvas aspect ratios across varying screen resolutions.
- Profile bottlenecks prior to major optimizations; do not alter gameplay for speculative micro-optimizations.

## 7. Constraints

- Do not alter gameplay rules, score calculation, guest access, room/realtime protocols, or history storage outside approved scope.
- Do not introduce third-party game engines or external libraries without justification and approval.
- Do not claim multiplayer/realtime correctness based solely on isolated local testing.
- Do not assume Redis, Socket.IO, or specific server architectures without verifying active source code.
- Never assert that tests passed without executing them.

## 8. Completion Criteria

- Game flows and page transitions are validated end-to-end.
- Input handlers, update/render lifecycles, collision/movement, and cleanup routines are checked.
- Score/result persistence and backend/realtime integrations remain compatible.
- Relevant tests have executed; unavailable external services are documented.
- Handoff records modified files, test scenarios, actual outputs, and verification constraints.
