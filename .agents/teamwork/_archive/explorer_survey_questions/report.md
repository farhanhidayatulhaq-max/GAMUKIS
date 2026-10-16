# Comprehensive Analysis Report: Question Repeatability & MySQL Progress History Persistence

- **Project Root**: `C:\Users\LOQ\Documents\gamukis`
- **Module Focus**: `Frontend/src/component/component_game/`, `Frontend/src/database/`, `Frontend/src/pages/`, `Backend/src/`
- **Requirement Target**: R3 (Question Repeatability & MySQL Progress History Persistence)
- **Author**: Explorer Survey Agent
- **Date**: 2026-10-11

---

## Executive Summary

Based on an in-depth investigation of both the Frontend and Backend codebases, we analyzed why some questions can be redone while others cannot, why game progress cannot be restarted cleanly, how MySQL is used versus Firebase and Redis, and why session history is failing to persist reliably.

### Key Discoveries:
1. **The Asymmetric Question Repeatability Bug**:
   - **Manual vs Google Auth Mismatch**: When a user logs in via MySQL manual authentication, `Frontend/src/database/firebaseDatabase.js` fails to send the manual JWT token (it only reads `auth.currentUser.getIdToken()`, which is anonymous or null). Consequently, `addAnswer` and `getAnswers` fail with HTTP 403 Forbidden on the backend (`roleMiddleware.js:38`). Because `getAnswers` catches the error and returns `{}` (`inGame.js:172`), `answeredQuestions` is always empty for manual users. Every coin milestone re-queries the question bank from index 0, causing the first question to appear over and over (repeated indefinitely).
   - **Google-Authenticated Users**: For Google users, `addAnswer` succeeds and writes answers to Firebase RTDB. Because `fetchNextUnansweredQuestion` filters out all answered questions via `questions.find(q => !answeredQuestions.has(q.question))`, once a question is answered (correct or incorrect), it is permanently blocked from being retried. Once all 25 questions in `questions.js` are answered, the question bank is exhausted and logs `"All questions have been answered."` (`inGame.js:200`), completely terminating question popups without any repeat mechanism.
2. **The In-Game Restart Lockout Bug**:
   - When player health reaches 0 (`inGame.js:101`), the frontend navigates to `/result`.
   - On `/result`, there is no "Play Again" or restart button.
   - If the player navigates back to `/inGame`, backend socket handler (`realtimeGameSocket.js:381-383`) merges `...(existing || {})` from Redis on top of the incoming `...player`. Redis still has `existing.health = 0` and `existing.coins = 25`.
   - As soon as the frontend receives the snapshot, line 101 of `inGame.js` detects `health <= 0` and immediately boots the player back to `/result`. Retrying is completely blocked until Redis TTL expires.
3. **The MySQL History Persistence Void**:
   - Table `history` in MySQL (`connection.js:39-50`) stores `id_history`, `time_playing`, `answer_true`, `answer_false`, `desc_answer_true`, `desc_answer_false`, `all_question`, `coin`, `death`, `created_at`.
   - Frontend defines `saveGameHistory(history)` in `firebaseDatabase.js:66`, but **never calls it anywhere in the frontend application**.
   - Backend has an automatic history finalizer in `realtimeGameSocket.js:203-245`, but it **only triggers if the game session has lasted >= 5 minutes (300,000 ms)**. If a player dies early, finishes early, or retries, history is never saved.
   - Endpoint `POST /api/players/history` requires permission `'history:create'`, which rejects guest/anonymous players whose role is `null`.
4. **Subject Question Types Deferral**:
   - While `category_materi.js` and `gamePage.js` list subjects like Biologi, Kimia, Fisika, and Sosiologi, `gamePage.js:29` navigates to `/InGame` without passing the selected subject.
   - `inGame.js` only loads a single static array of 25 Indonesian language questions from `questions.js`.
   - Per user instruction, other subject question types must be cleanly deferred using a modular question provider registry with a default fallback, without breaking current gameplay.

