# Handoff Report — Game Loop Architecture & Bug Survey

**Agent**: Explorer 1 (Game Loop Explorer)  
**Date**: 2026-10-11  
**Handoff Type**: Hard (Task Complete)  
**Recipient**: Orchestrator (`5d434da4-701b-4f51-8dda-a132a5297c93`)  
**Artifact**: `C:\Users\LOQ\Documents\gamukis\.agents\teamwork\explorer_game_survey_1\analysis.md`

---

## 1. Observation

Direct code observations from inspection:

1. **Player Component Crash on Disconnect**:
   - `Frontend/src/component/component_game/playerInfo.js:6-7`:
     ```javascript
     const Player = ({ player, isCurrentPlayer, isButtonMoving = false, skillActive, skillIndex }) => {
       const { name, coins, color, direction, x, y } = player;
     ```
   - `Frontend/src/component/component_game/inGame.js:274-280`:
     ```javascript
     onPlayerLeft: (leftPlayerId) => {
       setPlayers((currentPlayers) => {
         const nextPlayers = { ...currentPlayers };
         delete nextPlayers[leftPlayerId];
         return nextPlayers;
       });
     },
     ```
   - `Frontend/src/component/component_game/inGame.js:383-392`:
     ```javascript
     {randomPlayers.map((key) => (
       <Player
         key={key}
         player={players[key]}
         ...
     ```
   - When `leftPlayerId` is in `randomPlayers`, `players[key]` is `undefined`. `playerInfo.js:7` destructures `undefined`, triggering `TypeError: Cannot destructure property 'name' of 'player' as it is undefined`.

2. **Foreign Player Milestone Screen-Hijack**:
   - `Frontend/src/component/component_game/inGame.js:266-273, 288-296`:
     ```javascript
     onPlayerUpdated: (updatedPlayer) => {
       ...
       checkCoinMilestoneRef.current(updatedPlayer);
     },
     ...
     onCoinClaimed: (coinId, updatedPlayer) => {
       ...
       checkCoinMilestoneRef.current(updatedPlayer);
     },
     ```
   - `Frontend/src/component/component_game/inGame.js:150-161`:
     ```javascript
     const checkCoinMilestone = (playerData) => {
       if (!playerData) return;
       const coins = Math.max(0, Number(playerData.coins) || 0);
       const milestone = Math.floor(coins / POINT_THRESHOLD);
       if (milestone <= lastQuestionMilestoneRef.current || pendingQuestionRef.current) return;
       ...
     ```
   - `checkCoinMilestone` lacks an equality check between `playerData.id` and `playerId`. Every foreign player's coin update runs on the local client, popping the quiz modal on innocent players and consuming their milestone slot.

3. **Permanent Quiz Lockout on Rejection**:
   - `Frontend/src/component/component_game/inGame.js:417-432`:
     ```javascript
     onQuestionAnswered={(question, answer, correct) => {
       ...
       addAnswer(`${answerOwnerIdRef.current || playerId}:${sessionIdRef.current}`, answerData)
         .then(() => {
           const pendingQuestion = pendingQuestionRef.current;
           if (!pendingQuestion) return;
           lastQuestionMilestoneRef.current = pendingQuestion.milestone;
           pendingQuestionRef.current = null;
           return updatePlayer({ lastQuestionCoins: pendingQuestion.reachedCoinCount });
         })
         .catch(console.error);
     }}
     ```
   - If `addAnswer` rejects (e.g. 403 Forbidden or network error), the `.then` block is skipped. `pendingQuestionRef.current` remains non-null permanently, halting all subsequent questions via line 154 (`if (... || pendingQuestionRef.current) return;`).

4. **HTTP 403 Forbidden on Answers Endpoint**:
   - `Backend/src/config/Database/Firebase/players.js:104, 116`:
     ```javascript
     router.get('/answers/:playerId', requireSelfOr('answers:read_any'), ...);
     router.post('/answers/:playerId', requireSelfOr('players:write_any'), ...);
     ```
   - `Backend/src/middlewares/roleMiddleware.js:31-37`:
     ```javascript
     const requireSelfOr = (permission, param = 'playerId') => (req, res, next) => {
       if (!req.account) return res.status(401).json({ message: 'Token login diperlukan.' });
       if (String(req.params[param]) === String(req.account.userId)) return next();
       if (req.account.role == null) return denyRoleSelection(res);
       if (permission && hasPermission(req.account.role, permission)) return next();
       return deny(res, 'Anda hanya boleh mengakses data milik sendiri.');
     };
     ```
   - `Frontend/src/database/firebaseDatabase.js:60-64` passes `req.params.playerId = "${playerId}:${sessionId}"`. This never equals `req.account.userId`, and fallback checks `players:write_any` (admin-only). Non-admin users are rejected with HTTP 403.

