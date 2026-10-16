# Comprehensive Survey & Analysis Report: Requirement R2 (Customized Character Resolution for Registered Users)

## Executive Summary
This report presents an architectural investigation of player asset resolution and character customization in the Gamukis Web Game Application. Requirement R2 dictates differentiating between guest (unregistered) players and registered accounts:
1. **Guest players (unregistered)** must safely render using the default fallback character asset without throwing errors.
2. **Registered accounts** with saved customizations must load and display their personalized avatar appearance (gender, hair, skin tone, clothing) within the in-game canvas.

Our investigation identified the exact data structures, asset pipelines, storage mechanisms, and rendering gaps across `inGame.js`, `playerInfo.js`, `characterCustomization.js`, and `CharacterPreview.js`.

---

## 1. Current Game Rendering Architecture (`inGame.js` & `playerInfo.js`)

### 1.1 In-Game State & Player Lifecycle (`Frontend/src/component/component_game/inGame.js`)
- **Authentication Observers (lines 228–245, 324–348)**:
  `inGame.js` integrates dual authentication:
  - Firebase Authentication (`observeAuthState`, `signInAnon`, `auth.currentUser`).
  - Manual JWT Authentication (`getManualUser` from `localStorage`/`sessionStorage` key `gamukis_manual_user`).
  A player is determined to be a guest via:
  ```javascript
  const guest = user.isAnonymous && !signedInManualUser;
  setIsGuest(guest);
  ```
  If `guest` is false, the user is an authenticated registered account.

- **Current Fallback / Randomization Flaw (lines 247–248)**:
  ```javascript
  const playerColors = ["blue", "red", "orange", "yellow", "green", "purple", "man"];
  ...
  const color = randomFromArray(playerColors);
  setPlayerColor(color);
  ```
  Currently, `inGame.js` assigns a random color from `playerColors` to **every** player regardless of whether they are a guest or a registered account with a saved character customization.

- **Socket Registration (`subscribeToGame`, lines 250–264)**:
  The player object transmitted via socket `game:join` contains only:
  ```javascript
  {
    id: playerId,
    name: initialName,
    direction: "right",
    color,
    x,
    y,
    coins: 0,
    health: 3,
    lastQuestionCoins: 0,
    sessionId: sessionIdRef.current,
    answerOwnerId: answerOwnerIdRef.current,
    allQuestion: questions.length
  }
  ```
  No customization data or appearance properties are included or communicated to the server or other players.

- **Canvas Rendering (lines 389–400)**:
  The players are rendered inside `<Camera>` and `<GameMap>`:
  ```jsx
  {randomPlayers
    .filter((key) => Boolean(players[key]))
    .map((key) => (
      <Player
        key={key}
        player={players[key]}
        isCurrentPlayer={key === playerId}
        isButtonMoving={key === playerId && isButtonMoving}
        skillActive={key === playerId && isSkillActive}
        skillIndex={activeSkillIndex}
      />
    ))}
  ```

### 1.2 Player Component (`Frontend/src/component/component_game/playerInfo.js`)
- `Player` receives `{ player, isCurrentPlayer, isButtonMoving, skillActive, skillIndex }`.
- Line 36 extracts `{ name, coins, color, direction, x, y } = player`.
- Line 39 checks:
  ```javascript
  const isSvgCharacter = (color) => color === 'man';
  ```
- Lines 61–69 render:
  ```jsx
  <div
    className={`Character grid-cell ${isCurrentPlayer ? 'you' : ''} ${(isMoving || isButtonMoving) ? 'moving' : ''}`}
    style={{
      transform: `translate3d(${left}, ${top}, 0)`,
      zIndex: isBehindHouseOrTree ? 1 : (y + 3) * 10 + 5
    }}
    data-color={color}
    data-direction={direction}
  >
    <div className="Character_shadow grid-cell"></div>
    {isSvgCharacter(color) ? (
      <div className="Character_svg grid-cell"></div>
    ) : (
      <div className="Character_sprite grid-cell"></div>
    )}
    <div className="Character_name-container">
      <span className="Character_name">{name}</span>
      <span className="Character_coins">{coins}</span>
    </div>
    {isCurrentPlayer && <div className="Character_you-arrow"></div>}
    <SkillEffect active={skillActive} skillIndex={skillIndex} />
  </div>
  ```