---

## 1. Frontend Question Management & Repeatability Investigation

### 1.1 Question Loading, Display, and Answering Flow
- **Question Source**: `Frontend/src/component/component_game/questions.js` exports an array of 25 multiple-choice questions (Bahasa Indonesia subject).
- **Trigger Condition**:
  - In `Frontend/src/component/component_game/inGame.js`:
    ```javascript
    const POINT_THRESHOLD = 5; // lines 91
    ...
    const checkCoinMilestone = (playerData) => { // lines 156-165
      if (!playerData || (playerId && playerData.id !== playerId)) return;
      const coins = Math.max(0, Number(playerData.coins) || 0);
      const milestone = Math.floor(coins / POINT_THRESHOLD);
      if (milestone <= lastQuestionMilestoneRef.current || pendingQuestionRef.current) return;

      const reachedCoinCount = milestone * POINT_THRESHOLD;
      pendingQuestionRef.current = { milestone, reachedCoinCount };
      fetchNextUnansweredQuestion(answerOwnerIdRef.current || playerData.id, milestone);
    };
    ```
  - For every 5 coins collected (milestones: 5, 10, 15, ..., 125 coins), `fetchNextUnansweredQuestion` is invoked.
- **Fetching Unanswered Questions**:
  - In `inGame.js:169-206`:
    ```javascript
    const fetchNextUnansweredQuestion = (playerId, milestone) => {
      getAnswers(`${playerId}:${sessionIdRef.current}`).catch((error) => {
        console.error('Gagal mengambil jawaban tersimpan, menggunakan daftar soal lokal:', error);
        return {};
      }).then((answers = {}) => {
        const answeredQuestions = new Set();
        Object.values(answers).forEach((childData) => {
          answeredQuestions.add(childData.question);
        });

        if (answeredQuestions.size >= milestone) {
          const pendingQuestion = pendingQuestionRef.current;
          if (pendingQuestion) {
            lastQuestionMilestoneRef.current = pendingQuestion.milestone;
            pendingQuestionRef.current = null;
            updatePlayer({ lastQuestionCoins: pendingQuestion.reachedCoinCount }).catch(console.error);
          }
          return;
        }

        const nextQuestion = questions.find(q => !answeredQuestions.has(q.question));
        if (nextQuestion) {
          setModalContent(nextQuestion);
          setIsModalOpen(true);
        } else {
          const pendingQuestion = pendingQuestionRef.current;
          if (pendingQuestion) {
            lastQuestionMilestoneRef.current = pendingQuestion.milestone;
            pendingQuestionRef.current = null;
            updatePlayer({ lastQuestionCoins: pendingQuestion.reachedCoinCount }).catch(console.error);
          }
          console.log("All questions have been answered.");
        }
      });
    };
    ```
- **Display and Answering**:
  - Displayed via `CoinModal` (`Frontend/src/component/component_game/modal.js`).
  - Clicking an option disables other options, highlights correct/incorrect, triggers `onQuestionAnswered`:
    ```javascript
    // inGame.js lines 428-448
    onQuestionAnswered={(question, answer, correct) => {
      const answerData = { question, answer, correct };
      if (!correct) damagePlayer().catch(console.error);
      addAnswer(`${answerOwnerIdRef.current || playerId}:${sessionIdRef.current}`, answerData)
        .then(() => {
          const pendingQuestion = pendingQuestionRef.current;
          if (!pendingQuestion) return;
          lastQuestionMilestoneRef.current = pendingQuestion.milestone;
          return updatePlayer({ lastQuestionCoins: pendingQuestion.reachedCoinCount });
        })
        .catch(console.error)
        .finally(() => {
          pendingQuestionRef.current = null;
        });
    }}
    ```

### 1.2 Root Cause Analysis: Why Some Questions Can Be Retried While Others Cannot

