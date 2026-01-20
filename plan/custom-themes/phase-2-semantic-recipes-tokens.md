# Phase 2: Semantic Recipes + Tokens

Status: pending

## Goal

Create the semantic recipe layer and expand token contracts to support structural/layout theming.

## Scope

- Add `recipes.css` with semantic component classes using Tailwind `@apply`.
- Expand token set in `theme.css` and `presets.css` for structural/layout knobs.
- Ensure base theme matches current UI.

## Files to Change

- `apps/web/src/styles/recipes.css` (new)
- `apps/web/src/app/app.css` (import recipes)
- `apps/web/src/styles/theme.css` (new structural + layout tokens)
- `apps/web/src/styles/presets.css` (extend overrides)
- `apps/web/src/styles/TOKEN-CONTRACT.md` (update contract)

## Implementation Notes

- Keep Tailwind as authoring surface; components consume semantic classes.
- Add tokens for:
  - border width/style
  - radius scale
  - shadows
  - layout knobs: `--app-container-max`, `--app-grid-cols`, `--app-card-pad`, `--app-page-gutter`

## Verification Checklist

- [ ] Recipes compile without CSS errors.
- [ ] Current UI visually matches pre-migration defaults.
- [ ] Token contract updated with new structural/layout tokens.
