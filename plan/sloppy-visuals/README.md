# Sloppy Visuals Implementation Spec

**Status:** Draft  
**Owner:** TBD  
**Date:** 2026-01-28

## Objective
Introduce intentionally “sloppy” visual treatments to the main feed page to reinforce the vibecoded chaos theme while keeping the UI readable and navigable. Roll out in small, testable phases so we can evaluate impact and tune the balance between chaos and usability.

## Scope (Initial)
- Focus on the main feed page: feed intro, tabs, display toggles, and project cards.
- Changes should be cosmetic only (no data or behavior changes).

## Out of Scope (for now)
- Project detail page
- Submit flow
- Settings/admin pages
- Global theme rework

## Phase Breakdown

| Phase | Goal | Primary Targets | Doc |
|------|------|------------------|-----|
| 0 | Add Slop Mode toggle + persistence | Header menu, mobile nav, provider | `phase-0-slop-mode-setting.md` |
| 1 | Add “slop” to cards + card chrome | Project cards + card containers | `phase-1-card-slop.md` |
| 2 | Slopify feed controls + intro area | Tabs, view toggles, intro banner | `phase-2-controls-intro.md` |
| 3 | Add ambient mess + layout irregularity | Background texture, broken grid | `phase-3-ambient-chaos.md` |
| 4 | Slopify badges + labels | Badges, score chips, tool tags | `phase-4-badge-label-slop.md` |
| 5 | Add edge treatments | Card/section edges, intro card | `phase-5-edge-treatments.md` |
| 6 | Slopify buttons + inputs | Buttons, tabs, selects, inputs | `phase-6-button-input-slop.md` |
| 7 | Goo/slime bottom edge | Drip masks + pseudo elements | `phase-7-goo-slime-bottom-edge.md` |
| 8 | Drip blob geometry | Project cards (bottom edge) | `phase-8-drip-blob-geometry.md` |
| 9 | Drip surface texture (optional) | Project cards (texture overlay) | `phase-9-drip-surface-texture.md` |

## Dependencies
- None (CSS + component styling only)

## Success Criteria
- Feed page looks noticeably more “sloppy” at rest (not only on hover).
- Readability remains high; no layout shift that interferes with core navigation.
- Treatments are subtle and stable (no random jitter per render).

## Review Notes
- After each phase, review visually on desktop + mobile before proceeding.
- Keep changes token-based and accessible.