| Factor | Mechanism Observed | Effect on Repeatability |
| :--- | :--- | :--- |
| **1. Auth Token Mismatch in `firebaseDatabase.js`** | `firebaseDatabase.js:6-15` only attaches `auth.currentUser.getIdToken()`. Manual users have `gamukis_manual_token` in `localStorage`, but Firebase user is anonymous. `inGame.js:231` sets `answerOwnerId = manual_${id}`. In `roleMiddleware.js:33-38`, `requireSelfOr` compares `ownerId` (`manual_1`) with `req.account.userId` (anonymous UID), throwing 403 Forbidden. | **`addAnswer` and `getAnswers` FAIL for manual users.** Answers are never saved to Firebase. `answeredQuestions` remains empty `Set()`. Question 0 is selected repeatedly on every milestone (can be retried forever). |
| **2. Exhaustive Set Filtering for Google Users** | For Google users, `addAnswer` succeeds. Answers are stored in Firebase RTDB. `fetchNextUnansweredQuestion` checks `!answeredQuestions.has(q.question)`. | **Questions answered successfully can NEVER be retried in the session.** Both correct and incorrect answers are excluded permanently. |
| **3. Question Bank Exhaustion** | `questions.js` contains exactly 25 items. At milestone > 25 (coins > 125), `questions.find()` returns `undefined`. | Logs `"All questions have been answered."` (`inGame.js:200`) and halts all future question modals. **Zero repeatability after 25 questions.** |
| **4. Milestone Gatekeeper Mismatch** | `if (answeredQuestions.size >= milestone) return;` (`inGame.js:179`). | If a player earns coins quickly or reconnects, previous milestones are skipped and cannot be retried. |
| **5. Incorrect Answers Locked Out** | In `onQuestionAnswered`, even when `correct: false`, the question is written to `addAnswer`. | Player cannot retry a question they answered wrongly to improve accuracy. |

### 1.3 How Restarting / Repeating Currently Works (and Why It Breaks)
- **Session ID lifecycle**:
  - `sessionIdRef` (`inGame.js:50-52`): `sessionStorage.getItem('gamukis_game_session_id') || createSessionId()`.
  - When game ends (health = 0 or timer runs out), player is routed to `/result`.
  - In `result.js:45`: `sessionStorage.removeItem('gamukis_game_session_id');`.
- **The Stale State Lockout**:
  - If the player tries to return to `/inGame` to restart:
  - Frontend generates a new `sessionId`.
  - Frontend connects via WebSocket `game:join` sending `{ coins: 0, health: 3, ... }`.
  - In `Backend/src/services/realtimeGameSocket.js:381-383`:
    ```javascript
    const savedPlayer = await savePlayer(playerId, {
      ...player,
      ...(existing || {}), // <--- OVERWRITES new player with stale Redis data!
      id: playerId, ...
    ```
  - `existing.health` is still `0` in Redis!
  - Frontend receives `game:snapshot`, where `currentPlayer.health <= 0`.
  - `inGame.js:101` immediately fires: `navigate('/result')`!
  - **Result**: The player cannot repeat or restart progress. They are trapped in a redirection loop.

---

## 2. Backend & Database Architecture Investigation

### 2.1 Database Separation: MySQL vs Firebase vs Redis

```
┌────────────────────────────────────────────────────────────────────────┐
│                              GAMUKIS DATA LAYER                        │
├──────────────────┬─────────────────────────────┬───────────────────────┤
│     MySQL 8      │  Firebase Realtime Database │         Redis         │
├──────────────────┼─────────────────────────────┼───────────────────────┤
│ • users          │ • answers/${sessionKey}     │ • game:global:players │
│ • users_detail   │ • players (legacy)          │ • game:global:coins   │
│ • history (runs) │ • coins (legacy)            │ • game:global:leader- │
│ • characters     │                             │   board (ZSET)        │
│ • roles / plans  │                             │ • player heartbeat    │
└──────────────────┴─────────────────────────────┴───────────────────────┘
```

