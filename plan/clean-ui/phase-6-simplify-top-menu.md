# Phase 6: Simplify Top Menu

**Status:** Draft
**Owner:** TBD
**Last Updated:** 2026-01-23

## Goal

Move user-specific links (Favorites, My Projects, Settings, Admin) out of the top menu bar and into the user avatar/name dropdown. Ensure both desktop and mobile navigation reflect the simplified top menu.

## Current Implementation (Findings)

### Desktop Header
- `apps/web/src/components/layout/Header.tsx`
- Top menu currently includes:
  - Feed ("New")
  - Submit
  - Favorites (session gated)
  - My Projects (session gated)
  - Settings (session gated)
  - Admin (admin/mod gated)

### Mobile Navigation
- `apps/web/src/components/layout/MobileNav.tsx`
- Mobile menu currently includes:
  - Feed
  - Submit
  - Favorites (session gated)
  - My Projects (session gated)
  - Settings (session gated)
  - Admin (admin/mod gated)

### User Dropdown (Avatar)
- `apps/web/src/components/auth/AuthButtons.tsx`
- Dropdown currently includes:
  - Favorites
  - Settings
  - Admin/Mod Queue (role gated)
  - Sign Out
- **Missing**: My Projects

## Proposed Changes (Plan)

1. **Header (Desktop)**
   - Remove Favorites, My Projects, Settings, Admin links from `Header.tsx`.
   - Keep only Feed + Submit as persistent top-level navigation.

2. **Mobile Nav**
   - Remove Favorites, My Projects, Settings, Admin from `MobileNav.tsx`.
   - Keep Feed + Submit.

3. **User Dropdown (Avatar)**
   - Add missing "My Projects" link.
   - Keep Favorites, Settings, Admin/Mod Queue, Sign Out.
   - Ensure dropdown order matches desired hierarchy.

4. **Verify**
   - Logged-in user sees Favorites/My Projects/Settings in dropdown only.
   - Admin/mod still sees Admin/Mod Queue in dropdown only.
   - Logged-out user sees no user links in header/mobile nav.

## Files to Change

- `apps/web/src/components/layout/Header.tsx`
- `apps/web/src/components/layout/MobileNav.tsx`
- `apps/web/src/components/auth/AuthButtons.tsx`

## Open Questions

- Should the dropdown include a direct "Profile" link (e.g., `/settings/profile`) or keep "Settings"?
- Should "My Projects" live above Favorites or below?

## Verification Checklist

- Desktop header only shows Feed + Submit (and theme + auth controls).
- Mobile nav only shows Feed + Submit.
- Avatar dropdown includes Favorites, My Projects, Settings, Admin/Mod Queue (if applicable), and Sign Out.
