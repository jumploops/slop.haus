# Phase 1: ThemeSpec + Compiler

Status: pending

## Goal

Define a safe ThemeSpec schema and compiler that emits variable-only CSS for user themes, including `.theme-scope` selectors for previews.

## Scope

- Schema (Zod or equivalent) for safe user theme inputs.
- Compiler mapping enums + allowlists to CSS variables.
- Emit selectors for `:root[data-theme="user:<id>"]` and `.theme-scope[data-theme="user:<id>"]`.
- No raw CSS or arbitrary selectors allowed.

## Files to Change

- `packages/shared/src/theme-schema.ts` (new)
- `packages/shared/src/theme-compiler.ts` (new)
- `apps/web/src/hooks/useTheme.ts` (consume compiled CSS only)
- `apps/api/src/routes/themes.ts` (new endpoint for compile/validate, if needed)

## Implementation Notes

- ThemeSpec should be enums + clamped numbers only.
- Compiler outputs only CSS variables (no `url()`, no `@import`).
- Store JSON + compiled CSS separately.
- Always emit `.theme-scope` selectors for previews.

## Code Sketch

```ts
// compileTheme(theme): string
// - map enums to vars
// - clamp numbers
// - output selectors for root + theme-scope
```

## Verification Checklist

- [ ] Schema rejects unknown keys and unsafe values.
- [ ] Compiler output contains only CSS variables and allowed selectors.
- [ ] `.theme-scope` selectors render correctly in preview.
- [ ] Injected CSS does not allow `url()` or `@import`.
