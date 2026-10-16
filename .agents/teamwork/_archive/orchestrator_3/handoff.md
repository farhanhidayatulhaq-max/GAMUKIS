# Handoff Report — HP Damage Source: PvP Skills and Enemy Bots

**Date:** 2026-10-11  
**Lead:** Antigravity (Google 3.1 Pro)  
**Related:** Change Order `TASK_ANTIGRAVITY_GAMEPLAY_DAMAGE.md`  

---

## 1. Completed Requirements

1. **Decoupling of Incorrect Answer Damage:**
   - In `Frontend/src/component/component_game/inGame.js`, invocations of `damagePlayer()` within the `CoinModal` callback are completely removed.
   - Incorrect answers continue being recorded in `sessionAnswersRef.current` and persisted to Firebase Realtime Database and MySQL history via `saveGameHistory` (`answer_false` metrics, accuracy, and error descriptions remain 100% intact).
   - Toast notification updated to `'Incorrect Answer!'` without referencing life loss.

2. **PvP Skills & PvE Bot Damage:**
   - Client dispatches skill intent via `castSkillAction({ skillIndex })` (`player:skill`).
   - Server validates that caster is alive (`health > 0`), coordinates are finite and valid, and player skill cooldown has elapsed (`PLAYER_SKILL_COOLDOWN_MS = 1200ms`).
   - Server detects target players situated in the same room/lobby within attack radius (`PLAYER_SKILL_RANGE = 2.5` tiles).
   - Casters and players in other rooms/lobbies never receive damage.
   - Valid target players have 1 HP deducted in Redis (`applyAuthoritativeDamage`) with debounce protection (`DAMAGE_DEBOUNCE_MS = 600ms`), damage clamping (1..3), and `death: 1` status flags if HP reaches 0.
   - Player skills also damage enemy monster bots in range (`damageBot`): bot HP decreases, and upon reaching 0, the bot is removed (`bot:removed`) with toast feedback.
   - Server broadcasts `skill:effect`, `player:updated`, `bot:moved`, and `bot:removed` events across the room.

3. **Authoritative Server Enforcement:**
   - The server via `Backend/src/services/realtimeGameService.js` and `Backend/src/services/realtimeGameSocket.js` is the sole authority mutating HP.
   - Clients cannot submit `targetHealth` or client-calculated damage numbers; direct `player:damage` requests from clients are rejected (`ok: false`).
   - Health values are strictly bounded between 0 and 3.

4. **Enemy Bot System (PvE) & Radar:**
   - **Spawn Coordinates:** Bots spawn randomly only on valid walkable tiles (`coinSpawnPoints`), free from obstacles and at safe distance (> 2 tiles) from active players.
   - **Visual Representation:** Rendered via `<EnemyBot />` component in `Frontend/src/component/component_game/EnemyBot.js` featuring custom SVG styling, name badges, health bars, and attack visual feedback.
   - **MiniMap HUD Radar:** Monster bots are mapped onto the MiniMap (`miniMap.js` and `miniMap.css`) as pulsing red threat markers (`gamukis-minimap-bot`).
   - **AI Behavior & Cooldowns:** Server executes an AI tick loop every 800ms. If players are within detection range (`BOT_AGGRO_RADIUS = 6` tiles), the bot pursues along walkable tiles. When within attack range (`BOT_ATTACK_RADIUS = 1.5` tiles), the bot attacks on cooldown (`BOT_ATTACK_COOLDOWN_MS = 2000ms`), inflicting 1 HP server damage.
   - **Lifecycle Cleanup:** When all players vacate a lobby, rooms are removed (`deleteManagedRoom`), or players reset, all combat entities and bots are safely reclaimed.

---

## 2. Modified and Created Files

### Backend
- `Backend/src/services/realtimeGameService.js`
  - Added server-side `GAMEPLAY_CONFIG`.
  - Implemented authoritative `applyAuthoritativeDamage(playerId, options)`.
  - Exported `GAMEPLAY_CONFIG` and `applyAuthoritativeDamage`.
- `Backend/src/services/realtimeGameSocket.js`
  - Added bot manager: `spawnBotForLobby`, `getLobbyBots`, `clearLobbyBots`, `startBotManager`.
  - Mounted bot spawner loop (5s) and AI tick loop (800ms).
  - Added `player:skill` socket listener with cooldown and distance validation.
  - Rejected direct client-driven `player:damage`.
  - Integrated bot snapshots into `getLobbySnapshot` and bot cleanup into `leaveLobby`/`deleteManagedRoom`.
