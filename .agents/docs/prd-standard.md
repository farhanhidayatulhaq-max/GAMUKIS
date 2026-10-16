# Gamukis PRD Directory Standards & Workflow

Moved as-is from the previous version of `ORCHESTRATION.md` to keep the collaboration file concise. The §1–§3 numbering is retained because older task documents reference it (“ORCHESTRATION §2” = in-game workflow). If the code differs from this document, the running code is the definitive version: report any discrepancies; do not silently merge them.

All agents (`ChatGPT Codex`, `Antigravity`, `Copilot`, `Kiro`)

must adhere to the following folder structure and data flow:

## 1 Project Directory Structure

### 1.1 Restricted Zones & Automation Rules (Blacklist vs. CLI Automation)

1. **Prohibition on Reading/Editing Raw Files (Blacklist Indexing)**:
   - **`.kilo/`**: Backup/old worktree. It is **STRICTLY PROHIBITED** to read or edit files inside the `.kilo/` folder.
   - **`9router/` & `n8n/`**: External tools (AI token router & workflow automation). Do not modify these folders unless explicitly requested by the user.
   - **`Frontend/build/`, `node_modules/`, & `*.zip`**: DO NOT manually read (index) or edit code files inside `node_modules/` and `Frontend/build/`, and do not extract or read `*.zip` archives.

2. **Terminal Automation Requirement (Zero-Manual-CLI for Users)**:
   Although Agents are prohibited from manually editing the contents of the `node_modules/` or `Frontend/build/` folders, Agents **MUST execute terminal commands automatically** (without requiring users to type them themselves) under the following conditions:
   - **Package Installation (`npm install`)**: If `node_modules/` does not exist, is incomplete, or there are additional libraries listed in `Backend/package.json` or `Frontend/package.json`, the Agent must immediately run `cd Backend && npm install` or `cd Frontend && npm install`.
   - **Frontend Build (`npm run build`)**: If changes in `Frontend/src/` require updating the static bundle or verifying the build, the Agent must automatically run `cd Frontend && npm run build`.
   - **Docker Container Synchronization**: If the service runs on Docker (`Backend/docker-compose.yml` or `Frontend/docker-compose.yml`) and there are changes to dependencies or configuration, the Agent must run `docker compose up -d --build` or restart the relevant containers independently

### 1.2 Active Parent Folder Structure (`Frontend/src/` & `Backend/src/`)
All new feature development MUST be placed within the following active directory structure. For `Frontend/src/component/`, you must adhere to the **Atomic Design (`atoms/` & `molecules/`)** hierarchy:

```text
gamukis/
├── Frontend/src/
│   ├── App.js / index.js                     # React entry point & primary router
│   ├── pages/                                # Page controllers (camelCase.js + camelCase.css)
│   │   ├── home.js / home.css
│   │   ├── inGame.js                         # (Route wrapper / game page)
│   │   ├── profile.js / profile.css
│   │   ├── completeProfile.js
│   │   ├── adminDashboard.js
│   │   └── characterCustomization.js
│   │
│   ├── component/                            # Modular components (SINGULAR: not components/)
│   │   ├── atoms/                            # [Global Atoms] Smallest basic UI elements across features (Button, Input, Badge, Icon)
│   │   ├── molecules/                        # [Global Molecules] Cross-feature atom compositions (FormField, Modal, AlertBox)
│   │   ├── Navbar.js / Navbar.css            # Primary navigation component
│   │   └── component_<feature>/              # Feature-scoped component modules (game, profile, login, register, customization_char)
│   │       ├── atoms/                        # [Feature Atoms] Smallest elements specific to this feature (button*, input*, icon*)
│   │       ├── molecules/                    # [Feature Molecules] Atom compositions specific to this feature (card*, formSection*, bar*)
│   │       └── <mainComponentName>.js / .css # Main feature container / organism (e.g., inGame.js, playerInfo.js)
│   │
│   ├── database/                             # API layer, Firebase SDK, & Socket.IO (STRICTLY PROHIBITED from creating src/api or src/services)
│   │   ├── manualAuth.js                     # Requests to /api/auth/manual/*
│   │   ├── firebaseAuth.js                   # Firebase Auth SDK (Google, Email, Anonymous)
│   │   ├── firebaseDatabase.js               # Player API, Google profile, & game history
│   │   ├── realtimeGame.js                   # Socket.IO client to backend
│   │   └── adminApi.js                       # Requests to /api/admin/*
│   └── images/                               # Visual game assets & UI images
│
└── Backend/src/
    ├── app.js / index.js / server.js         # Express entry point & HTTP/Socket server
    ├── config/                               # System configuration (env.js, jwt.js, mailer.js, storage.js)
    │   └── Database/
    │       ├── Api/server.js
    │       ├── MySQL/connection.js           # MySQL2 pool (must use charset utf8mb4), options.js, status.js
    │       ├── Redis/connections.js          # Redis ioredis (connection.js, RealtimeGame.js, options.js, status.js)
    │       ├── MongoDB/connection.js         # MongoDB connection (options.js, status.js)
    │       └── Firebase/                     # Firebase Admin (admin.js) & Express routes (players.js)
    ├── middlewares/                          # Express middleware (naming: <feature>Middleware.js)
    ├── routes/                               # Express route endpoints (naming: <feature>Route.js)
    ├── controllers/                          # Request/Response Controllers (naming: <feature>Controller.js)
    ├── services/                             # Business logic (naming: <feature>Service.js / <feature>Socket.js)
    ├── models/                               # MySQL database query access (naming: <feature>Model.js)
    ├── Register/                             # Registration-specific module (userProfile.js)
    └── utils/                                # Backend internal helper/utility functions
```

