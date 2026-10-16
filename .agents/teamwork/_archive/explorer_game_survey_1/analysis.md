# Technical Analysis: Web Game Loop Architecture & Bug Survey

**Agent**: Explorer 1 (Game Loop Explorer)  
**Date**: 2026-10-11  
**Target Codebase**: Gamukis Web Game Application (`Frontend/src/component/component_game`, `Frontend/src/pages/gamePage.js`, `Frontend/src/pages/result.js`, `Backend/src/services/realtimeGameSocket.js`, `Backend/src/services/realtimeGameService.js`)

---

## 1. Executive Summary

A comprehensive, read-only architectural investigation and bug audit was conducted on the Gamukis Web Game Application. The application is a multiplayer educational 2D tile-based adventure game where players explore a Tiled map, collect coins, answer curriculum quiz questions at coin milestones, and compete on a realtime leaderboard before a 5-minute timer expires.

The survey identified **13 critical bugs, unhandled exceptions, race conditions, and architectural flaws** spanning the game loop, input handling, player state management, quiz progression, and backend socket authorization. The most critical issue is an unhandled `TypeError` in `Player.js` causing a total UI crash when any player disconnects, alongside a milestone hijacking bug where one player's coin pickup triggers quiz popups on other players' screens.

---

## 2. Codebase Structure & Directory Layout

### 2.1 Directory Map

```text
gamukis/
├── Frontend/
│   ├── src/
│   │   ├── App.js                                # Application routes (/gamePage, /inGame, /result)
│   │   ├── pages/
│   │   │   ├── gamePage.js                       # Mapel/card selection, curriculum preview, start trigger
│   │   │   ├── result.js                         # Game-over summary, accuracy, score, answer breakdown
│   │   │   └── home.js                           # Home page with category cards (SAINTEK/SOSHUM)
│   │   ├── component/
│   │   │   ├── component_game/
│   │   │   │   ├── inGame.js                     # Central game orchestrator & state manager
│   │   │   │   ├── GameMap.js                    # Scaled map wrapper
│   │   │   │   ├── TiledMapCanvas.js             # 2D canvas tile renderer & foreground row slicing
│   │   │   │   ├── Camera.js                     # Viewport tracking, clamping, and CSS 3D transforms
│   │   │   │   ├── playerInfo.js                 # Player sprite, animation, name tag, depth sorting
│   │   │   │   ├── coin.js                       # Coin sprite rendering & positioning
│   │   │   │   ├── modal.js                      # Quiz modal (CoinModal) with multiple-choice buttons
│   │   │   │   ├── questions.js                  # Question bank (20 questions)
│   │   │   │   ├── timer.js                      # 5-minute countdown clock
│   │   │   │   ├── skill.js                      # Skill definitions (Lumen, Ember, etc.) & visual effects
│   │   │   │   ├── leaderboard.js                # Top 5 player rankings & self-rank indicator
│   │   │   │   ├── useKeyPress.js                # Keyboard input hook with movement scheduling
│   │   │   │   ├── tiledMapData.js               # Map metadata, collision spaces, stairs, platforms
│   │   │   │   ├── utils.js                      # Collision detection (canMoveTo), spawn generator
│   │   │   │   ├── map_assets/                   # Tiled JSON (map1.json) and png tilesets
│   │   │   │   ├── atoms/                        # PlayerColorButton, PlayerHealth, PlayerNameInput, SkillButton
│   │   │   │   └── molecules/                    # GameControls (D-pad & skills), PlayerPanel
│   │   │   └── component_result/
│   │   │       ├── answerList.js                 # Answer evaluation list with status tags
│   │   │       └── molecules/AnswerCard.js       # Individual question card review
│   │   └── database/
│   │       ├── firebaseAuth.js                   # Anonymous & Google auth observer
│   │       ├── firebaseDatabase.js               # REST client for players, coins, answers, history
│   │       └── realtimeGame.js                   # Socket.IO client interface for game events
└── Backend/
    ├── index.js                                  # Express HTTP + Socket.IO server setup
    ├── src/
    │   ├── services/
    │   │   ├── realtimeGameSocket.js             # Socket.IO event router, lobbies, coin spawner, timer finalizer
    │   │   ├── realtimeGameService.js            # Redis data layer (players, coins, leaderboard)
    │   │   ├── historyService.js                 # MySQL game history persistence
    │   │   └── roomService.js                    # Lobby/room management
    │   ├── routes/
    │   │   └── adminRoomRoute.js                 # Admin room & history endpoints
    │   ├── middlewares/
    │   │   ├── anyAuthMiddleware.js              # Token decoding & role resolution
    │   │   └── roleMiddleware.js                 # Role & permission authorization
    │   └── config/Database/
    │       └── Firebase/players.js               # REST routes for /api/players (answers, status, etc.)
```

---

## 3. Game Loop Architecture & Lifecycle