1. **MySQL** (`Backend/src/config/Database/MySQL/connection.js`):
   - Handles persistent relational records: users, roles, characters, memberships, and **game session history (`history` table)**.
   - `history` table schema:
     ```sql
     CREATE TABLE IF NOT EXISTS history (
       id_history INT AUTO_INCREMENT PRIMARY KEY,
       time_playing TIME NOT NULL,
       answer_true INT NOT NULL DEFAULT 0,
       answer_false INT NOT NULL DEFAULT 0,
       desc_answer_true TEXT,
       desc_answer_false TEXT,
       all_question INT NOT NULL DEFAULT 0,
       coin INT NOT NULL DEFAULT 0,
       death INT NOT NULL DEFAULT 0,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
     ```
   - Service: `Backend/src/services/historyService.js`:
     - `saveHistory({ timePlaying, answerTrue, answerFalse, descAnswerTrue, descAnswerFalse, allQuestion, coin, death })`
     - `listHistory()`: Admin queries history ordered by `created_at DESC`.
2. **Firebase Realtime Database** (`Backend/src/config/Database/Firebase/admin.js`):
   - Stores granular question answers: `answers/${playerId}:${sessionId}`.
   - Each answer item contains: `{ question, answer, correct }`.
3. **Redis** (`Backend/src/services/realtimeGameService.js`):
   - Fast in-memory state for multiplayer positions, live coin claims, and real-time leaderboard scores.

### 2.2 APIs and Endpoints for Game Session Results & History Persistence

Currently available endpoints:
- **`POST /api/players/history`** (`Backend/src/config/Database/Firebase/players.js:27-62`):
  - Middleware: `authenticateAny`, `requirePermission('history:create')`.
  - Body: `{ time_playing, answer_true, answer_false, desc_answer_true, desc_answer_false, all_question, coin, death }`.
  - Action: Inserts directly into MySQL table `history`.
- **`GET /api/admin/rooms/history`** (`Backend/src/routes/adminRoomRoute.js:9`):
  - Middleware: `requirePermission('history:read_all')`.
  - Action: Calls `historyService.listHistory()` and returns all history rows.
- **Frontend Client Function**:
  - In `Frontend/src/database/firebaseDatabase.js:66`:
    ```javascript
    const saveGameHistory = (history) => request('/players/history', {
      method: 'POST',
      body: JSON.stringify(history)
    });
    ```
  - **CRITICAL GAP**: `saveGameHistory` is **NEVER called anywhere in `inGame.js` or `result.js`**!

### 2.3 The Disconnection in History Saving

1. **Why Backend Automatic Finalizer Fails**:
   - In `realtimeGameSocket.js:203-211`:
     ```javascript
     const expiredPlayers = Object.values(snapshot.players || {}).filter((player) => (
       Number.isFinite(Number(player.gameStartedAt))
       && now - Number(player.gameStartedAt) >= GAME_DURATION_MS // 5 minutes
       && !player.historySavedAt
       && !finalizingHistoryPlayers.has(player.id)
     ));
     ```
   - It only saves history if the player stays connected in the game for at least 5 minutes (`GAME_DURATION_MS`).
   - If player health reaches 0 in 1 minute, player leaves to `/result`. Since 1 min < 5 min, the automatic finalizer **never triggers**.
   - If player finishes all 25 questions in 3 minutes, the finalizer does not trigger.
2. **Why HTTP Endpoint Fails for Guests and Manual Users**:
   - `firebaseDatabase.js` does not pass the JWT token from `manualAuth.js`, causing manual users to be treated as anonymous or unauthenticated.
   - `requirePermission('history:create')` in `roleMiddleware.js:23` rejects any account with `role == null` with code `ROLE_REQUIRED`. Guests and unverified accounts have `role == null`.

---

## 3. Concrete Architectural Recommendations

