# Comprehensive Game Environment & Runtime Investigation Report

**Agent**: Explorer 3 (Role: Game Environment Explorer)  
**Date**: 2026-10-11  
**Project Workspace**: `C:\Users\LOQ\Documents\gamukis`  
**Working Directory**: `C:\Users\LOQ\Documents\gamukis\.agents\teamwork\explorer_game_survey_3`  
**Reference Request**: `C:\Users\LOQ\Documents\gamukis\.agents\teamwork\ORIGINAL_REQUEST.md`

---

## Executive Summary

This investigation surveys the **Web Game Application** located inside `gamukis`. It identifies the hosting environment, runtime requirements, network layers, and every major risk factor that could cause browser console errors, unhandled exceptions, missing assets, or game loop freezes. A concrete, end-to-end verification strategy is formulated to validate the acceptance criteria:
1. **The game launches and loads in a local web environment.**
2. **Zero unhandled exceptions or console errors occur during the core gameplay loop.**

---

## 1. Web Game Application Architecture & Workspace Location

The Web Game Application is embedded inside the `Frontend` React single-page application (`gamukis/Frontend`), supported by an optional real-time multiplayer backend service (`gamukis/Backend`).

### 1.1 Directory Structure & File Locations

| Module | Location | Purpose |
|---|---|---|
| **Main Game View** | `Frontend/src/component/component_game/inGame.js` | Core game orchestrator: initializes player, camera, map, coins, questions, skills, and event handlers. |
| **Viewport & Camera** | `Frontend/src/component/component_game/Camera.js` | Viewport translation and tracking following the active player. |
| **Game Map Container** | `Frontend/src/component/component_game/GameMap.js` | Scaled container hosting `TiledMapCanvas`, players, and coins. |
| **2D Tiled Map Canvas** | `Frontend/src/component/component_game/TiledMapCanvas.js` | Dual-phase HTML5 2D canvas rendering (background layer + 48 foreground depth rows). |
| **Map Assets & Data** | `Frontend/src/component/component_game/tiledMapData.js`, `map_assets/` | JSON tile map definition (`map1.json`), tileset images, walkable/blocked grids, staircase routes. |
| **Player Avatar & Sprites** | `Frontend/src/component/component_game/playerInfo.js` | Character DOM node rendering sprites (`characters.png` or SVG), name tag, coins tag. |
| **Coin Nodes** | `Frontend/src/component/component_game/coin.js` | Interactive coin DOM nodes with floating animation. |
| **Quiz Modal** | `Frontend/src/component/component_game/modal.js` | Educational milestone popup (`react-modal`) with questions and options. |
| **Questions Bank** | `Frontend/src/component/component_game/questions.js` | Curriculum questions array with answer options and correct values. |
| **Game Timer** | `Frontend/src/component/component_game/timer.js` | 5-minute countdown timer with time-up transition to `/result`. |
| **Leaderboard** | `Frontend/src/component/component_game/leaderboard.js` | Live coin rankings and top player medals. |
| **Skill System** | `Frontend/src/component/component_game/skill.js` | Visual skill effects (LUMEN, EMBER, TIDAL, THORN, VOID, NOVA). |
| **Input System** | `Frontend/src/component/component_game/useKeyPress.js` | Keyboard event mapping (WASD, Arrow keys, Space, 1–6, C). |
| **On-Screen Controls** | `Frontend/src/component/component_game/molecules/GameControls.js` | Virtual D-pad and skill trigger buttons for touch/mobile devices. |
| **Player Panel** | `Frontend/src/component/component_game/molecules/PlayerPanel.js` | Player name input, color cycle button, and HP hearts. |
| **Routing Entry** | `Frontend/src/App.js` | Routes: `/inGame` (`<InGame />`), `/gamePage` (`<GamePage />`), `/result` (`<Result />`). |
| **Launch Pre-Game Gate** | `Frontend/src/pages/gamePage.js` | Subject category selection before launching into `/InGame`. |
| **Post-Game Summary** | `Frontend/src/pages/result.js` | Game review, quiz accuracy score, answer list. |
| **Socket Network Client** | `Frontend/src/database/realtimeGame.js` | Socket.IO client: handles `game:join`, `player:move`, `player:update`, snapshots. |
| **Auth Network Client** | `Frontend/src/database/firebaseAuth.js` | Anonymous and email authentication via Firebase Auth SDK. |
| **REST Network Client** | `Frontend/src/database/firebaseDatabase.js` | REST client fetching answers and player statistics. |
| **Realtime Backend** | `Backend/index.js`, `src/services/realtimeGameSocket.js` | Node.js Express + Socket.IO server on port 5000 managing rooms and broadcasts. |