5. **Duplicate Question Prompts in Question Bank**:
   - `Frontend/src/component/component_game/questions.js`:
     - Line 30 (Q5): `"Gaya bahasa yang melukiskan suatu maksud dengan mengatakan kebalikan..."` -> Options: Ironi, Sinisme, Sarkasme, Kritik -> Correct: Ironi
     - Line 129 (Q14): Identical prompt string -> Options: Fakta-fakta sejarah, Kehidupan dan pencapaian individu... -> Correct: Kehidupan dan pencapaian individu
     - Line 155 (Q16): Identical prompt string -> Options: Hanya sebagai pencerita, Memilih sudut pandang... -> Correct: Memilih sudut pandang...
     - Line 171 (Q18): Identical prompt string -> Options: Empat baris per bait... -> Correct: Empat baris per bait dan lima bait
   - `inGame.js:183` checks `questions.find(q => !answeredQuestions.has(q.question))`. After Q5 is answered, Q14, Q16, and Q18 are marked as already answered and permanently skipped.

6. **Input Processing While Modal Is Open**:
   - `Frontend/src/component/component_game/inGame.js:120-148`: `handleArrowPress` and `castSkill` contain no guard against `isModalOpen`.
   - `Frontend/src/component/component_game/useKeyPress.js:22-55`: Key listeners remain bound to `document` and execute movement ticks even when modal overlay is present.

7. **Missing Damage and Death Handling**:
   - `Frontend/src/database/realtimeGame.js:96-107`: `damagePlayer` is defined and exported.
   - Grep verification across `Frontend/src/`: Zero references to `damagePlayer()` in the entire codebase outside its definition in `realtimeGame.js`. Incorrect answers never decrement health, and reaching health 0 never triggers game over.

---

## 2. Logic Chain

1. **From Observation 1**: When player A disconnects, server broadcasts `player:left`. Client updates `players` hash by removing player A. However, `randomPlayers` array retains player A's key until next re-selection. React renders `<Player player={players[playerA]} />`, evaluating to `<Player player={undefined} />`. Because `Player.js` unconditionally destructures `player` on line 7, React crashes with an unhandled `TypeError`.
2. **From Observation 2**: Server broadcasts `player:updated` and `coin:claimed` for all players in the lobby room. `InGame` invokes `checkCoinMilestoneRef.current(updatedPlayer)` regardless of whether `updatedPlayer.id === playerId`. Therefore, player B's milestone triggers the quiz modal on player A's machine and sets player A's `lastQuestionMilestoneRef.current`, blocking player A from receiving questions when player A subsequently reaches that coin count.
3. **From Observations 3 and 4**: When `onQuestionAnswered` posts an answer, it sends to `/players/answers/${playerId}:${sessionId}`. Because of the route mismatch in `requireSelfOr`, the backend responds with 403 Forbidden. The client's promise rejection enters `.catch`, failing to reset `pendingQuestionRef.current = null`. The quiz loop enters an irreversible deadlock.
4. **From Observation 5**: Because question deduplication relies strictly on matching `q.question` strings, four questions sharing the identical copied prompt text cause questions 14, 16, and 18 to be skipped entirely.
5. **From Observations 6 and 7**: The absence of modal-state checks in input handlers allows players to walk blindly and collect coins during quizzes, while unused damage API functions render the player health heart bar static and purely decorative.

---

## 3. Caveats

- **Backend Live Redis/MySQL State**: The investigation analyzed code paths statically; live server Redis cluster interactions were not tested with live network traffic due to read-only constraints.
- **Audio/Asset Assets**: Sound effects and audio spritesheets were not audited, as the original request specifically focused on core gameplay loop logic, bugs, and exceptions.

---

## 4. Conclusion

The Web Game Application architecture is well-structured in terms of dual canvas/DOM rendering and Tiled map integration, but the main gameplay loop suffers from **3 critical crash/deadlock bugs** (player disconnect destructuring crash, foreign coin milestone hijack, and quiz lockout on network failure) and **several logic/mechanic bugs** (403 answer endpoint rejection, duplicate question bank entries, modal movement bypass, and omitted health damage).

Fixing these issues requires targeted, surgical edits primarily in `inGame.js`, `playerInfo.js`, `questions.js`, and `players.js` as detailed in `analysis.md`.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Crash on Disconnect**:
   - Inspect `Frontend/src/component/component_game/playerInfo.js` line 7: confirm missing `if (!player) return null;`.
   - Inspect `Frontend/src/component/component_game/inGame.js` lines 274-280 and line 386: confirm `onPlayerLeft` does not remove the ID from `randomPlayers`.
2. **Verify Screen-Hijack**:
   - Inspect `Frontend/src/component/component_game/inGame.js` line 272 and line 295: confirm `checkCoinMilestoneRef.current(updatedPlayer)` is called without `updatedPlayer.id === playerId` check.
3. **Verify Answers Endpoint Authorization Failure**:
   - Inspect `Backend/src/middlewares/roleMiddleware.js` lines 31-37: compare `req.params.playerId` against `req.account.userId` when URL contains `:${sessionId}`.
4. **Verify Duplicate Question Strings**:
   - Search for `"Gaya bahasa yang melukiskan suatu maksud"` in `Frontend/src/component/component_game/questions.js`: confirm it appears on lines 30, 129, 155, and 171.
5. **Run Existing Frontend Test Suite**:
   - Command: `npm test` inside `Frontend/` (verifies baseline build and non-game unit tests pass).

