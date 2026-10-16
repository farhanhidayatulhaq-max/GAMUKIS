# Dispatch — sprite-preview-regression-audit

Status: in-progress
From: Codex · GPT-5 · 2026-10-15
Lead/integrator: Codex

## PRD / requirement objective
Audit and repair the character-customization preview in Idle, Walk, and Skill 1. The governing approved PRD is `.agents/docs/prds/sprite-preview-fixes/PRD.md`.

## Requested output
- Visual and source evidence for every confirmed coordinate or layering defect.
- A minimal fix restricted to the approved PRD blueprint.
- Focused tests, build evidence, and an independent review verdict.

## Allowed to modify
- `Frontend/src/component/component_customization_char/molecules/CharacterPreview.js`
- `Frontend/src/component/component_customization_char/characterCustomization.css`
- `Frontend/src/component/component_customization_char/characterCustomization.js`
- `Frontend/src/__tests__/game/character_customization_walk_skill.test.js`
- `.agents/teamwork/INDEX.md`

## Owned by another agent / forbidden
- During the audit phase, no runtime file has an implementation owner.
- Reviewers must not edit runtime files.
- All files outside the approved PRD blueprint are forbidden.

## Contracts and dependencies
- Preserve action controls, existing asset paths, layer order, pixel proportions, and public component interfaces.
- Preserve Idle shirt offsets and apply matching directional anchors during Walk.
- Do not modify game runtime, assets, API clients, routes, persistence, or authentication.

## Verification required
- `cd Frontend && npm test -- --watchAll=false --runInBand --runTestsByPath src/__tests__/game/character_customization_walk_skill.test.js`
- `cd Frontend && npm run build`
- Inspect `http://localhost:3000/character-customization` across Idle, Walk, Skill 1, and each available direction.

## Report location
`.agents/teamwork/sprite-preview-regression-audit/`