---

## 2. Launch & Runtime Environment Investigation

### 2.1 Frontend Hosting Setup
- **Framework**: React 18 SPA initialized via Create React App (`react-scripts` 5.0.1).
- **Default Port**: 3000 (`http://localhost:3000`).
- **HTML Entry**: `Frontend/public/index.html`.
- **JS Entry**: `Frontend/src/index.js` -> `Frontend/src/App.js`.
- **Routes**:
  - `/inGame` loads the canvas and game mechanics immediately.
  - `/gamePage` contains a subject curriculum summary and "Mulai" button leading to `/inGame` (disabled unless `selectedCard` is provided via React Router state).
  - `/result` displays game stats once the timer expires.

### 2.2 Critical Windows Launch Incompatibility (`npm start`)
In `Frontend/package.json`:
```json
"scripts": {
  "start": "CHOKIDAR_USEPOLLING=true WATCHPACK_POLLING=true react-scripts start"
}
```
- **The Issue**: Setting environment variables inline (`VAR=val command`) is a POSIX/bash convention. On Windows, executing `npm start` in PowerShell or Command Prompt will fail immediately with:
  `'CHOKIDAR_USEPOLLING' is not recognized as an internal or external command, operable program or batch file.`
- **Required Fix**: Use `cross-env` or declare the variables inside a `Frontend/.env` file:
  ```env
  CHOKIDAR_USEPOLLING=true
  WATCHPACK_POLLING=true
  ```
  Then simplify `package.json` to `"start": "react-scripts start"`.

### 2.3 Backend Launch & Dependency Bottlenecks
In `Backend/index.js`:
- **Default Port**: 5000 (`http://localhost:5000`).
- **Startup Sequence**:
  ```javascript
  connectMySQL()
    .then(() => connectRedis())
    .then(async () => {
      httpServer.listen(port, () => console.log(`Server aktif di port ${port}`));
    })
    .catch(() => process.exit(1));
  ```
- **The Hard Blocker**: If MySQL server is offline or fails to connect, `connectMySQL()` rejects and `Backend/index.js` terminates via `process.exit(1)`.
- **Downstream Effect on Frontend**:
  When the backend process fails to start:
  1. Frontend Socket.IO client (`realtimeGame.js`) repeatedly fails to connect to `http://localhost:5000`.
  2. `gameSocket.on('connect_error', handleError)` triggers `inGame.js` line 297 (`onError: console.error`), flooding the browser console with error objects.
  3. The `subscribeToGame` promise at line 47 of `realtimeGame.js` hangs waiting for connection, preventing player initialization and coin rendering unless an offline fallback exists.

---

## 3. Console Error Risks & Failure Hotspots (Deep Dive)

### 3.1 Risk 1: 404 Asset Failures via CSS Root-Relative Paths (`/src/images/...`)
- **Severity**: HIGH (Console Error Violation & Broken Visuals)
- **File**: `Frontend/src/component/component_game/style.css`
- **Code Locations**:
  - Line 106: `background: url(/src/images/arrow.png) no-repeat no-repeat;`
  - Line 113: `background: url(/src/images/characters.png);`
  - Line 117 & 154: `background: url(/src/images/shadow.png) no-repeat;`
  - Line 259: `background: url(/src/images/coin.png) no-repeat no-repeat;`
  - Line 275: `background: url(/src/images/coin-shadow.png) no-repeat no-repeat;`
  - Line 545: `background: url('/src/images/char-man-1.svg') no-repeat;`