To satisfy the user request:
> *"Tolong check lagi ada bug di bagian inGame, sebenarnya beberapa soal bisa dikerjakan ulang dan ada yang tidak bisa dikerjakan ulang, untuk tipe soal (mata pelajaran yang lain) yang belum ada di fitur itu dipikirkan nanti tetapi yang sudah ada tersebut itu bisa dikerjakan berulang tetapi hasil data disimpan lalu ulang progress dari awal namun history progress tersimpan di mysql"*

We recommend an end-to-end architecture covering:
1. Repeatable question sets.
2. MySQL progress history persistence.
3. In-game progress reset from the beginning.
4. Clean deferral of future question types/subjects.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   REPEATABLE IN-GAME WORKFLOW                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [ Player inGame ] ──(Collect Coins)──> [ Milestone Question Modal ]  │
│          │                                         │                   │
│          │                                         ▼                   │
│          │                                [ Answer Question ]          │
│          │                                         │                   │
│          ▼                                         ▼                   │
│   [ All 25 Answered ] OR [ Health = 0 ] OR [ Timer Expires ]           │
│          │                                                             │
│          ▼                                                             │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │ STEP 1: Persist Run Summary to MySQL `history` Table        │      │
│   │ • Calculate time_playing, answer_true, answer_false, coins  │      │
│   │ • Call `saveGameHistory()` / socket finalizer               │      │
│   └─────────────────────────────────────────────────────────────┘      │
│          │                                                             │
│          ▼                                                             │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │ STEP 2: Reset In-Game Progress to Initial State             │      │
│   │ • coins: 0, health: 3, lastQuestionCoins: 0, milestone: 0   │      │
│   │ • Generate fresh sessionId                                  │      │
│   │ • Socket emits clean reset; Redis updates player without    │      │
│   │   stale merge                                               │      │
│   └─────────────────────────────────────────────────────────────┘      │
│          │                                                             │
│          ▼                                                             │
│   [ Ready to Repeat Questions from Beginning (Milestone 1 / Q1) ]      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Solution Architecture 1: Repeatable Question Sets

1. **Cycle / Loop Mode**:
   - In `inGame.js`, maintain question state per cycle/round:
     - When `questions.find(q => !answeredQuestions.has(q.question))` finds no more questions (all 25 answered):
       - Do not simply log `"All questions have been answered."` and stop.
       - Display a "Sesi Selesai!" modal with options:
         - **[Ulangi Soal dari Awal]**: triggers the Save & Reset sequence.
         - **[Lihat Hasil]**: navigates to `/result`.
2. **Incorrect Question Retries**:
   - Separate `answeredQuestions` into:
     - `correctQuestionSet`: answered correctly.
     - `incorrectQuestionSet`: answered incorrectly.
   - Questions answered incorrectly can either be re-queued in the active cycle, or re-enabled when restarting from the beginning.
3. **Fixing Auth Mismatch in `firebaseDatabase.js`**:
   - In `Frontend/src/database/firebaseDatabase.js`:
     ```javascript
     const getEffectiveToken = async () => {
       const manualToken = localStorage.getItem("gamukis_manual_token") || sessionStorage.getItem("gamukis_manual_token");
       if (manualToken) return manualToken;
       const user = auth.currentUser;
       return user ? await user.getIdToken() : null;
     };
     ```
   - This ensures manual users send their valid JWT token, solving the 403 Forbidden errors and allowing answer tracking to work consistently for all players.

### 3.2 Solution Architecture 2: MySQL Progress History Persistence

1. **Explicit History Saving Trigger**:
   - History must be saved in two scenarios:
     - **On Run Completion / Death**: When player health reaches 0 or all 25 questions are finished, immediately compile run statistics:
       ```javascript
       const runHistory = {
         time_playing: formatDuration(elapsedSeconds),
         answer_true: correctCount,
         answer_false: incorrectCount,
         desc_answer_true: correctQuestions.join('\n'),
         desc_answer_false: incorrectQuestions.join('\n'),
         all_question: questions.length,
         coin: currentCoins,
         death: currentHealth <= 0 ? 1 : 0
       };
       await saveGameHistory(runHistory);
       ```
     - **On Result Page**: If the run ended via direct navigation or timer, `result.js` must verify whether history for that `sessionId` has already been saved; if not, call `saveGameHistory(...)` using the loaded answers before removing `sessionStorage`.