### 3.1 Loop Paradigm & Ticking
The Gamukis web game runs on a **hybrid event-driven React state and Socket.IO tick architecture**:
- **Continuous Movement Loop**: `useKeyPress.js` detects WASD/Arrow keys and recursively calls `scheduleNextMove` with `window.setTimeout`.
  - Normal terrain: `NORMAL_MOVE_INTERVAL_MS = 220ms`
  - Sand/Mud terrain: `SAND_MOVE_INTERVAL_MS = 440ms`
- **Render Loop**: Driven by React virtual DOM reconciliation + CSS GPU transforms (`transform: translate3d(x, y, 0)`). Tile rendering uses standard HTML5 Canvas 2D contexts blitted once during image load in `TiledMapCanvas.js`.
- **Server Tick / Spawner**:
  - `startCoinSpawner`: Server checks every `3000ms`, pruning stale coins and adding new coins up to `MAX_COINS = 20` near active player clusters.
  - `startHistoryFinalizer`: Server checks every `1000ms` for player sessions exceeding `GAME_DURATION_MS = 300,000ms` (5 minutes) to save final history records to MySQL.

### 3.2 State Machine
```text
[Loading / Home]
       │
       ▼ (Select subject card)
   [GamePage]
       │
       ▼ (Click 'Mulai')
    [InGame] ──► observeAuthState (Firebase / Manual)
       │               │
       │               ▼
       │         subscribeToGame (Socket.IO 'game:join')
       │               │
       │               ▼
       │         Receive 'game:snapshot' (players, coins, leaderboard)
       │
       ├──► Movement: WASD/Arrows ──► canMoveTo() ──► emit 'player:move'
       ├──► Coins: Server detects collision ──► emit 'coin:claimed'
       ├──► Milestones: coins % 5 === 0 ──► fetchNextUnansweredQuestion() ──► CoinModal open
       ├──► Quiz: Option selected ──► addAnswer() ──► updatePlayer(lastQuestionCoins) ──► CoinModal close
       ├──► Skills: Space / 1-6 ──► castSkill() ──► Client visual effect (550ms) + cooldown (1200ms)
       └──► Timeout / Death: 5 min timer expires OR health <= 0 ──► navigate('/result')
               │
               ▼
           [Result] ──► getAnswers() ──► Render ScoreBox, Accuracy, AnswerList
```

---

## 4. Comprehensive Bug & Vulnerability Survey

