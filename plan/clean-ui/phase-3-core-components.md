# Phase 3: Core Layout + Shared Components

**Status:** Pending

## Goals

- Match clean-ui header/footer and construction banner.
- Update shared UI primitives to new token names.
- Align key shared components with reference UI patterns.

## Tasks

1. Layout structure.
   - Update `apps/web/src/app/layout.tsx` to use clean-ui structure:
     - Construction banner
     - Site header
     - Main container sizing (e.g. `max-w-3xl` or `max-w-5xl` depending on page)

2. Header + banner.
   - Create or update equivalents for:
     - `ConstructionBanner`
     - `SiteHeader` (navigation + visitor counter + theme toggle)
     - `ThemeToggle` (system/light/dark cycling)
   - Decide how to integrate auth + admin links into clean-ui header layout.

3. Token migration in UI primitives.
   - Update `apps/web/src/components/ui/*` to use clean-ui token names:
     - `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`, etc.

4. Core content components.
   - Update `apps/web/src/components/project/ProjectCard.tsx` to clean-ui layout.
   - Add/replace slop score visualization with clean-ui `SlopMeter` pattern.
   - Adjust `VisitorCounter` styling to use tokens, not inline hardcoded colors.

## Files to Change

- `apps/web/src/app/layout.tsx`
- `apps/web/src/components/layout/Header.tsx` (or new `SiteHeader` component)
- `apps/web/src/components/layout/VisitorCounter.tsx`
- `apps/web/src/components/theme/ThemeToggle.tsx` (new or adapted)
- `apps/web/src/components/project/ProjectCard.tsx`
- `apps/web/src/components/ui/*`

## Reference Files

- `clean-ui/components/construction-banner.tsx`
- `clean-ui/components/site-header.tsx`
- `clean-ui/components/project-card.tsx`
- `clean-ui/components/slop-meter.tsx`
- `clean-ui/components/theme-toggle.tsx`
- `clean-ui/components/visitor-counter.tsx`

## Verification Checklist

- [ ] Header matches clean-ui visual structure and spacing.
- [ ] Theme toggle cycles system/light/dark.
- [ ] UI primitives render with new tokens and no legacy classes.
- [ ] Project cards match clean-ui layout and interaction states.
- [ ] Visitor counter uses tokens and renders correctly in light/dark.
