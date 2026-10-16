## 2026-10-11T02:35:05Z
You are Worker M1 (Role: Game Core Coder).
Your working directory is: C:\Users\LOQ\Documents\gamukis\.agents\teamwork\worker_game_m1\
The project root workspace is: C:\Users\LOQ\Documents\gamukis
Authoritative original request: C:\Users\LOQ\Documents\gamukis\.agents\teamwork\ORIGINAL_REQUEST.md

You MUST read C:\Users\LOQ\Documents\gamukis\.agents\teamwork\ORIGINAL_REQUEST.md before starting work.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A forensic auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusive Write Ownership (You ONLY touch these files):
- Frontend/src/component/component_game/style.css
- Frontend/package.json
- Frontend/src/component/component_game/playerInfo.js
- Frontend/src/component/component_game/coin.js
- Frontend/src/component/component_game/Camera.js

Objectives & Tasks for Milestone 1:
1. Fix Asset URLs and Keyframe Animation in `Frontend/src/component/component_game/style.css`:
   - Replace root-relative `url(/src/images/...)` with proper relative paths `url(../../images/...)` (or relative path matching the actual images in `Frontend/src/images/`) on lines 106, 113, 117, 154, 259, 275, 545.
   - Fix duplicate `100%` declarations in `@keyframes walk-down`, `walk-up`, `walk-left`, `walk-right` (lines 513-540) to proper stepped keyframes (`0% { background-position-x: 0; } 33% { background-position-x: -20px; } 66% { background-position-x: -40px; } 100% { background-position-x: -60px; }`).
2. Fix Windows `npm start` Compatibility in `Frontend/package.json`:
   - Replace inline POSIX env vars in `"start"` with `cross-env` or cross-platform equivalent so it runs cleanly on Windows PowerShell and CMD.
3. Fix Player Component Crash Guard in `Frontend/src/component/component_game/playerInfo.js`:
   - Add safe guard `if (!player) return null;` at the beginning of `const Player = ({ player, ... })` before destructuring `name, coins, color, direction, x, y`.
   - Prevent animation glitch on keyup if multiple movement keys are held.
4. Fix Coin Component Crash Guard in `Frontend/src/component/component_game/coin.js`:
   - Add safe guard `if (!coin) return null;` before destructuring `x, y`.
5. Fix Camera Coordinate Calculation & ResizeObserver in `Frontend/src/component/component_game/Camera.js`:
   - Ensure `cameraX` and `cameraY` safely default to 0 if `player`, `player.x`, or `player.y` is undefined or NaN.
   - Guard `new ResizeObserver(...)` with `typeof ResizeObserver !== 'undefined' ? new ResizeObserver(...) : null`.
6. Run build / tests in `Frontend/` (e.g., `npm test -- --watchAll=false` and verify no broken imports or syntax errors).
7. Document exact changes, verification commands, and results in `C:\Users\LOQ\Documents\gamukis\.agents\teamwork\worker_game_m1\handoff.md`. Send completion message when done.