| # | Bug Title | Impact Level | Exact File Location | Root Cause | Recommended Fix |
|---|---|---|---|---|---|
| **1** | Fatal Destructuring Crash on Player Disconnect | **CRITICAL** (Crash) | `Frontend/src/component/component_game/playerInfo.js:7` & `inGame.js:274-280, 383-392` | `onPlayerLeft` deletes `leftPlayerId` from `players`, but `randomPlayers` still holds the ID. `Player.js:7` attempts `const { name, coins } = player` on `undefined`, triggering unhandled `TypeError`. | Add `if (!player) return null;` in `Player.js`. In `inGame.js`, filter `randomPlayers.filter(id => Boolean(players[id]))`. |
| **2** | Screen-Hijack & Quiz Milestone Desync Across Players | **CRITICAL** (Logic Error) | `Frontend/src/component/component_game/inGame.js:272, 295` | `onPlayerUpdated` and `onCoinClaimed` call `checkCoinMilestoneRef.current(updatedPlayer)` for ANY player, without checking if `updatedPlayer.id === playerId`. Other players' coins trigger popups on the local screen. | In `checkCoinMilestone(playerData)` (line 151), add guard: `if (!playerData \|\| playerData.id !== playerId) return;`. |
| **3** | Permanent Quiz Lockout on Failed Answer Submission | **HIGH** (Gameplay Lock) | `Frontend/src/component/component_game/inGame.js:417-433` | In `onQuestionAnswered`, if `addAnswer` promise rejects (403 or network issue), `.catch(console.error)` runs and `pendingQuestionRef.current` is never cleared, permanently blocking all future questions. | Wrap `pendingQuestionRef.current = null;` inside a `.finally()` block or handle state rollback in `.catch()`. |
| **4** | HTTP 403 Forbidden on `/players/answers/:playerId` for Non-Admin Users | **HIGH** (API / Auth) | `Backend/src/config/Database/Firebase/players.js:104, 116` & `Backend/src/middlewares/roleMiddleware.js:31-37` | URL param is `${playerId}:${sessionId}`. `requireSelfOr` compares `req.params.playerId === req.account.userId`, which fails due to `:${sessionId}`. Fallback checks `players:write_any` (admin only). | Update `requireSelfOr` to match `req.params.playerId.split(':')[0] === req.account.userId` and allow guest/siswa ownership. |
| **5** | False-Positive Cheater Flags from Movement Latency & Multi-Key Press | **HIGH** (Anticheat / Movement) | `Frontend/src/component/component_game/inGame.js:120-139`, `useKeyPress.js:44-54`, `Backend/.../realtimeGameService.js:114-118` | `handleArrowPress` reads position from stale React state if server response is delayed. Sending distance 0 or 2 triggers backend `flagPlayer('invalid_move')` and cheater flag increments. | Track current movement position in a mutable client ref (`currentPosRef`) and lock `useKeyPress` to single-axis moves. |
| **6** | Character Movement & Skill Casting While Quiz Modal is Active | **MEDIUM** (Input Glitch) | `Frontend/src/component/component_game/inGame.js:120-148` & `useKeyPress.js:22-55` | `handleArrowPress` and `castSkill` do not check `isModalOpen`. Players can wander the map, take coins, and cast skills while answering questions. | Add `if (isModalOpen) return ...;` at start of `handleArrowPress` and `castSkill`. |
| **7** | Duplicate Question Strings Skipping 3 Questions & Breaking Results | **HIGH** (Content / Logic) | `Frontend/src/component/component_game/questions.js:30, 129, 155, 171` & `answerList.js:18` | Question prompt for "Gaya bahasa yang melukiskan..." is duplicated across 4 distinct questions. Answering the first skips the next 3, and result screen displays wrong choices. | Assign unique prompts and explicit `id` attributes to all questions; match by question ID rather than string equality. |
| **8** | Omission of Health Damage Mechanic & Missing Game-Over Check | **MEDIUM** (Gameplay Mechanic) | `Frontend/src/component/component_game/inGame.js:417-433` & `database/realtimeGame.js:96-107` | `damagePlayer` is implemented in `realtimeGame.js` but never called in `onQuestionAnswered` on incorrect answers. Health never decreases, and health <= 0 never ends game. | Call `damagePlayer()` when `correct === false`. Add health check in `InGame` to navigate to `/result` when hearts reach 0. |
| **9** | Recurring 403 Forbidden Console Spam on `gamePage.js` | **MEDIUM** (Console Error) | `Frontend/src/component/component_game/leaderboard.js:33-47` & `Backend/.../players.js:64` | `Leaderboard` polls `GET /api/players` every 5s when `playersData` is absent. Endpoint requires `players:read_all` (guru/admin only), flooding console for students. | Avoid polling restricted endpoint or provide a public sanitized leaderboard API. |
| **10** | State Setter Anti-Pattern & Random Player Popping in `selectRandomPlayers` | **MEDIUM** (React Anti-pattern) | `Frontend/src/component/component_game/inGame.js:202-219, 267-270` | `selectRandomPlayers` calls `setRandomPlayers` inside `setPlayers` updater. It also calls `Math.random()` on every player move, causing players on screen to flicker. | Move player selection outside updater function, and only re-select when player roster changes (join/leave), not on movement. |
| **11** | Stale Session ID Leaking Across Consecutive Game Runs | **LOW** (Session State) | `Frontend/src/pages/result.js:45` & `inGame.js:50-52` | `sessionStorage.removeItem('gamukis_game_session_id')` is only called inside `.then()`. If `getAnswers` fails, session ID persists into future games. | Clear session ID in `.finally()`, or generate fresh session ID upon clicking "Mulai" in `gamePage.js`. |
| **12** | Player Name Input Erase Glitch Generating Instant Random Name | **LOW** (Input UX) | `Frontend/src/component/component_game/inGame.js:100-108` | `event.target.value \|\| createName()` resets name to a random animal immediately when the user erases the text field, preventing typing. | Allow empty string during editing; apply fallback default name on `onBlur` or Enter. Debounce websocket name updates. |
| **13** | Spatial Filtering Discrepancy Hiding Valid Server Coins | **LOW** (Rendering Glitch) | `Frontend/src/component/component_game/inGame.js:394` & `Backend/.../realtimeGameSocket.js:94-111` | Client filters `coins` using `coinSpawnSpaceSet`. Differing polygon rounding between server and client makes valid server coins invisible. | Render coins directly from server snapshot without secondary client-side spatial filter. |

---

## 5. Architectural Verification & Recommendations

### Recommended Priority for Implementation
1. **P0 (Crashes & Game Breaking)**: Bug #1 (Player crash guard) and Bug #2 (Foreign player milestone screen-hijacking).
2. **P1 (Core Mechanics & Progression)**: Bug #3 (Quiz lockout on failure), Bug #4 (Backend 403 authorization for answers), Bug #7 (Duplicate questions in question bank), and Bug #6 (Modal input pause).
3. **P2 (Quality of Life & Gameplay Polish)**: Bug #5 (Movement position ref / anti-cheat false positives), Bug #8 (Damage & game over), Bug #10 (Player flickering & state updater fix), and Bug #9 (Leaderboard console error).
4. **P3 (Edge Cases)**: Bug #11 (Session ID cleanup), Bug #12 (Name input UX), Bug #13 (Coin rendering filter).

