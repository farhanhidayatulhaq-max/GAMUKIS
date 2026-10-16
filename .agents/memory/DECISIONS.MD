# SMART MEMORY: ARCHITECTURAL DECISIONS & COMPLETED MILESTONES

1. **Core Gameplay Module Protection (`inGame.js`)**:
   - The file `Frontend/src/component/component_game/inGame.js` has been stable and passed the 4-direction animation tests and Socket.IO connection checks. Agents are prohibited from modifying `inGame.js` while working on UI tasks outside gameplay[cite: 8].
2. **Completed and Active Features (Do Not Recreate)**:
   - **Dynamic Question Bank**: MySQL table `questions_bank` (6 subjects), Redis caching, endpoint `GET /api/questions/random`, and `Frontend/src/database/questionData.js`[cite: 8].
   - **Game Sensory UI/UX**: Web Audio API Synthesizer (`soundEffects.js`), Mini-Map HUD (`miniMap.js`), and Toast Notification (`toastNotification.js`)[cite: 8].
   - **Competitive Leaderboard & Badges**: Redis `ZSET` (daily/weekly/all-time), tables `match_history` & `user_achievements`, and integration in `result.js` and `profile.js`[cite: 8].
   - **Membership Backend Retry**: The endpoint `POST /api/memberships/pending/retry` is active in `Backend/src/routes/membershipRoute.js` and returns `{ status: 'pending', paymentUrl, paymentToken }`[cite: 8].