### 1.3 Sprite Rules in `style.css` (`Frontend/src/component/component_game/style.css`)
- **Default Guest Character Sprite (`.Character_sprite`)**:
  - Background: `url(../../images/characters.png)` (16px x 16px frames scaled by 3 to 48px).
  - Background position offset by `data-color="red"`, `data-color="orange"`, etc. (lines 138–151).
  - Moving animation: `pixel-character-step` (line 481) shifts `translateY(-1px)` without cycling limb frames.
- **SVG Character (`.Character_svg`)**:
  - Background: `url('../../images/char-man-1.svg') no-repeat`.
  - Dimensions: width 19px, height 36px.
  - Directional background offsets for `down` (0px), `up` (-37px), `left` (-72px), `right` (-110px).
  - Moving keyframes: `walk-down`, `walk-up`, `walk-left`, `walk-right` (lines 592–610).

---

## 2. Character Customization System Anatomy

### 2.1 UI Entry & Customization Flow
- Route: `/character-customization` defined in `src/pages/characterCustomization.js` exporting `src/component/component_customization_char/characterCustomization.js`.
- Linked from User Profile (`Frontend/src/component/component_profile/profileHero.js` line 20: "Kustomisasi karakter" button).
- Categories available on tabs:
  1. **Rambut** (Hairstyle & color)
  2. **Baju** (Shirt)
  3. **Celana** (Pants)
  4. **Sepatu** (Shoes)
  5. **Gender**: `Laki-laki` / `Perempuan`
  6. **Warna Kulit**: 4 palette swatches

### 2.2 Storage Model & Serialization
When the user clicks "Konfirmasi Karakter Anda" in `characterCustomization.js` (lines 442–470), two keys are persisted to `window.localStorage`:
1. `gamukis_character_outfit`:
   ```json
   {
     "shirt": "shirt-original",
     "pants": "pants-original",
     "shoes": "shoes-original"
   }
   ```
2. `gamukis_character_appearance`:
   ```json
   {
     "version": 1,
     "gender": "Laki-laki",
     "hair": "bun",
     "hairColor": "#1D2430",
     "skinTone": "#F6D7B5",
     "outfit": {
       "shirt": "shirt-original",
       "pants": "pants-original",
       "shoes": "shoes-original"
     },
     "shirtSpriteSheets": {
       "idle": "/static/media/...",
       "walk": "/static/media/...",
       "skill": "/static/media/..."
     },
     "layers": ["legs", "pants", "shoes", "body", "shirt", "head", "hands"],
     "frameGrid": {
       "columns": 4,
       "rows": 4,
       "directions": ["front", "back", "left", "right"]
     },
     "compatibleActions": ["idle", "walk", "skill"]
   }
   ```

### 2.3 Backend & Database Infrastructure
- **REST Endpoints (`Backend/src/routes/characterRoute.js`)**:
  - `GET /api/characters`: Lists user's characters.
  - `POST /api/characters`: Stores `{ name, data }` up to 20KB in MySQL table `characters`.
  - `PUT /api/characters/:id`: Updates character name/data.
  - `PATCH /api/characters/:id/active`: Marks active character.
- **Realtime Game Socket (`Backend/src/services/realtimeGameSocket.js` & `realtimeGameService.js`)**:
  - `game:join`: Stores player state in Redis hash `game:global:players`.
  - `player:update`: Currently whitelists only `name`, `color`, and `lastQuestionCoins`. Whitelisting `customization` allows socket-level sync for multiplayer.

---

## 3. Character Asset Inventory & Sprite Breakdown

All modular character assets are located in `Frontend/src/images/asset_game/character/`.

### 3.1 Hairstyle Assets (`hair/`)
Hairstyles are 4-row x 4-column sprite sheets covering front, back, left, and right:
- **Hairstyles**:
  - `bun` (`hair_1_male_*.png`)
  - `wave` (`hair_2_male_*.png`)
  - `short` (`hair_3_male_*.png`)
  - `bob` (`hair_4_male_*.png`)
- **Color Palette (9 colors)**:
  - Hitam (`#1D2430`), Biru (`#3B82F6`), Cokelat/Oranye (`#F39E4E`), Hijau (`#3DAA87`), Ungu (`#7B5EF3`), Merah Muda (`#F6C3D2`), Merah (`#EF4444`), Putih/Silver (`#D9E2F2`).

