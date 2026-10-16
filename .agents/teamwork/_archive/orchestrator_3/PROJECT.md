# Project: Web Game Character Animation, Customization & Question Repeatability

## Architecture
- **Animation & Visual Presentation**:
  - `Frontend/src/component/component_game/style.css`: 4-beat directional walk keyframes for humanoid sprite (`char-man-1.svg`), synchronized transition timing (`0.22s linear`).
  - `Frontend/src/component/component_game/playerInfo.js`: Coordinate delta step duration tracking, directional walk/idle stance resolution, multi-layer customized avatar component rendering.
- **Player State & Customization**:
  - `Frontend/src/component/component_game/inGame.js`: Authentication state differentiation (guest vs. registered), customization schema loading & sanitization (`gamukis_character_appearance`), passing appearance props to `<Player />` and `subscribeToGame`.
- **Question Flow & Database Persistence**:
  - `Frontend/src/component/component_game/inGame.js` & `questions.js`: Repeatable question cycle, question bank wrap-around / retry mechanism, session reset.
  - `Frontend/src/database/firebaseDatabase.js`: Include manual auth token headers, execute `saveGameHistory` into MySQL table `history`.
  - `Backend/src/services/realtimeGameSocket.js`: Clean player session state reset without merging stale `health: 0` dead state from Redis.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 4-Beat Walking Keyframes | Directional walking keyframes for humanoid sprite across up, down, left, right | M1 | Explorer 1 & Spec Miner |
| 2 | Movement Transition Sync | Adjust CSS spatial transition to 0.22s linear matching tick rate, eliminating sliding glide | M1 | Explorer 1 & Spec Miner |
| 3 | Step Duration & Idle Stance Tracking | Coordinate delta step tracking ensuring full 220ms walk animation per step and clean idle stance return | M1 | Explorer 1 |
| 4 | Default Humanoid Fallback | Default guest fallback uses humanoid SVG so all players have visible walking legs | M1 | Explorer 1 |
| 5 | Auth Differentiation | Differentiate guest users from registered accounts via Firebase auth & manualAuth | M2 | Explorer 2 & Spec Miner |
| 6 | Customization Loading & Sanitization | Load and validate `gamukis_character_appearance` from localStorage | M2 | Explorer 2 & Spec Miner |
| 7 | Layered Avatar Renderer | Render layered avatar components (hair, skin, shirt, pants, shoes) mapped to direction and walk/idle state | M2 | Explorer 2 & Spec Miner |
| 8 | Safe Guest Fallback | Unregistered or uncustomized players safely render default character without error | M2 | Explorer 2 & Spec Miner |
| 9 | Question Repeatability Loop | Allow retrying/repeating questions for currently supported subjects without lockout | M3 | Explorer 4 |
| 10 | Auth Token in Answer Endpoints | Include manual user token in `firebaseDatabase.js` requests | M3 | Explorer 4 |
| 11 | MySQL History Persistence | Call `saveGameHistory` to record session progress into MySQL `history` table | M3 | Explorer 4 |
| 12 | Clean Progress Reset | Reset coins, health, milestone, sessionId, and prevent Redis stale dead state lockout | M3 | Explorer 4 |
| 13 | Comprehensive Verification | Opaque-box 4-tier E2E testing and adversarial validation | M4 | Spec Miner |
| 14 | Health Damage Gameplay Change | Stop HP loss on wrong answers; server-authoritative damage from other players' skill hits and randomly spawned bot enemies | Change Order | `TASK_ANTIGRAVITY_GAMEPLAY_DAMAGE.md` |

## Change Order — HP Damage Source Rules

Follow-up user requirements mandate that HP **does not** decrease due to incorrect question answers. HP drops only when a player is hit by attack skills from other players or attacks from randomly spawned bot enemies. Antigravity leads server-authoritative implementation for spawn, hit validation, cooldowns, and damage. Binding implementation details and acceptance criteria are specified in `TASK_ANTIGRAVITY_GAMEPLAY_DAMAGE.md`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Natural Character Walking Cycle Animation | `style.css`, `playerInfo.js` | none | PLANNED |
| M2 | Customized Character Resolution for Registered Users | `inGame.js`, `playerInfo.js` | M1 | PLANNED |
| M3 | inGame Question Repeatability & MySQL Progress History | `inGame.js`, `questions.js`, `firebaseDatabase.js`, `realtimeGameSocket.js` | M2 | PLANNED |
| M4 | E2E Testing, Adversarial Hardening & Forensic Audit | Test suite across Tiers 1-4, Challenger validation, Forensic Audit | M1, M2, M3 | PLANNED |

## Code Layout
- `Frontend/src/component/component_game/style.css` (M1)
- `Frontend/src/component/component_game/playerInfo.js` (M1, M2)
- `Frontend/src/component/component_game/inGame.js` (M2, M3)
- `Frontend/src/component/component_game/questions.js` (M3)
- `Frontend/src/database/firebaseDatabase.js` (M3)
- `Backend/src/services/realtimeGameSocket.js` (M3)
- `Frontend/src/__tests__/game/` (M4)