- **Mechanism**:
  In Create React App / Webpack, URLs in CSS starting with `/` (e.g. `/src/images/characters.png`) are treated as server-absolute paths. They are NOT resolved or bundled into `/static/media/`.
  When loaded in the browser:
  - The browser requests `GET http://localhost:3000/src/images/characters.png`.
  - The dev server (which serves `public/` at root) returns 404 Not Found (or HTML fallback).
  - The console logs: `GET http://localhost:3000/src/images/characters.png 404 (Not Found)`.
  - The player sprite, arrow, coin, and shadows fail to render on screen.
- **Fix Recommendation**:
  Replace root-relative URLs with module-relative paths:
  `background: url(../../images/characters.png);`
  `background: url(../../images/coin.png);`
  `background: url(../../images/shadow.png);`
  `background: url(../../images/arrow.png);`
  `background: url(../../images/coin-shadow.png);`
  `background: url(../../images/char-man-1.svg);`

### 3.2 Risk 2: Uncaught TypeError in Player Component Destructuring
- **Severity**: HIGH (White Screen of Death / Game Crash)
- **File**: `Frontend/src/component/component_game/playerInfo.js`
- **Code Location**:
  - Line 7: `const { name, coins, color, direction, x, y } = player;`
  - Invoked from `Frontend/src/component/component_game/inGame.js` lines 384–391:
    ```javascript
    {randomPlayers.map((key) => (
      <Player
        key={key}
        player={players[key]}
        isCurrentPlayer={key === playerId}
        ...
      />
    ))}
    ```
- **Mechanism**:
  If a player leaves or if `randomPlayers` contains an ID that has been deleted from `players` (e.g. during `onPlayerLeft`), `players[key]` is `undefined`.
  `Player` attempts to destructure `name` from `undefined`, immediately throwing an uncaught `TypeError: Cannot destructure property 'name' of 'player' as it is undefined.`, crashing the entire React component tree.
- **Fix Recommendation**:
  Add defensive guards in `playerInfo.js`:
  ```javascript
  const Player = ({ player, isCurrentPlayer, isButtonMoving = false, skillActive, skillIndex }) => {
    if (!player) return null;
    const { name = 'Pemain', coins = 0, color = 'blue', direction = 'right', x = 0, y = 0 } = player;
  ```

### 3.3 Risk 3: Infinite Deadlock on Milestone Question Progression
- **Severity**: HIGH (Gameplay Loop Freeze)
- **File**: `Frontend/src/component/component_game/inGame.js`
- **Code Locations**:
  - Lines 150–161 (`checkCoinMilestone`):
    ```javascript
    if (milestone <= lastQuestionMilestoneRef.current || pendingQuestionRef.current) return;
    pendingQuestionRef.current = { milestone, reachedCoinCount };
    fetchNextUnansweredQuestion(...);
    ```
  - Lines 413–435 (`CoinModal onQuestionAnswered`):
    ```javascript
    addAnswer(...)
      .then(() => {
        const pendingQuestion = pendingQuestionRef.current;
        if (!pendingQuestion) return;
        lastQuestionMilestoneRef.current = pendingQuestion.milestone;
        pendingQuestionRef.current = null;
        return updatePlayer({ lastQuestionCoins: pendingQuestion.reachedCoinCount });
      })
      .catch(console.error);
    ```
- **Mechanism**:
  When `addAnswer` encounters a network error (or offline backend):
  1. `.catch(console.error)` logs an error to the console.
  2. The `.then()` callback does NOT run.
  3. `pendingQuestionRef.current` remains non-null permanently!
  4. Subsequent calls to `checkCoinMilestone` hit `if (pendingQuestionRef.current) return;` and bail out forever.
  5. The player can collect 10, 20, 50 coins, but no further quiz modals will EVER display.
