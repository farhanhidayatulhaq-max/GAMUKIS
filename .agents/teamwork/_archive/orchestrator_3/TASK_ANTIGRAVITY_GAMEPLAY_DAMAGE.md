# Change Order — HP Damage Source: PvP Skills and Enemy Bots

**To:** Antigravity (Google 3.1 Pro), Orchestrator + Core Engineer  
**From:** Architect (Codex), based on user direction  
**Status:** Ready for implementation after recording in Antigravity milestone sequence  
**Associated PRDs:** `PROJECT.md`, `DISPATCH.md`, `.agents/ORCHESTRATION.md` §2

## Objective

Adjust HP concepts and implementation in `inGame`: player HP **is reduced only** when a character is hit by another player's attack skill or damaged by randomly spawned enemy bots. Answering questions incorrectly must no longer decrease HP.

## Mandatory Behaviors

1. Remove damage logic from the incorrect answer handler in `Frontend/src/component/component_game/inGame.js`. Incorrect answers continue to be recorded for statistics/history, but must not trigger damage.
2. Attack skills deployed by players must possess tangible gameplay effects rather than local animations. Skill hits must land on valid target players and reduce target HP. Never damage the caster's own HP.
3. Introduce enemy bots that spawn at valid random map coordinates. Spawn locations must be walkable and clear of obstacles or occupied cells; never spawn bots inside walls, decorative items, outside map boundaries, or directly on players.
4. Bots must have visual representations and clear attack behaviors. Bot attacks reduce player HP only when the server confirms the target is within hit range and conditions.
5. The server is the single source of truth for spawns, target hits, cooldowns, and HP reduction. Clients emit actions/intents and render broadcast state/events. Never accept client-submitted HP values.
6. Bound damage per hit matching the HP model (maximum 3). A single hit event must not register repeatedly due to duplicate socket emits, collision overlap during cooldown, or reconnections.
7. Constrain damage within the same room/lobby; skills must never affect players in different lobbies.
8. Bots and attack events must clean up or reset matching room/session lifecycles so no stale state persists after game restart.

## Implementation and Ownership

Antigravity leads backend core implementation and frontend integration. Inspect active code first:

- `Frontend/src/component/component_game/inGame.js` — halt damage on incorrect answers; dispatch visual/intent skills.
- `Frontend/src/component/component_game/skill.js` and `skill.css` — align visual effects with concrete skill actions.
- `Frontend/src/component/component_game/playerInfo.js` — only if required for bot/attack rendering.
- `Frontend/src/database/realtimeGame.js` — client Socket.IO events.
- `Backend/src/services/realtimeGameSocket.js` — authoritative validation of events and room broadcasts.
- `Backend/src/services/realtimeGameService.js` — atomic player/bot state, collision/hit handling, and damage.
- Walkable map data in `Frontend/src/component/component_game/` and existing server map loaders — apply identical rules for random spawns.

Prior to implementation, review existing changes. Do not overwrite active work. If major UI modifications outside Antigravity ownership are needed, draft a Copilot handoff referencing the established event/state contracts.

## Minimal Inter-Component Contracts

- Define and document request event names, validated payloads, broadcast state events, and bot/hit result schemas before UI integration.
- Client payloads must not contain `targetHealth`, arbitrary damage numbers, or client-asserted collision results.
- All events must include lobby/session identifiers validated against the active player socket.
- The server dispatches health and bot mutations through consistent state updates to all room participants.
- Preserve existing events consumed by players, leaderboards, restarts, history, and room orchestration.

## Acceptance Criteria

- Incorrect answers do not decrease HP and continue being counted in history statistics.
- Attack skills hit players within valid range; target HP decreases once per valid hit; casters and players in other lobbies are unaffected.
- Bots spawn randomly on valid tiles, render on the canvas map, pursue/target players per documented rules, attack within valid range, and damage occurs once per attack cooldown.
- Malformed client payloads, spoofed targets, arbitrary damage, event spam, and cross-lobby hits are rejected.
- Game over, MySQL history, restarts, health resets, and Redis state remain consistent.
- Record balancing decisions (bot counts, spawn intervals, speed/range, attack cooldowns, damage) in handoffs as server-side configurations.
- Add/update realtime backend tests covering valid and invalid cases. Verify client/server gameplay loops manually.

## Required Reporting

Update `.agents/teamwork/orchestrator_3/progress.md` and `handoff.md` with completed requirements, changed files, event contracts, balancing choices, executed tests, manual test outputs, and blockers/risks.