### 3.2 Male Body & Skin Assets (`gender/male/`)
Divided into skin color indices 1 to 4 (`skinTones = ['#F6D7B5', '#E7C09A', '#C78B5C', '#8A5636']`):
- **Idle Parts (`gender/male/idle/`)**:
  - Heads: `Head_front_color_<1..4>.png`, `Head_back_color_<1..4>.png`, `Head_left_color_<1..4>.png`, `Head_right_color_<1..4>.png` (134x134px individual directional heads).
  - Torso: `char_male_idle_body_color_<1..4>.png` (71x130px).
  - Legs: `char_male_idle_legs_color_<1..4>.png`.
  - Hands: `char_male_idle_hands_color_<1..4>.png`.
- **Walk Parts (`gender/male/walk/`)**:
  - Full 4-direction x 4-frame sprite sheets (1408 x 2946px):
    - `char_male_walk_body_color_<1..4>.png`
    - `char_male_walk_legs_color_<1..4>.png`
    - `char_male_walk_head_color_<1..4>.png`
    - Directional heads: `Head_<direction>_color_<1..4>.png`

### 3.3 Clothing / Outfit Assets (`gender/male/walk/`)
Structured as 4-direction x 4-frame sprite sheets (1408 x 2946px):
- **Shirts (`gender/male/walk/shirt/`)**:
  - `original`, `camo`, `fire`, `ice`, `purple` -> `walk_shirt_<style>_sheet.png`.
- **Pants (`gender/male/walk/pants/`)**:
  - `original`, `black`, `brown`, `green_cargo`, `light_gray` -> `walk_pants_<style>_sheet.png`.
- **Shoes (`gender/male/walk/shoes/`)**:
  - `original`, `boots_black`, `boots_brown`, `low_black`, `low_blue`, `low_brown`, `low_red`, `sneakers_blue`, `sneakers_red` -> `walk_shoes_<style>_sheet.png`.

### 3.4 Female Assets (`gender/female/`)
- `char_woman_idle_white.png` (83 x 144px in `gender/female/idle/`).

### 3.5 Layer Stacking Order & Frame Matrix
In `CharacterPreview.js` and `characterCustomization.css`:
1. `legs` (z-index: 1)
2. `body` (z-index: 2)
3. `pants` (z-index: 3)
4. `hands` (z-index: 3)
5. `shirt` & `shoes` (z-index: 4)
6. `head` (z-index: 6)
7. `hair` (z-index: 7)

**Spritesheet Grid Mapping**:
- Row 0: `front` (mapped to movement direction `down`)
- Row 1: `back` (mapped to movement direction `up`)
- Row 2: `left` (mapped to movement direction `left`)
- Row 3: `right` (mapped to movement direction `right`)
- Columns 0–3: Walk animation steps (`--walk-frame-x-0` through `--walk-frame-x-3`).

---

## 4. Guest vs Registered Identification & State Resolution

| Aspect | Guest (Unregistered) Player | Registered User (with Customization) | Registered User (without Customization) |
|---|---|---|---|
| **Auth Status** | `user.isAnonymous === true` AND `!getManualUser()` | `!user.isAnonymous` OR `Boolean(getManualUser())` | `!user.isAnonymous` OR `Boolean(getManualUser())` |
| **`isGuest` Flag** | `true` | `false` | `false` |
| **Name Field** | Random animal name (`createName()`), editable in UI | Account username / displayName, locked in UI | Account username / displayName, locked in UI |
| **Customization Source** | None (`null`) | `localStorage.getItem('gamukis_character_appearance')` | Missing or empty `{}` in `localStorage` |
| **Resolved Appearance** | `null` | Valid appearance object `{ gender, hair, hairColor, skinTone, outfit }` | `null` |
| **Renderer Behavior** | Safely renders default `Character_sprite` (`characters.png`) or `Character_svg` | Renders personalized layered avatar appearance on game canvas | Safely falls back to default `Character_sprite` or `Character_svg` |
| **Error Handling** | Guaranteed fallback, no missing property errors | Validated layer asset paths, falls back gracefully if asset missing | Guaranteed fallback, no crash |

---

