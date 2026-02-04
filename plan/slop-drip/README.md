# Slop Drip (Screen-Space Goo) Plan

## Overview
We want a reusable, gravity-aware “slop drip” effect that stays attached to the lowest-facing edge of a rotated element while drips fall straight down the screen. The effect should be reusable across cards, badges, headers, etc., and configurable via a small, predictable API.

This plan turns the design in `design/slop-drip-example.md` into a concrete implementation spec and phase breakdown.

## Goals
- **Gravity-aware drips** that fall vertically even when the target element is rotated/tilted.
- **Attachment to the lowest-facing edge** of the transformed element.
- **Reusable, generic component + utils** for any target ref.
- **Configurable knobs**: attach range, thickness, max drop, pooling bias, viscosity, z-index, color.
- **Slow, subtle animation** (drips + optional soft wobble).

## Non-Goals
- Full fluid physics simulation or GPU-driven shaders.
- Mobile-heavy perf optimizations beyond keeping the SVG bounds tight.
- Implementing slop mode UI toggles (assumed already exists).

## Core Design Decisions
- **Render in screen space** via a portal and `position: fixed` overlay so “down” is always screen-down.
- **Compute the “downmost edge”** of the element’s transformed rectangle in viewport coordinates.
- **Draw metaballs + gooey SVG filter** (blur + alpha threshold + optional turbulence).
- **Use seeded RNG per mount** to make each instance feel organic while avoiding SSR mismatches.

## API Shape (Draft)
```ts
export type Attach =
  | { mode?: "percent"; start: number; end: number }
  | { mode: "pixels"; startPx: number; lengthPx: number };

export type SlopGooProps = {
  targetRef: React.RefObject<HTMLElement>;
  seed?: number;
  rotationDeg?: number;
  attach?: Attach;
  color?: string; // default should map to a semantic token
  thickness?: number;
  maxDrop?: number;
  blur?: number;
  threshold?: number;
  beadSpacing?: number;
  dripCount?: number;
  poolBias?: number; // 0..1
  viscositySeconds?: number;
  edgeInset?: number;
  edgeInsetLowEnd?: number;
  edgeOffset?: number;
  edgeFeather?: number;
  borderOffset?: number;
  useBorderOffset?: boolean;
  zIndex?: number;
  enabled?: boolean;
};
```

## Files/Areas Likely Touched (to confirm during implementation)
- `apps/web/src/components/...` (component placement; reuse existing slop-related folder if it exists)
- `apps/web/src/lib/...` (geometry + RNG utilities)
- `apps/web/src/app/globals.css` or `apps/web/src/styles/...` (keyframes + goo class)

## Phases
| Phase | Doc | Status | Output |
|------:|-----|--------|--------|
| 1 | `phase-1-utilities.md` | Complete | Geometry + RNG utilities for downmost-edge selection |
| 2 | `phase-2-component.md` | Complete | `SlopGoo` component + SVG goo filter + animation |
| 3 | `phase-3-integration.md` | Partial | Usage guidance, reduced-motion handling, perf notes |

## Dependencies / Constraints
- No new dependencies unless strictly necessary.
- Prefer semantic Tailwind tokens for color defaults (e.g. `bg-accent` via CSS variables).
- Must tolerate transforms/tilts applied by “slop mode.”
- Keep the filtered SVG region tight to avoid perf spikes.

## Open Questions
- Should the default color be derived from an existing theme token or a new `--slop-goo` variable?
- Do we want the goo to appear behind or above the target by default?
- Do we need a global registry to avoid overlapping z-index layers for multiple instances?

## Verification (High-Level)
- Drips remain vertical during scroll/resize and while target rotates.
- Goo stays attached to the lowest-facing edge across tilt directions.
- Reduced-motion mode disables falling drips but keeps a static edge blob.
- No pointer interference (overlay is `pointer-events: none`).
