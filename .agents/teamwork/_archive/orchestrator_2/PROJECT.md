# Project: Web Game Application Bug Fixes & Mechanics Perfection

## Architecture
- **Frontend Game Core**: `Frontend/src/component/component_game/`
  - `inGame.js`: Master game orchestrator, player state, coin collection, milestone questions, socket integration.
  - `playerInfo.js`: Player avatar sprite, movement animation, name rendering, depth sorting.
  - `coin.js`: Coin sprite rendering and positioning.
  - `Camera.js`: Canvas viewport calculation, boundary clamping, 3D translation transform.
  - `useKeyPress.js`: Continuous keyboard movement listener with tick scheduling.
  - `questions.js`: Educational question bank with curriculum options.
  - `modal.js`: Quiz modal dialog triggered at coin milestones.
  - `leaderboard.js`: Real-time score and rank display.
  - `style.css`: Visual styling, sprite asset URLs, and character walking keyframe animations.
- **Backend Realtime Service**: `Backend/src/services/`
  - `realtimeGameSocket.js`: WebSocket lobby rooms, coin spawning, player movement validation.
  - `realtimeGameService.js`: Redis storage for player state, coins, leaderboards.
  - `Firebase/players.js` & `roleMiddleware.js`: REST endpoints for player answers and game stats.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Asset URL Resolution | Replace broken `/src/images/...` URLs in `style.css` with relative paths `../../images/...` and fix `@keyframes` duplicate 100% bug | M1 | Explorers 2 & 3 |
| 2 | Windows Launch Compatibility | Fix POSIX inline environment variables in `Frontend/package.json` for cross-platform execution | M1 | Explorer 3 |
| 3 | Player Crash Guard | Prevent fatal `TypeError` destructuring undefined in `playerInfo.js` and filter `randomPlayers` on disconnect in `inGame.js` | M1 | Explorers 1, 2, 3 |
| 4 | Coin & Camera Resilience | Add null guard in `coin.js`, handle NaN coordinates in `Camera.js`, and guard `ResizeObserver` | M1 | Explorers 2 & 3 |
| 5 | Milestone Screen-Hijack Fix | Ensure `checkCoinMilestone` in `inGame.js` only triggers quiz popups for local player (`playerData.id === playerId`) | M2 | Explorers 1 & 2 |
| 6 | Quiz Milestone Unlock | Clear `pendingQuestionRef.current = null` on error, cancellation, and modal close to prevent permanent quiz deadlock | M2 | Explorers 1, 2, 3 |
| 7 | Modal Input Pause | Suppress character movement and skill actions in `useKeyPress.js` and `inGame.js` while quiz modal is active | M2 | Explorers 1 & 2 |
| 8 | Question Bank Deduplication | Provide unique IDs and prompts for duplicate questions in `questions.js` and track answered questions by ID | M2 | Explorers 1 & 2 |
| 9 | Health Damage & Defeat State | Connect `damagePlayer` to incorrect answers and navigate to `/result` when player health reaches 0 | M2 | Explorers 1 & 2 |
| 10 | Leaderboard Null & Auth Fix | Protect `leaderboard.js` against null `playersData`, fix rank <= 3 null check, and prevent unauthorized 403 polling | M3 | Explorers 1 & 2 |
| 11 | Backend Answers Auth Fix | Allow player ownership check in `roleMiddleware.js` / `players.js` for session ID composite keys | M3 | Explorer 1 |
| 12 | Socket Error Suppression | Suppress noisy `console.error` logs on socket disconnection/reconnection | M3 | Explorer 3 |
| 13 | Comprehensive Verification | Automated tests + browser console error verification ensuring clean launch and error-free gameplay loop | M3 | Explorers 1, 2, 3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Assets, Launch & Crash Prevention | `style.css`, `package.json`, `playerInfo.js`, `coin.js`, `Camera.js` | none | IN_PROGRESS (worker: a6046c31-15e7-4097-a7d3-ad8012e72523) |
| M2 | Gameplay Loop Mechanics & Progression | `inGame.js`, `useKeyPress.js`, `questions.js`, `modal.js`, `realtimeGame.js` | M1 | PLANNED |
| M3 | Auth, Resilience & Final Verification | `leaderboard.js`, `players.js`, socket handling, and comprehensive test suite | M2 | PLANNED |

## Interface Contracts
### Player Component Contract (`playerInfo.js`)
- Props: `{ player: Object | undefined, isCurrentPlayer: Boolean, characterId: Number | String }`
- Behavior: If `player` is falsy or coordinates undefined, safely return `null` without throwing unhandled exceptions.

### Coin Component Contract (`coin.js`)
- Props: `{ coin: Object | undefined }`
- Behavior: If `coin` is falsy or coordinates undefined, safely return `null`.

### Coin Milestone Contract (`inGame.js`)
- Function: `checkCoinMilestone(playerData)`
- Behavior: Verifies `playerData && playerData.id === playerId`. If player is remote, ignore. If local, fetch next question and open modal. On question completion or error, `pendingQuestionRef.current` MUST be reset to `null`.

### Question Bank Contract (`questions.js`)
- Structure: Each question object has `{ id: String|Number, question: String, options: Array, answer: String }`.
- Deduplication: Answers tracked by unique `id`.

## Code Layout
- `Frontend/src/component/component_game/style.css` (owned by M1 Worker)
- `Frontend/package.json` (owned by M1 Worker)
- `Frontend/src/component/component_game/playerInfo.js` (owned by M1 Worker)
- `Frontend/src/component/component_game/coin.js` (owned by M1 Worker)
- `Frontend/src/component/component_game/Camera.js` (owned by M1 Worker)
- `Frontend/src/component/component_game/inGame.js` (owned by M2 Worker)
- `Frontend/src/component/component_game/useKeyPress.js` (owned by M2 Worker)
- `Frontend/src/component/component_game/questions.js` (owned by M2 Worker)
- `Frontend/src/component/component_game/modal.js` (owned by M2 Worker)
- `Frontend/src/component/component_game/leaderboard.js` (owned by M3 Worker)
- `Backend/src/config/Database/Firebase/players.js` (owned by M3 Worker)
- `Frontend/src/__tests__/game/` (owned by M3 Worker / Test Writer)
