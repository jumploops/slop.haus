# Phase 8: Drip Blob Geometry (Card Bottom)

**Status:** Won't Do (reverted to SVG mask)  
**Owner:** TBD  
**Date:** 2026-01-30

## Current State (As Implemented)
- Blob-based goo was tried and reverted.
- Output read as **isolated dots/ovals** rather than a continuous goo edge.
- Even with lip + drip attempts, it did not match the SVG-mask baseline.
- The main feed cards are back on the **SVG mask** drip approach.

## Goal
Replace the current mask-based drip approach on the main feed project cards with a **modular SlopBlob component** that can be reused across the UI. Blobs hang off the bottom edge, match card tilt direction (left/right/center), and remain **gravity-correct** (vertical relative to the viewport) even when the host is rotated.

## Visual Baseline (Must Match)
The SVG-mask version created a **continuous bottom lip** with **varied drip lengths** that read as a single goo edge. The current blob output (isolated dots/ovals) is **not acceptable**. The geometry must read like **one connected edge** (lip + drips), not polka dots.

## Scope
- Main feed (`/`) project cards only.
- Slop Mode only (no impact when Slop Mode is off).
- Geometry/silhouette only (no texture overlay in this phase).
- Component API should be placement-agnostic (usable on other components later).

## Non-Goals
- Other pages (project details, submit, settings).
- Animated drips or time-based movement.
- Global theming changes.

## Inputs
- Design doc: `design/slop-drip-blobs.md`
- Inspiration (mask-based approach + wet paint split into geometry + texture).

## Approach
- Create a **SlopBlob** component with simple props:
  - `placement` (full, edge-left, edge-right, center, custom)
  - `hostAngle` (degrees, used to counter-rotate so drips remain vertical)
  - `seed` (deterministic per card)
  - optional size/count preset
- Include a **lip segment** by default so blobs read as a connected edge.
- Determine **placement** from the existing slop rotation bucket (`slopIndex`), mapping tilt → left/right/center.
- Use a **seeded layout** so blob placement is stable per card (based on project id/slug).
- Keep styling minimal: one utility class + CSS variables.

## Implementation Outline
1. **Seed strategy:** use project id/slug for deterministic layout (SSR-safe, avoids repetition).
2. **Build SlopBlob** helper/component to return blob layout (positions, sizes, optional offset).
3. **Render blobs** in `ProjectCard` only when Slop Mode is on.
4. **Add CSS utilities** for `.slop-blob` with size + position vars.
5. **Ensure a lip + drips silhouette** (not isolated dots) matches the SVG-mask look.
6. **Remove the previous mask-based drip implementation** (hook + `.slop-drip` usage) from cards.
7. **Remove/replace the current dotty blob styling** so only the new goo edge remains.

## Files to Touch
- `apps/web/src/components/project/ProjectCard.tsx`
- `apps/web/src/app/globals.css`
- (optional) `apps/web/src/lib/slop-blobs.ts` for seeded layout helpers
- (removal) `apps/web/src/lib/slop-drip.ts` and `.slop-drip` usage (if no longer used)
 - (removal) current blob-only CSS if replaced by lip+drip implementation

## Decisions (Based on Current Usage)
- **Seed:** project slug/id (deterministic, SSR-safe).
- **Color:** slop green (consistent with logo).
- **Count + size:** 2–4 blobs per card, small/medium sizes.
- **Placement mapping:** slop rotation bucket → left/right/center.
- **Removal:** replace previous mask-based drip styling and remove it from cards.

## Acceptance Criteria
- Goo reads as **continuous edge** with varied drip lengths (not dots).
- The edge aligns with the **lowest side** of a tilted card.

## Verification Checklist
- Slop Mode on: blobs visible on project cards and aligned with tilt direction.
- Slop Mode off: no blobs and no layout change.
- No layout shifts (blobs do not affect document flow).
- Works on desktop + mobile.