## 2 PRD Workflows for In-Game Features (Real-Time Educational & History Games)

1. **Gameplay Loop & Character Rendering**:
   - Located in `Frontend/src/component/component_game/inGame.js`.
   - Uses a sprite keyframe-based walking cycle animation (`requestAnimationFrame`) when moving in 4 directions (up, down, left, right), and returns to the idle pose when stationary.
   - Guest (unregistered) characters are rendered using the default fallback sprite.
   - Registered users with character customizations load their color, hair, and clothing preferences from their profile to be rendered on the game canvas.
2. **Real-Time Connection**:
   - `Frontend/src/database/realtimeGame.js` connects to the Socket.IO backend `Backend/src/services/realtimeGameSocket.js`.
   - Game events: `game:join`, `player:move`, `player:updated`, `coin:claimed`, `leaderboard:updated`. The state is stored in-memory in Redis.
3. **Score History Storage (History Persistence)**:
   - When the game ends or the player loses, the frontend calls `saveGameHistory()` in `Frontend/src/database/firebaseDatabase.js`.
   - It sends a `POST /api/players/history` request to `Backend/src/config/Database/Firebase/players.js`, which is then saved by `historyService.js` to the `history` table in MySQL.
   - **Critical Backend Rule**: The `POST /history` endpoint MUST NOT block users with role-based permission middleware such as `requirePermission(‘history:create’)`. Anonymous players (guests) and users who have not yet specified a role must still be allowed to save their game score history.

## 3 PRD Workflows for the Profile Feature (Dual-Auth & Role Selection)

1. **Personal Data Profile Storage (MySQL Dual-Auth)**:
   - **Manual Account (Email/Password)**:
     - Input form in `Frontend/src/component/component_profile/personalInfo.js`.
     - Request to `Backend/src/routes/manualAuthRoute.js` (`POST /api/auth/manual/profile`).
     - Stored in the MySQL tables `users` and `users_detail` using the `user_id` relationship.
   - **Google Account (Firebase Auth)**:
     - Input forms in `Frontend/src/pages/completeProfile.js` and `Frontend/src/component/component_profile/personalInfo.js`.
     - Request to `Backend/src/routes/firebaseAuthRoute.js` (`POST /api/auth/profile` or `PUT /api/auth/complete-profile`).
     - Stored in the MySQL table `google_user_profiles` with the primary key `firebase_uid` (`gender`, `birth_date`, `school_name`, `address`) and mirrored to the Firebase Realtime Database.
2. **Frontend Token Priority**:
   - The `getEffectiveToken` function in `Frontend/src/database/firebaseDatabase.js` must first check the Firebase login session. If the user is logged in via Google/Firebase, the Firebase ID token must be used—NOT the old manual token in `localStorage`—to avoid triggering a 401 Unauthorized error.
3. **Role Selection and Approval Workflow (Teacher)**:
   - **Student**: If the user selects the “Student” role, the role is immediately activated and updated in the database without requiring approval.
   - **Teacher**: If the user selects the “Teacher” role:
     - A request is sent to the backend and stored in the MySQL table `teacher_applications` with a status of `pending`, along with the subjects taught.
     - The request appears on the administrator dashboard (`Frontend/src/pages/adminDashboard.js`).
     - The administrator approves or rejects the request via `Frontend/src/database/adminApi.js` -> `Backend/src/routes/adminRoomRoute.js` (`POST /api/admin/teacher-applications/:id/approve` or `reject`).
     - Once approved, the user’s role in MySQL is changed to `teacher`, and access to the Teacher module is granted.

