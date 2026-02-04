# Phase 9: Drip Surface Texture (Optional)

**Status:** Draft  
**Owner:** TBD  
**Date:** 2026-01-30

## Goal
Add a subtle **surface/texture effect** to the drip blobs or card surfaces so the slop reads as “wet paint,” without compromising readability.

## Scope
- Main feed (`/`) project cards only.
- Slop Mode only.
- Texture should be subtle and easy to remove.
- Build on the modular SlopBlob component from Phase 8 (no new layout rules).
 - Only proceed after the **goo silhouette** matches the SVG-mask baseline.

## Non-Goals
- Animated noise or continuously changing texture.
- Applying to all UI components.

## Approach (Options)
- **Option A: Overlay texture layer** on the card using a pseudo-element and a procedural SVG noise mask.
- **Option B: Texture only on the blobs** (lighter surface; less distraction).
- **Option C: No texture if geometry already reads clearly.**

## Implementation Outline
1. Decide whether texture is applied to **cards**, **blobs**, or **both**.
2. Add a **single CSS variable** for a noise texture data-URL (static, not animated).
3. Use a low-opacity overlay (`mix-blend-mode: multiply`) to keep text legible.
4. Gate behind Slop Mode so it can be toggled off quickly.

## Files to Touch
- `apps/web/src/app/globals.css`
- (optional) `apps/web/src/lib/slop-texture.ts` if generating SVG data URLs
- `apps/web/src/components/project/ProjectCard.tsx` (if blob-only)
 - `apps/web/src/components/slop/SlopBlobs.tsx` (if texture is blob-only)

## Open Questions / Choices
- **Performance:** should we inline a static data URL or generate once at runtime?
- **Opacity level:** what’s the threshold where texture feels intentional vs noisy?
- **Blend mode support:** do we want a safe fallback for browsers that ignore `mix-blend-mode`?

## Verification Checklist
- Texture reads as subtle “paint” on desktop + mobile.
- No readability loss on text or badges.
- Easy to disable by toggling Slop Mode or removing one class.
