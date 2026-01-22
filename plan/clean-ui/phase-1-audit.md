# Phase 1: Audit + Scaffolding

**Status:** Pending

## Goals

- Build a precise migration checklist.
- Identify all theme-dependent classnames and components.
- Establish a baseline for the current UI before changes.

## Tasks

1. Inventory all theme-related components and routes.
   - `apps/web/src/components/theme/*`
   - `apps/web/src/app/theme-gallery/*`
   - `apps/web/src/hooks/useTheme.ts`
   - `apps/web/src/lib/theme-constants.ts`

2. Map current token usage to clean-ui tokens.
   - Search for `bg-bg`, `text-fg`, `bg-bg-secondary`, `text-muted`, `bg-accent`, `text-accent`, `bg-warning`, `bg-success`, `bg-danger`.
   - Create a mapping table for replacements.

3. Confirm page coverage.
   - Feed (`apps/web/src/app/page.tsx`)
   - Project detail (`apps/web/src/app/p/[slug]/page.tsx` + project components)
   - Submit, settings, admin, favorites, my projects.

4. Snapshot current layout conventions.
   - Note container widths, header/footer structure, and nav requirements.

## Files to Review

- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/components/layout/Header.tsx`
- `apps/web/src/components/project/*`
- `apps/web/src/components/ui/*`
- `apps/web/src/styles/theme.css`
- `apps/web/src/styles/presets.css`
- `apps/web/src/styles/animations.css`
- `clean-ui/styles/globals.css`
- `clean-ui/components/*`
- `clean-ui/app/*`

## Outputs

- Token replacement map (table in this file or a short appendix).
- Confirmed list of files to update per phase.

## Verification Checklist

- [ ] Token usage inventory complete.
- [ ] Theme-related components/routes accounted for.
- [ ] Non-reference pages identified for Style Guide application.