2. **Permission Adjustment for Guests in Backend**:
   - In `Backend/src/config/permissions.js`:
     Ensure `'history:create'` allows guest/unauthenticated sessions to save anonymous run history, or allow `requireSelfOr` to authorize the current socket session to save history without requiring a pre-selected role.
   - Alternatively, add an explicit WebSocket event `game:finalize-history` in `realtimeGameSocket.js` that compiles answers from `answers/${sessionKey}` and calls `saveHistory(...)` directly on the server without depending on frontend HTTP role authorization.

### 3.3 Solution Architecture 3: Clean Progress Reset Back to Start

1. **Fixing Backend Redis Stale Merge (`realtimeGameSocket.js`)**:
   - In `Backend/src/services/realtimeGameSocket.js:381-391`:
     Modify the player merge logic so that if a player explicitly requests a reset, or if `existingSessionIsActive` is false:
     ```javascript
     const shouldResetProgress = !existingSessionIsActive || player.isReset;
     const savedPlayer = await savePlayer(playerId, {
       id: playerId,
       ...(shouldResetProgress ? {} : (existing || {})),
       ...player,
       coins: shouldResetProgress ? 0 : (existing?.coins ?? player.coins ?? 0),
       health: shouldResetProgress ? 3 : (existing?.health ?? player.health ?? 3),
       lastQuestionCoins: shouldResetProgress ? 0 : (existing?.lastQuestionCoins ?? 0),
       gameStartedAt: shouldResetProgress ? Date.now() : existing.gameStartedAt,
       historySavedAt: null,
       sessionId: requestedSessionId
     });
     ```
2. **Frontend Reset Handler in `inGame.js`**:
   - Create a dedicated `restartGame()` function in `inGame.js`:
     1. Generate a new `sessionIdRef.current = createSessionId()`.
     2. `sessionStorage.setItem('gamukis_game_session_id', sessionIdRef.current);`
     3. Reset internal refs:
        `lastQuestionMilestoneRef.current = 0;`
        `pendingQuestionRef.current = null;`
     4. Notify backend socket with `game:join` or `game:reset`:
        `{ id: playerId, coins: 0, health: 3, lastQuestionCoins: 0, sessionId: sessionIdRef.current, isReset: true }`.
     5. Reset safe map coordinates: `getRandomSafeSpot(mapData)`.
     6. Close any open modals and reset question state.
   - Now, the player can repeat all questions from milestone 1 (5 coins), with full health, fresh answers in Firebase, and past runs archived in MySQL.

### 3.4 Solution Architecture 4: Clean Deferral of Future Question Types/Subjects

To address:
> *"untuk tipe soal (mata pelajaran yang lain) yang belum ada di fitur itu dipikirkan nanti tetapi yang sudah ada tersebut itu bisa dikerjakan berulang"*

1. **Question Registry Pattern (`questionsRegistry.js`)**:
   - Structure `questions.js` or a new `questionRegistry.js` as a modular registry:
     ```javascript
     import { questions as bahasaIndonesiaQuestions } from './questions';

     export const QUESTION_BANK = {
       indonesia: {
         id: 'indonesia',
         title: 'Bahasa Indonesia',
         category: 'UMUM',
         questions: bahasaIndonesiaQuestions
       }
       // Future subjects deferred here:
       // biologi: { id: 'biologi', title: 'Biologi', category: 'SAINTEK', questions: [] },
       // kimia: { id: 'kimia', title: 'Kimia', category: 'SAINTEK', questions: [] }
     };

     export const getQuestionsForSubject = (subjectId) => {
       const bank = QUESTION_BANK[subjectId];
       if (bank && bank.questions && bank.questions.length > 0) {
         return bank.questions;
       }
       // Clean fallback: default to currently existing questions
       return bahasaIndonesiaQuestions;
     };
     ```