- `Backend/test/gameplay_damage_and_bots.test.js`
  - Unit tests for `applyAuthoritativeDamage`, health clamping 0-3, hit debouncing, room isolation, and walkable tile spawning.

### Frontend
- `Frontend/src/database/realtimeGame.js`
  - Added socket handlers `onBotSpawned`, `onBotMoved`, `onBotAttack`, `onBotRemoved`, `onSkillEffect`.
  - Added intent caller `castSkillAction({ skillIndex })`.
- `Frontend/src/component/component_game/EnemyBot.js`
  - React component rendering visual monster bots on canvas.
- `Frontend/src/component/component_game/EnemyBot.css`
  - Styles and movement/attack animations for monster bots.
- `Frontend/src/component/component_game/inGame.js`
  - Removed `damagePlayer()` call on incorrect answers in `CoinModal`.
  - Added `bots` state management and event synchronization.
  - Dispatched `castSkillAction` upon skill triggers.
  - Rendered `<EnemyBot>` within `<GameMap>`.
- `Frontend/src/__tests__/game/gameplay_damage_authoritative.test.js`
  - Tests for `<EnemyBot>` rendering, damage decoupling, and `castSkillAction` exports.

---

## 3. Inter-Component Event Contract

| Event Name | Type | Direction | Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `player:skill` | Socket.IO emit + ack | Client -> Server | `{ skillIndex: number }` | Sends player skill intent to server. |
| `skill:effect` | Socket.IO broadcast | Server -> Lobby Room | `{ casterId: string, skillIndex: number, hitPlayerIds: string[] }` | Broadcasts skill visual effect & landed targets. |
| `player:updated` | Socket.IO broadcast | Server -> Lobby Room | `PlayerObject` | Player state update (including health changes). |
| `bot:spawned` | Socket.IO broadcast | Server -> Lobby Room | `{ bot: BotObject }` | New bot spawned on valid walkable tile. |
| `bot:moved` | Socket.IO broadcast | Server -> Lobby Room | `{ botId, x, y, direction, state }` | Synchronizes bot monster movement coordinates. |
| `bot:attack` | Socket.IO broadcast | Server -> Lobby Room | `{ botId, targetPlayerId, damage }` | Attack event by bot against target player. |
| `bot:removed` | Socket.IO broadcast | Server -> Lobby Room | `{ botId }` | Removes bot on room reset or match completion. |

---

## 4. Server-Side Balancing Decisions

All parameters are configured server-side (`Backend/src/services/realtimeGameService.js`):
- `MAX_HEALTH`: 3 (maximum player health).
- `SKILL_DAMAGE`: 1 (damage per hit from player skills).
- `BOT_DAMAGE`: 1 (damage per hit from monster bot attacks).
- `PLAYER_SKILL_COOLDOWN_MS`: 1200ms (player skill cooldown).
- `PLAYER_SKILL_RANGE`: 2.5 tiles (effective player skill range).
- `DAMAGE_DEBOUNCE_MS`: 600ms (brief invulnerability period preventing duplicate HP loss).
- `MAX_BOTS_PER_LOBBY`: 3 (maximum active bots per room).
- `BOT_SPAWN_INTERVAL_MS`: 5000ms (bot spawn check interval).
- `BOT_TICK_INTERVAL_MS`: 800ms (AI tick interval for movement & attack checks).
- `BOT_AGGRO_RADIUS`: 6 tiles (player detection radius triggering pursuit).
- `BOT_ATTACK_RADIUS`: 1.5 tiles (bot attack distance).
- `BOT_ATTACK_COOLDOWN_MS`: 2000ms (bot attack cooldown).

---

## 5. Verification Results and Automated Testing

1. **Backend Unit & Integration Tests:**
   - Command: `npm test` in `Backend/` directory.
   - Result: **35 passed, 0 failed, 100% pass rate** (including `Gameplay Damage: applyAuthoritativeDamage` and `Bot Enemy Management`).
2. **Frontend Test Suite:**
   - Command: `npm test -- --watchAll=false` in `Frontend/` directory.
   - Result: **18 test suites passed, 219 tests passed, 0 failed, 100% pass rate** (including `Authoritative Gameplay Damage & Bot Enemy Suite`).
3. **Frontend Production Build:**
   - Command: `npm run build` in `Frontend/` directory.
   - Result: **Compiled successfully** without errors.
