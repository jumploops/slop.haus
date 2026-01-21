# Retro UI Migration Plan

**Status:** Draft
**Owner:** TBD
**Last updated:** 2026-01-20

## Overview

Transform the entire `apps/web` UI to the 90s/early 2000s retro aesthetic defined in `reference-ui/DESIGN-LANGUAGE.md`. Retro becomes the default theme, all pages are restyled, and approved assets from `reference-ui/public` are used.

## Goals

- Make retro the default visual language across all pages (feed, project detail, submit, admin, settings, theme gallery, etc.).
- Preserve the existing semantic token system and Tailwind v4 authoring constraints.
- Match the reference UI patterns: beveled buttons, inset/outset panels, slop score badges, retro fonts, tiled background, and marquee/blink flourishes.
- Remove the theme switcher UI while keeping the theme system intact for future use.

## Non-Goals

- Rewriting product IA or feature behavior.
- Introducing new dependencies or a new component library.

## Decisions

- Retro theme is the default theme.
- All pages are fully retro-styled.
- Assets from `reference-ui/public` are approved for production use.
- Theme switcher UI is removed for now.
- Marquee/blink effects are allowed in production.

## Phases

| Phase | Name | Status |
| --- | --- | --- |
| 1 | Tokens + Global Styles | Not started |
| 2 | Retro Component Variants | Not started |
| 3 | Page-Level Reskin | Not started |
| 4 | Motion + Assets | Not started |

## Dependencies

- `reference-ui/DESIGN-LANGUAGE.md`
- `reference-ui/app/globals.css` and `reference-ui/components/*`
- `reference-ui/public` assets

## Notes

- Avoid new standalone CSS classes when Tailwind utilities or existing UI components can achieve the same effect.
- Replace legacy class placeholders (e.g., `feed-controls`, `empty-state`) with explicit Tailwind composition or shared components.