2. **Pass Subject State from `gamePage.js` to `inGame.js`**:
   - In `gamePage.js:29`:
     ```javascript
     navigate('/InGame', { state: { subject: cardData.title, category: getTitle(cardData.title) } });
     ```
   - In `inGame.js`:
     Read `location.state?.subject`. If the subject does not have a dedicated question set yet, smoothly fall back to `bahasaIndonesiaQuestions` without throwing errors, and display a gentle notice (e.g., "Mode Latihan: Menampilkan soal Bahasa Indonesia").
   - This ensures zero breaking changes while allowing new subjects to be dropped in seamlessly later.

---

## 4. Evidence Matrix & File Inspection Summary

| File Path | Lines | Observed State | Required Change for Implementation |
| :--- | :--- | :--- | :--- |
| `Frontend/src/component/component_game/inGame.js` | 156-206 | Static 25 question lookup; no repeat mechanism; logs `"All questions have been answered."` | Add repeat/reset prompt when all questions answered; loop/reset question set. |
| `Frontend/src/component/component_game/inGame.js` | 101-104 | Navigates to `/result` when `health <= 0` without saving history | Invoke `saveGameHistory` before navigating to `/result`. |
| `Frontend/src/database/firebaseDatabase.js` | 6-15 | `request()` only inspects `auth.currentUser.getIdToken()`, omitting `gamukis_manual_token` | Add fallback to `manualToken` so manual users authenticate properly. |
| `Frontend/src/database/firebaseDatabase.js` | 66-69 | `saveGameHistory` is defined but unused | Call `saveGameHistory` upon game completion, death, or retry. |
| `Frontend/src/pages/result.js` | 40-46, 72-94 | Displays score, removes `sessionId`, has no "Play Again" button | Add "Main Lagi / Ulangi Soal" button; ensure history is saved if not already. |
| `Backend/src/services/realtimeGameSocket.js` | 381-391 | `savePlayer` unconditionally merges `...(existing || {})`, retaining 0 health and stale coins | Invalidate or bypass `existing` when `isReset` is true or session changed. |
| `Backend/src/services/realtimeGameSocket.js` | 203-245 | `finalizeExpiredSessions` only saves history if session duration >= 5 minutes | Add `game:finalize` or trigger history persistence on death / session reset. |
| `Backend/src/config/Database/MySQL/connection.js` | 39-50 | Table `history` exists with correct columns | Ensure compatibility; optionally link `owner_key` / `user_id`. |
| `Frontend/src/pages/gamePage.js` | 27-30 | `navigate('/InGame')` drops `selectedCard` state | Forward `selectedCard` or subject identifier to `/InGame`. |

---

## 5. Conclusion & Actionable Roadmap

The investigation has uncovered the complete root causes for question non-repeatability, the restart lockout, and the lack of MySQL history persistence. 

### Implementation Steps for Developer Agent:
1. **Frontend Auth Token Bridge**: Update `Frontend/src/database/firebaseDatabase.js` to send manual auth JWT when present, allowing answer and history API calls to succeed for manual users.
2. **Socket Reset & Stale State Elimination**: Update `Backend/src/services/realtimeGameSocket.js` so that `game:join` with a new session ID or reset request clears old health/coins rather than merging dead player state.
3. **End-of-Run History Persistence**: Call `saveGameHistory()` with run statistics (time, correct, incorrect, coins, death) whenever a run ends (death, time expiry, or questions complete) before resetting progress.
4. **Repeatable Question Mechanism**: In `inGame.js`, provide an in-game option to restart progress from the beginning (reset coins, health, milestone, new session ID) while preserving MySQL history.
5. **Subject Modular Deferral**: Wrap `questions.js` with a provider function that safely defaults other unpopulated subjects to the existing question bank.

