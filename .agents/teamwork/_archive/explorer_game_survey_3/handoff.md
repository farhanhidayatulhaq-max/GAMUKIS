# Handoff Report — Game Environment Explorer (Explorer 3)

## 1. Observation

1. **Web Game Application Location**:
   - Main Game Component: `C:\Users\LOQ\Documents\gamukis\Frontend\src\component\component_game\inGame.js`
   - Map & Canvas Components: `Frontend/src/component/component_game/GameMap.js`, `Frontend/src/component/component_game/TiledMapCanvas.js`, `Frontend/src/component/component_game/tiledMapData.js`
   - Viewport & Camera: `Frontend/src/component/component_game/Camera.js`
   - Player & Entity Components: `Frontend/src/component/component_game/playerInfo.js`, `Frontend/src/component/component_game/coin.js`
   - UI & Modals: `Frontend/src/component/component_game/modal.js`, `Frontend/src/component/component_game/questions.js`, `Frontend/src/component/component_game/timer.js`, `Frontend/src/component/component_game/leaderboard.js`, `Frontend/src/component/component_game/skill.js`
   - Controls: `Frontend/src/component/component_game/useKeyPress.js`, `Frontend/src/component/component_game/molecules/GameControls.js`, `Frontend/src/component/component_game/molecules/PlayerPanel.js`
   - App Routing: `Frontend/src/App.js` routes `/inGame` (`<InGame />`), `/gamePage` (`<GamePage />`), `/result` (`<Result />`).
   - Backend Service: `Backend/index.js`, `Backend/src/services/realtimeGameSocket.js`, `Backend/src/services/realtimeGameService.js`.

2. **Root-Relative CSS Asset URLs**:
   In `Frontend/src/component/component_game/style.css`:
   - Line 106: `background: url(/src/images/arrow.png) no-repeat no-repeat;`
   - Line 113: `background: url(/src/images/characters.png);`
   - Line 117 & 154: `background: url('/src/images/shadow.png') no-repeat;` / `background: url(/src/images/shadow.png) no-repeat no-repeat;`
   - Line 259: `background: url(/src/images/coin.png) no-repeat no-repeat;`
   - Line 275: `background: url(/src/images/coin-shadow.png) no-repeat no-repeat;`
   - Line 545: `background: url('/src/images/char-man-1.svg') no-repeat;`
   In `Frontend/public`: `src` directory does NOT exist. Files in `public` are: `favicon.ico`, `index.html`, `manifest.json`, `robots.txt`, `stylesheets`.

3. **Windows `npm start` Launch Script**:
   In `Frontend/package.json`:
   - Line 6: `"start": "CHOKIDAR_USEPOLLING=true WATCHPACK_POLLING=true react-scripts start"`
   Running this directly in Windows cmd or powershell fails because inline environment variable assignment is POSIX-only.

4. **Unhandled TypeError in Player Rendering**:
   In `Frontend/src/component/component_game/playerInfo.js`:
   - Line 7: `const { name, coins, color, direction, x, y } = player;`
   In `Frontend/src/component/component_game/inGame.js`:
   - Lines 383–392:
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
   If `players[key]` is undefined, `playerInfo.js` throws `TypeError: Cannot destructure property 'name' of 'player' as it is undefined.`

5. **Question Progression Milestone Deadlock on Error**:
   In `Frontend/src/component/component_game/inGame.js`:
   - Line 154: `if (milestone <= lastQuestionMilestoneRef.current || pendingQuestionRef.current) return;`
   - Line 157: `pendingQuestionRef.current = { milestone, reachedCoinCount };`
   - Lines 423–431:
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
   If `addAnswer` rejects, `.then` does not execute and `pendingQuestionRef.current` remains non-null forever, permanently blocking all future questions.

6. **Socket Connect Error Spam & Hanging Promise**:
   In `Frontend/src/component/component_game/inGame.js`:
   - Line 297: `onError: console.error`
   In `Frontend/src/database/realtimeGame.js`:
   - Line 45: `gameSocket.on('connect_error', handleError);`
   - Lines 47–55: `await new Promise((resolve, reject) => { gameSocket.emit('game:join', player, callback); });`
   When the backend is down, Socket.IO emits `connect_error` repeatedly, invoking `console.error` every few seconds, while the `emit` acknowledgment callback never fires because packets are buffered while disconnected.

7. **Backend Startup Dependency**:
   In `Backend/index.js`:
   - Lines 79–88:
     ```javascript
     connectMySQL()
       .then(() => connectRedis())
       .then(async () => {
         ...
         httpServer.listen(port, () => console.log(`Server aktif di port ${port}`));
       })
       .catch(() => process.exit(1));
     ```
   If MySQL is offline, the backend process immediately terminates.

8. **DOM API Mocks in Jest**:
   In `Frontend/src/component/component_game/Camera.js`:
   - Line 21: `const resizeObserver = new ResizeObserver(updateViewportSize);`
   `Frontend/src/setupTests.js` does not mock `ResizeObserver` or `canvas.getContext('2d')`.