## 5. Detailed Resolution Mechanism for `inGame.js` and `playerInfo.js`

### 5.1 Changes Required in `inGame.js`
1. **Load Customization for Registered Users**:
   Add helper to resolve appearance from `localStorage`:
   ```javascript
   const loadSavedCustomization = () => {
     try {
       const appearance = JSON.parse(window.localStorage.getItem('gamukis_character_appearance') || '{}');
       if (appearance && appearance.gender && appearance.hair) {
         return appearance;
       }
     } catch (e) {}
     return null;
   };
   ```
2. **Propagate into Game Subscription**:
   When `observeAuthState` detects a registered player (`!guest`), retrieve `loadSavedCustomization()`. Pass `customization: !guest ? savedCustomization : null` into `subscribeToGame({ player: { ... } })`.
3. **Pass Customization into `<Player />`**:
   For the local player (`isCurrentPlayer`), ensure `customization` is passed either from the player record or resolved directly from `savedCustomization`. This guarantees immediate local display even if backend socket sync is in progress.

### 5.2 Changes Required in `playerInfo.js`
1. **Resolve Customization Prop**:
   ```javascript
   const Player = ({ player, isCurrentPlayer, isButtonMoving = false, skillActive, skillIndex, currentCustomization }) => {
     ...
     const customization = player.customization || (isCurrentPlayer ? currentCustomization : null);
     const hasCustomization = Boolean(customization && customization.gender);
   ```
2. **Conditional Rendering in JSX**:
   ```jsx
   <div
     className={`Character grid-cell ${isCurrentPlayer ? 'you' : ''} ${(isMoving || isButtonMoving) ? 'moving' : ''} ${hasCustomization ? 'customized' : ''}`}
     style={{
       transform: `translate3d(${left}, ${top}, 0)`,
       zIndex: isBehindHouseOrTree ? 1 : (y + 3) * 10 + 5
     }}
     data-color={color}
     data-direction={direction}
   >
     <div className="Character_shadow grid-cell"></div>
     {hasCustomization ? (
       <CustomPlayerRenderer
         customization={customization}
         direction={direction}
         isMoving={isMoving || isButtonMoving}
       />
     ) : isSvgCharacter(color) ? (
       <div className="Character_svg grid-cell"></div>
     ) : (
       <div className="Character_sprite grid-cell"></div>
     )}
     <div className="Character_name-container">
       <span className="Character_name">{name}</span>
       <span className="Character_coins">{coins}</span>
     </div>
     {isCurrentPlayer && <div className="Character_you-arrow"></div>}
     <SkillEffect active={skillActive} skillIndex={skillIndex} />
   </div>
   ```
3. **Canvas Positioning & Alignment**:
   In `style.css`, add styling for `.Character.customized` to adapt the 62x107px avatar into the 48px tile:
   - Apply `transform: scale(0.48)` or equivalent anchor scaling so the avatar's feet align squarely on `Character_shadow`.
   - Adjust `.Character.customized .Character_name-container` top position (`top: -36px`) and `.Character_you-arrow` (`top: -26px`) consistent with the SVG character adjustment.

---

## 6. Verification and Testing Method

1. **Guest Player Verification**:
   - Open game in incognito or without logging in (`guest === true`).
   - Verify console is free of `TypeError` or `undefined` property access.
   - Verify player renders using standard `Character_sprite` from `characters.png` (or SVG if man).
   - Verify guest name is generated from `createName()` and name input is editable in `PlayerPanel`.

2. **Registered Player Customization Verification**:
   - Log in via manual authentication or Firebase.
   - Navigate to `/character-customization`, change hair, hair color, skin tone, shirt, pants, shoes.
   - Confirm customization to save to `localStorage`.
   - Enter `/inGame`.
   - Verify the rendered avatar shows the configured gender, hairstyle, hair color, skin tone, and outfit.
   - Verify movement in all 4 directions (`down`/`front`, `up`/`back`, `left`, `right`) displays the corresponding direction view.

3. **Fallback Resiliency Verification**:
   - For a registered player, corrupt or clear `gamukis_character_appearance` in `localStorage` (`localStorage.removeItem('gamukis_character_appearance')`).
   - Reload `/inGame`.
   - Verify the game does not crash and safely falls back to rendering the default character sprite.

