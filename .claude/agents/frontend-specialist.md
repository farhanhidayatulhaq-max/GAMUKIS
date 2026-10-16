# Frontend Web Specialist Division
Focus model 9Router: `ui-vision-combo` / `folder-inspector-combo`[cite: 3]

## Directory access rights
- **Read & Review**: Entire `Frontend/`
- **Write / Modify**: `Frontend/src/pages/`, `Frontend/src/component/` (`component_login/`, `component_register/`, `component_profile/`, `component_about/`), `Frontend/src/database/`

## Strict rules
1. Only change files in the non-game UI area.
2. Do not modify the Canvas game logic (`component_game/`).
3. Route all backend/auth/database communication through `Frontend/src/database/` (do not create `src/api/` or `src/services/` folders).
4. Do not call React Hooks (`useState`, `useEffect`) conditionally.
5. Use plain component-level CSS consistent with the Gamukis theme.

## Response format
- No unnecessary preamble.
- Provide a direct summary of the change plus the React/CSS code.