---

## 2. Logic Chain

1. **From Observation 1**: The Web Game Application is entirely located within `Frontend/src/component/component_game/` and routed at `/inGame`.
2. **From Observation 2**: In Create React App, CSS paths starting with `/src/images/` are not bundled into `/static/media/`. The browser requests them from the static web server at `http://localhost:3000/src/images/...`. Because `Frontend/public/src/images` does not exist, the server returns 404. Consequently, HTTP 404 errors appear in the browser console, and character/coin sprites fail to display.
3. **From Observation 3**: Windows Command Prompt and PowerShell do not support inline variable assignments like `CHOKIDAR_USEPOLLING=true react-scripts start`. Attempting to launch the dev server with `npm start` on Windows results in a terminal command syntax error unless `cross-env` is used or variables are moved to `.env`.
4. **From Observation 4**: In React's reconciliation loop, `randomPlayers` can contain an ID that was recently removed from `players` (e.g. on `player:left`). Passing an undefined `player` prop to `<Player />` causes an uncaught `TypeError` during render, which crashes the React component tree and produces a red error in the browser console.
5. **From Observation 5**: If the network or backend fails during `addAnswer`, `pendingQuestionRef.current` is never reset to `null`. As a consequence, `checkCoinMilestone` bails out on every subsequent coin collected, freezing question progression for the rest of the gameplay session and logging uncaught rejection to `console.error`.
6. **From Observation 6 & 7**: If backend dependencies (MySQL) are unavailable, the backend exits. The frontend client attempts to connect to port 5000, triggering repeated `connect_error` events that invoke `console.error`. This directly violates acceptance criterion (b) ("No unhandled exceptions or errors appear in the browser console").
7. **From Observation 8**: Running automated tests against the game without mocking `ResizeObserver` will throw `ReferenceError: ResizeObserver is not defined` under Jest jsdom.

---

## 3. Caveats

- **External Network Access**: Firebase Auth (`signInAnon`) connects to Google's Firebase servers (`ujicoba-52016.firebaseapp.com`). In a completely offline sandbox with no external internet, anonymous sign-in will fail unless Firebase Auth is mocked or configured for local emulator.
- **MySQL / Redis Setup**: Local MySQL server state was not modified (read-only investigation). A local database container or mock server is necessary if full real-time multiplayer features are to be tested locally.
- **Read-Only Constraint**: No source code files in `Frontend/` or `Backend/` were modified during this investigation.

---

## 4. Conclusion

The Web Game Application in `gamukis` has an established 2D canvas and real-time socket architecture, but contains 4 critical blockers that prevent meeting the acceptance criteria:
1. **Broken CSS Asset Paths**: Root-relative `/src/images/...` URLs in `style.css` cause 404 console errors and invisible game sprites.
2. **Windows Launch Script Incompatibility**: Inline environment variables in `Frontend/package.json` prevent launching via standard `npm start` on Windows.
3. **Uncaught TypeError Risk**: Missing null guards in `playerInfo.js` cause white-screen crashes if player data is momentarily undefined.
4. **Milestone Progression Deadlock**: Failure in `addAnswer` locks question progression permanently due to unhandled promise rejection and sticky ref state.

Fixing these four localized issues will ensure the game launches cleanly and runs the core gameplay loop with zero console errors.

---

## 5. Verification Method

### 5.1 Independent Verification of Current Issues
1. **Inspect CSS Image Paths**:
   ```powershell
   Select-String -Path "Frontend\src\component\component_game\style.css" -Pattern "url\(/src/images"
   ```
   *Expected Result*: Matches lines 106, 113, 117, 154, 259, 275, 545.

2. **Inspect Windows Launch Script**:
   ```powershell
   Get-Content "Frontend\package.json" | Select-String -Pattern "CHOKIDAR_USEPOLLING"
   ```
   *Expected Result*: Line 6 contains inline POSIX env vars.

3. **Run Existing Test Suite**:
   ```powershell
   cd Frontend; npm test -- --watchAll=false
   ```
   *Expected Result*: 8 test suites pass (all membership tests), demonstrating zero test coverage for the game module.

### 5.2 Verification After Fix Implementation
1. **Launch Test**:
   - Start frontend: `cd Frontend; npm start` (or `npx cross-env CHOKIDAR_USEPOLLING=true react-scripts start`).
   - Navigate to `http://localhost:3000/inGame`.
   - Verify page renders canvas, timer, player avatar, coins, and controls.
2. **Console Audit**:
   - Open browser Developer Tools -> Console.
   - Play the game: move player with WASD/Arrows, collect coins, trigger quiz modal, answer question, wait for timer.
   - Verify: Zero red errors, zero 404 network errors, zero uncaught promise rejections.
3. **Automated Test Run**:
   - Execute newly added game test suite: `npm test -- --watchAll=false --testPathPattern=game`.

