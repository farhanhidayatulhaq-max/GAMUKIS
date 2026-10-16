# PRD: Sprite Preview Layout and Walk Idle Fixes

## 1. Document Control

- **Status:** APPROVED — project owner approved in the task conversation
- **Owner:** Project owner / designated lead
- **Scope:** Male character customization preview rendering for Skill 1, Hair Model 2 Walk left/right, and existing Idle/Walk shirt alignment
- **Primary objective:** Correct detached or misaligned Skill 1 sprite layers in all four directions, keep Hair Model 2 animated while stabilizing its per-frame coordinates in Walk left/right previews, and preserve the existing direction-specific shirt anchors consistently in Idle and Walk.
- **Non-goals:** Reworking gameplay rendering outside character customization, changing sprite art, renaming/moving assets, changing global animation behavior, or refactoring unrelated customization UI.

## 2. Problem Statement

The Skill 1 preview can display character layers apart from the body in the provided screenshot. Hair Model 2 Walk previews in Left and Right orientations show excessive positional movement between animation frames. The animation itself must remain active. The shirt has established direction-specific offsets for Idle; Walk's shared transform overrides these anchors. Retain the existing Idle placements and apply the same per-direction anchors during Walk. Existing source paths show the preview component loads layered body, clothing, and hair assets, while CSS controls directional positioning and sprite-sheet animation.

The exact cause of the Skill 1 layout defect must be established by comparing the active assets, frame dimensions, crop positions, and rendered layer geometry before choosing a correction. The implementation must not introduce guessed offsets.

## 3. Requirements

1. Trace Skill 1 asset selection and rendering for Front, Back, Left, and Right.
2. Identify and correct the actual source of layer separation while preserving proportions, pixel-art appearance, transparency, layer order, and existing asset files.
3. Keep Skill 1 layer positioning correct for all four directions; do not copy a directional correction blindly to other directions.
4. For Hair Model 2 (`selectedHair === 'wave'`) in Walk Left and Right, preserve frame animation while correcting per-frame crop and translation coordinates so the hair stays anchored to the head.
5. Restore normal animation when the action, direction, or hair model changes; preserve all unaffected Walk behavior.
6. Reuse current assets and rendering architecture. Do not change asset names, folder structure, or public interfaces.
7. Add or update focused regression assertions for both issues in the existing customization test file.
8. Preserve the existing Idle shirt offsets for all four directions and use matching offsets in Walk while keeping its body bob synchronized.

## 4. Acceptance Criteria

- Skill 1 produces a coherent character in Front, Back, Left, and Right.
- No detached layers, duplicate body parts, unintended gaps, or clipping are introduced.
- Hair Model 2 continues animating in Walk Left and Right without excessive positional jumps between frames.
- Existing Idle shirt placement remains unchanged; Walk shirt placement uses the corresponding direction anchor for Front, Back, Left, and Right.
- Hair Model 2 animation and all other hair/action/direction combinations retain their intended behavior.
- The fix is limited to the files in the approved blueprint; no sprite assets are replaced or edited.

## 5. File & Folder Blueprint

Only these existing files may be modified:

| Path | Planned responsibility |
|---|---|
| `Frontend/src/component/component_customization_char/molecules/CharacterPreview.js` | Correct narrowly scoped asset selection or preview state handling if the investigation proves it is required. |
| `Frontend/src/component/component_customization_char/characterCustomization.css` | Correct Skill 1 directional layer layout and Hair Model 2 Walk Left/Right animation behavior. |
| `Frontend/src/component/component_customization_char/characterCustomization.js` | Adjust action/direction/variant configuration only if required by the confirmed root cause. |
| `Frontend/src/__tests__/game/character_customization_walk_skill.test.js` | Add or update focused regression coverage for the approved behavior. |
| `.agents/teamwork/INDEX.md` | Track the approved sprite preview task and its current status. |

No new runtime files, folders, or image assets are approved. If investigation proves another file or asset must change, implementation must pause until this blueprint is amended and approved.

## 6. Investigation and Verification Plan

1. Compare the active Skill 1 sprite sheets and directional frame geometry against the preview's CSS crop and placement rules; verify the named direction rows in the clothing frame assets.
2. Trace the Walk and hair animation selectors, including action/direction/variant transitions and any animation lifecycle cleanup.
3. Implement the smallest correction supported by that evidence.
4. Run the focused customization regression tests and the Frontend build if permitted by task-level instructions; record exact commands and results.
5. Inspect the final diff to confirm every modified path is listed in this blueprint and unrelated variants remain untouched.

## 7. Repository Memory Check

- `.agents/memory/DECISIONS.MD` protects the stable in-game renderer at `Frontend/src/component/component_game/inGame.js`; this PRD does not include that file.
- `.agents/memory/LESSONS_LEARNED.md` contains no prior sprite-preview root cause or correction that supersedes the investigation required here.

## 8. Owner Clarification

The project owner clarified that Hair Model 2 must continue animating; only excessive per-frame positional movement should be corrected. The implementation was updated to preserve the atlas animation and stabilize its coordinates.

## 9. Approval Gate

This PRD and its blueprint were approved by the project owner in the task conversation. The owner clarification in §8 amends the animation requirement. The project owner approved adding Idle/Walk shirt alignment. During review, the owner clarified that existing Idle placement must remain intact; only the Walk transform should match those established per-direction offsets. An unsupported row remapping was removed after checking the clothing frame filenames, which confirm `front`, `back`, `left`, and `right` in rows 0–3.