And in **Table §4.1 (File Creation Order)** in `prd-standard.md`, the order becomes:

## 4 Tables: Naming Convention & File Execution Order (Mandatory Creation Flow)
Agents MUST plan this in the PRD and create files in sequence from **Number 1 to 10** (Bottom-Up: Database $\rightarrow$ Backend $\rightarrow$ Frontend Data $\rightarrow$ Atom $\rightarrow$ Molecule $\rightarrow$ Main Component $\rightarrow$ Page):

| Creation Order | Layer | Required Folder Location | Required File Naming Convention | Description & Constraints |
|:---:|---|---|---|---|
| **1** | **Backend Config/DB** | `Backend/src/config/Database/<Engine>/` | `connection.js` / `<feature>.js` | Database connection configuration |
| **2** | **Backend Model** | `Backend/src/models/` | `<feature>Model.js` (`camelCase`) | MySQL table queries |
| **3** | **Backend Service** | `Backend/src/services/` | `<feature>Service.js` / `<feature>Socket.js` | Business logic and Redis/Socket operations |
| **4** | **Backend Controller** | `Backend/src/controllers/` | `<feature>Controller.js` (`camelCase`) | Express request/response handlers |
| **5** | **Backend Middleware** | `Backend/src/middlewares/` | `<feature>Middleware.js` (`camelCase`) | Authentication, role validation, and rate limiting |
| **6** | **Backend Route** | `Backend/src/routes/` | `<feature>Route.js` (`camelCase`) | Express endpoint definitions |
| **7** | **Frontend Data/API** | `Frontend/src/database/` | `<feature>.js` / `<feature>Api.js` (`camelCase`) | API fetching, Firebase, and client-side Socket operations |
| **8** | **UI Atom (`/atoms`)** | `Frontend/src/component/component_<feature>/atoms/` *(or `component/atoms/`)* | `<atomName>.js` + `<atomName>.css` | The smallest UI elements, such as buttons, inputs, labels, and badges, without direct API calls |
| **9** | **UI Molecule (`/molecules`)** | `Frontend/src/component/component_<feature>/molecules/` *(or `component/molecules/`)* | `<moleculeName>.js` + `<moleculeName>.css` | A combination of several atoms from Step 8, such as form groups, item cards, and table rows |
| **10** | **UI Container & Page** | `Frontend/src/component/component_<feature>/`, followed by `Frontend/src/pages/` | `<componentName>.js` → `<pageName>.js` (+ `.css`) | Combines molecules from Step 9 with API data from Step 7 to build the page |

### 4.2 Golden Rules for Code and Component Contracts (Mandatory for All PRDs)

1. **Prohibition of Monolithic Components (`index.js` Bundling)**
   - **STRICTLY PROHIBITED:** Declaring multiple UI components in a single `index.js` file (e.g., the legacy implementation in `component_admin_shared/index.js`).
   - Physical component files **MUST** be separated into `atoms/` and `molecules/` directories. The `index.js` file inside a component directory may only be used as a **barrel file** for re-exports.

2. **Custom Hooks Rules (`Frontend/src/hooks/`)**
   - If a feature requires a React Custom Hook (e.g., `useAdminResource.js`), it **MUST** be placed in `Frontend/src/hooks/` and implemented at **Step 7.5** (after `Frontend/src/database/` is completed and before UI development begins).
   - Hooks are **STRICTLY PROHIBITED** from making direct `fetch` calls without going through `Frontend/src/database/`.

3. **Express Route Ordering and Backward Compatibility**
   - In `Backend/src/routes/`, endpoints with specific paths (e.g., `/history/:historyId`) **MUST** be registered **BEFORE** endpoints with generic parameters (e.g., `/:roomId`).
   - When updating existing endpoints, preserve all existing JSON keys and only add new properties (such as `meta` for pagination) to avoid breaking existing components.

4. **Memory Synchronization**
   - Every new PRD **MUST** check `.agents/memory/DECISIONS.md` and `.agents/memory/LESSONS_LEARNED.md` to avoid overwriting stable features or repeating previously encountered bugs.