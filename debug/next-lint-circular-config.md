# next lint Circular Config Error

## Status

- **Type:** Investigation + fix plan
- **Date:** 2026-03-03
- **Scope:** `apps/web` lint command

## Problem

Running `pnpm lint` in `apps/web` fails with:

- deprecation warning for `next lint`, and
- `Converting circular structure to JSON ... property 'react' closes the circle`

Referenced from `apps/web/.eslintrc.json`.

## Findings

1. `apps/web/package.json` currently runs lint via `next lint`.
2. Next already warns that `next lint` is deprecated and recommends migration to ESLint CLI.
3. The circular-JSON failure occurs in `next lint`'s config handling path for this ESLint plugin setup.
4. This is a tooling/config path issue, not a source-code lint error.

## Root Cause Hypothesis

High confidence:
- `next lint` is attempting to serialize a config graph that now includes circular references from plugin flat configs (notably React plugin objects), causing command failure before lint rules execute.

## Fix Strategy

Migrate web linting off `next lint` to ESLint CLI:

1. Add `apps/web/eslint.config.mjs` (flat config) using `eslint-config-next` presets.
2. Update `apps/web/package.json` script:
   - from: `next lint`
   - to: `eslint .`
3. Keep existing lint scope rooted at `apps/web`.

## Expected Outcome

- `pnpm lint` runs non-interactively.
- No circular JSON serialization error from `next lint` path.
- Setup aligns with Next's deprecation guidance.
