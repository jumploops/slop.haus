# Phase 1: Audit + Scaffolding

**Status:** Completed (2026-01-22)

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

## Findings

### Theme-Related Inventory

- Theme provider + hooks:
  - `apps/web/src/components/theme/ThemeProvider.tsx`
  - `apps/web/src/hooks/useTheme.ts`
  - `apps/web/src/lib/theme-constants.ts`
- Theme UI:
  - `apps/web/src/components/theme/ThemeSwitcher.tsx`
  - `apps/web/src/components/theme/ThemeGenerator.tsx`
  - `apps/web/src/components/theme/ThemePreview.tsx`
- Theme routes:
  - `apps/web/src/app/theme-gallery/page.tsx`
- Provider wiring:
  - `apps/web/src/app/providers.tsx`

### Token Replacement Map (Proposed)

| Current Token | Proposed Clean-UI Token | Notes |
| --- | --- | --- |
| `bg-bg` | `bg-background` | Direct map |
| `text-fg` | `text-foreground` | Direct map |
| `bg-bg-secondary` | `bg-card` (or `bg-muted`) | Contextual: cards/inputs → `bg-card`; subtle panels → `bg-muted` |
| `text-muted` | `text-muted-foreground` | Direct map |
| `border-border` | `border-border` | Direct map |
| `bg-accent` / `text-accent` | `bg-primary` / `text-primary` | Clean UI uses `primary` for emphasis |
| `bg-accent-foreground` / `text-accent-foreground` | `bg-primary-foreground` / `text-primary-foreground` | Direct map |
| `bg-accent-dim` | `bg-primary/10` | Use opacity utilities in Tailwind |
| `bg-danger` / `text-danger` | `bg-destructive` / `text-destructive` | Direct map |
| `bg-warning` / `text-warning` | `bg-slop-orange` / `text-foreground` | Decide per component (style guide uses slop-orange) |
| `bg-success` / `text-success` | `bg-primary` or `bg-slop-lime` | Decide per component (style guide uses slop-lime) |

### Scope Signal

- `rg` shows 400+ occurrences of legacy tokens (`bg-bg`, `text-fg`, etc.) across pages and components.
- Layout containers currently rely on CSS variables in `apps/web/src/styles/theme.css` (e.g. `--app-container-max`). Clean UI uses fixed `max-w-*` classes.

## Verification Checklist

- [x] Token usage inventory complete.
- [x] Theme-related components/routes accounted for.
- [x] Non-reference pages identified for Style Guide application.