- **Fix Recommendation**:
  Ensure `pendingQuestionRef.current` is cleared in a `.finally()` or on error catch, and update the coin milestone locally so game progression continues cleanly.

### 3.4 Risk 4: Async Socket Subscription Cleanup Race Condition
- **Severity**: MEDIUM (Memory Leak & Duplicate Network Listeners)
- **File**: `Frontend/src/component/component_game/inGame.js`
- **Code Locations**:
  - Lines 221–316 (`useEffect` observing auth):
    ```javascript
    subscribeToGame({...}).then((cleanup) => {
      cleanupRealtimeRef.current = cleanup;
    }).catch(console.error);

    return () => {
      unsubscribe();
      cleanupRealtimeRef.current?.();
    };
    ```
- **Mechanism**:
  `subscribeToGame` is asynchronous (awaiting `getSocket()` and `game:join`).
  If the component unmounts quickly (e.g. fast page navigation or React 18 StrictMode double-mounting):
  - The cleanup function runs immediately, but `cleanupRealtimeRef.current` is still `null`.
  - When `subscribeToGame` finishes in the background, `cleanupRealtimeRef.current` is assigned, but `cleanup()` is never called.
  - The socket remains connected, maintaining active listeners in the background.
  - Next time `/inGame` mounts, a second socket connection is initiated, causing dual subscriptions and duplicate player instances.
- **Fix Recommendation**:
  Use an `isMounted` flag:
  ```javascript
  let isMounted = true;
  subscribeToGame({...}).then((cleanup) => {
    if (!isMounted) {
      cleanup();
      return;
    }
    cleanupRealtimeRef.current = cleanup;
  });
  return () => {
    isMounted = false;
    cleanupRealtimeRef.current?.();
  };
  ```

### 3.5 Risk 5: Missing DOM API Mocks in Jest Test Environment
- **Severity**: MEDIUM (Verification / CI Blocker)
- **Files**:
  - `Frontend/src/component/component_game/Camera.js` line 21 (`ResizeObserver`)
  - `Frontend/src/component/component_game/TiledMapCanvas.js` line 60 (`canvas.getContext('2d')`)
- **Mechanism**:
  Jest uses `jsdom`, which does NOT implement `ResizeObserver` or `HTMLCanvasElement.prototype.getContext('2d')`.
  Running automated tests against `Camera.js` throws: `ReferenceError: ResizeObserver is not defined`.
  Rendering `TiledMapCanvas` in tests results in `canvas.getContext` returning `null`.
- **Fix Recommendation**:
  Polyfill `ResizeObserver` and mock 2D canvas context in `Frontend/src/setupTests.js` or dedicated game test harness.

### 3.6 Risk 6: Unhandled Promise Rejections in `updatePlayer`
- **Severity**: MEDIUM (Console Error Violation)
- **File**: `Frontend/src/component/component_game/inGame.js`
- **Code Locations**:
  - Lines 106, 116, 178, 192, 302, 331, 340, 429
  - E.g.: `updatePlayer({ name: newName }).catch(console.error);`
- **Mechanism**:
  When socket is disconnected or backend returns `{ ok: false }`, `realtimeGame.js` rejects the promise. Because the handler is `.catch(console.error)`, every update emits a red error in the browser console.
- **Fix Recommendation**:
  Handle errors gracefully via structured logger or user-friendly notification rather than raw `console.error`.

---

## 4. Concrete Test & Verification Strategy

To verify the acceptance criteria:
- **(a) The game can be launched/loaded in a local web environment.**
- **(b) No unhandled exceptions or errors appear in the browser console during the main gameplay loop.**

The following 3-tier testing strategy is established:

```
+-------------------------------------------------------------------+
| Tier 1: Unit & Component Mock Verification (Jest / React Testing) |
| - Mocks: ResizeObserver, Canvas 2D context, Socket.IO, Auth       |
| - Verifies: Zero console.error/warn during mount, movement, modal |
+-------------------------------------------------------------------+
                                  |
+-------------------------------------------------------------------+
| Tier 2: Headless Browser E2E Console Audit (Puppeteer / Playwright)|
| - Intercepts: page.on('console', 'pageerror', 'requestfailed')    |
| - Actions: WASD move, coin collect, skill cast, modal submit      |
| - Asserts: zero 404s, zero uncaught exceptions, zero console.error|
+-------------------------------------------------------------------+
                                  |
+-------------------------------------------------------------------+
| Tier 3: Standalone / Offline Resilience Verification              |
| - Verifies graceful fallback when backend socket is unavailable   |
+-------------------------------------------------------------------+
```

### 4.1 Tier 1: Automated Component Test Specification (`gameLoop.test.js`)
Create `Frontend/src/__tests__/game/gameLoop.test.js`:
- Mock `ResizeObserver`:
  ```javascript
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  ```
- Mock `HTMLCanvasElement.prototype.getContext`:
  ```javascript
  HTMLCanvasElement.prototype.getContext = () => ({
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    transform: jest.fn()
  });
  ```
- Spy on `console.error` and `console.warn`:
  ```javascript
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  // render <InGame />
  // trigger movements and events
  expect(errorSpy).not.toHaveBeenCalled();
  expect(warnSpy).not.toHaveBeenCalled();
  ```

### 4.2 Tier 2: Headless Browser Console Error Interceptor (`verify-game-console.js`)
An automated Puppeteer/Playwright test script executing against `http://localhost:3000/inGame`:
```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const networkErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('response', (res) => {
    if (res.status() >= 400) networkErrors.push(`${res.status()} ${res.url()}`);
  });

  await page.goto('http://localhost:3000/inGame', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.game-wrapper', { timeout: 5000 });

  // Simulate Core Gameplay Loop
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('KeyD');
    await new Promise(r => setTimeout(r, 250));
    await page.keyboard.press('KeyS');
    await new Promise(r => setTimeout(r, 250));
  }
  await page.keyboard.press('KeyC'); // Change color
  await page.keyboard.press('Space'); // Cast skill

  await browser.close();

  console.log('Console Errors:', consoleErrors);
  console.log('Page Errors:', pageErrors);
  console.log('Network 404s:', networkErrors);

  if (consoleErrors.length > 0 || pageErrors.length > 0 || networkErrors.length > 0) {
    console.error('VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('VERIFICATION PASSED: ZERO CONSOLE ERRORS');
  }
})();
```

---

## 5. Synthesis & Prioritized Action Items for Implementers

| Priority | Issue / Risk Area | Affected File(s) | Recommended Action |
|---|---|---|---|
| **P0** | Asset 404 Errors | `Frontend/src/component/component_game/style.css` | Fix root-relative `url(/src/images/...)` paths to relative `url(../../images/...)`. |
| **P0** | Windows `npm start` Crash | `Frontend/package.json` | Remove inline env vars from `npm start` script; move to `Frontend/.env`. |
| **P0** | Null Pointer in `<Player />` | `Frontend/src/component/component_game/playerInfo.js` | Add `if (!player) return null;` guard to prevent white-screen crashes. |
| **P1** | Question Milestone Freeze | `Frontend/src/component/component_game/inGame.js` | Clear `pendingQuestionRef.current` in error handler/finally so milestones never deadlock. |
| **P1** | Async Socket Cleanup Race | `Frontend/src/component/component_game/inGame.js` | Add `isMounted` flag inside `useEffect` to prevent orphan background sockets. |
| **P2** | Socket `connect_error` Spam | `Frontend/src/component/component_game/inGame.js` | Replace raw `onError: console.error` with controlled connection state indicator. |
| **P2** | Jest Test DOM API Mocks | `Frontend/src/setupTests.js` | Add `ResizeObserver` and Canvas 2D context mocks for clean automated test runs. |

