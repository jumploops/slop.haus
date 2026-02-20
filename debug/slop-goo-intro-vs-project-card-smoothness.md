# Debug: Intro SlopGoo Looks Smoother Than Project Card SlopGoo

**Status:** Completed  
**Date:** 2026-02-20

## Problem
After resolving the hover flash issue, we now see a separate quality gap:
1. The intro `SlopGoo` looks visually smoother.
2. Project-card `SlopGoo` looks rougher/choppier by comparison.

Scope for this document:
1. Re-review current implementation only.
2. Produce ranked hypotheses.
3. Validate the top hypothesis with a minimal targeted change.

## Current Implementation Re-review

### Intro goo configuration
`/Users/adam/code/slop.haus/apps/web/src/app/page.tsx:174`

Notable props:
1. `renderMode="inline"` (`/Users/adam/code/slop.haus/apps/web/src/app/page.tsx:176`)
2. `seed={42}` (fixed seed) (`/Users/adam/code/slop.haus/apps/web/src/app/page.tsx:177`)
3. `blur={6}`, `threshold={16}` (`/Users/adam/code/slop.haus/apps/web/src/app/page.tsx:179`)
4. `thickness={10}`, `maxDrop={50}`, `beadSpacing={18}`, `dripCount={4}` (`/Users/adam/code/slop.haus/apps/web/src/app/page.tsx:182`)
5. `displacementScale={0}`, `animateNoise={false}` (`/Users/adam/code/slop.haus/apps/web/src/app/page.tsx:193`)

### Project-card goo configuration (pre-fix snapshot)
`/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx:88`

Notable props:
1. No `renderMode` prop (so it uses default).
2. Hover-gated mount: `showGoo = sloppy && isHovered` (`/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx:86`)
3. `thickness={isGrid ? 10 : 12}`, `maxDrop={isGrid ? 55 : 75}` (`/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx:93`)
4. `beadSpacing={isGrid ? 14 : 16}`, `dripCount={5 + (slopIndex % 5)}` (`/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx:95`)
5. At investigation start, there were no explicit `blur`, `threshold`, `displacementScale`, or `animateNoise` overrides (so defaults were inherited).

### SlopGoo defaults that cards inherit
`/Users/adam/code/slop.haus/apps/web/src/components/slop/SlopGoo.tsx:65`

Defaults:
1. `renderMode = "portal"` (`/Users/adam/code/slop.haus/apps/web/src/components/slop/SlopGoo.tsx:69`)
2. `blur = 8`, `threshold = 18` (`/Users/adam/code/slop.haus/apps/web/src/components/slop/SlopGoo.tsx:74`)
3. `displacementScale` fallback `6` (`/Users/adam/code/slop.haus/apps/web/src/components/slop/SlopGoo.tsx:334`)
4. `animateNoise = true` (`/Users/adam/code/slop.haus/apps/web/src/components/slop/SlopGoo.tsx:77`)
5. Filter stack includes `feTurbulence` + `feDisplacementMap` (`/Users/adam/code/slop.haus/apps/web/src/components/slop/SlopGoo.tsx:374`)

## Hypotheses (Initial Ranking)

| Initial Rank | Hypothesis | Why It Fits |
|---|---|---|
| 1 | Card goo inherits displacement/noise while intro disables both | Intro explicitly sets `displacementScale={0}` + `animateNoise={false}`, card goo keeps roughening effects on. |
| 2 | Portal render mode on cards is less visually stable than inline intro render mode | Intro is inline/local; cards are portaled to `document.body`, which can change compositing/raster behavior. |
| 3 | Card geometry params are more aggressive | Card goo uses tighter spacing + more drips + larger drop range, creating busier silhouettes. |
| 4 | Hover-only mount of card goo hurts perceived smoothness | Intro can remain visible and stable; card goo appears only during hover, so first frames may look rough. |
| 5 | Card seed variability creates rougher patterns than fixed intro seed | Intro is fixed at `42`; cards vary by `slopIndex`, so some seeds may look inherently noisier. |

## Re-review of Each Hypothesis

### 1) Displacement/noise differences (most likely)
Evidence:
1. Intro explicitly opts out of displacement and turbulence animation.
2. Card goo inherits default displacement/noise pipeline.
3. Displacement specifically perturbs edges and increases irregularity.

Re-review result: **High confidence primary cause.**

### 2) Inline vs portal render mode
Evidence:
1. Intro `renderMode="inline"`; cards default to portal.
2. Portal path positions in a separate top-level layer (`createPortal` to `document.body`), which can look different under GPU/compositing.

Re-review result: **Medium confidence co-factor.**

### 3) Geometry aggressiveness (drips/spacing/drop size)
Evidence:
1. Card goo has denser/larger drip behavior than intro.
2. Denser beads + more drips produce more high-frequency edge detail, perceived as less smooth.

Re-review result: **Medium confidence co-factor.**

### 4) Hover-only mount lifecycle
Evidence:
1. Card goo mounts on hover entry and unmounts on leave.
2. Intro goo can appear more continuously, avoiding repeated startup frames.

Counterpoint:
1. If roughness remains after stabilization, lifecycle alone cannot explain all differences.

Re-review result: **Low-Medium confidence amplifier.**

### 5) Seed variability
Evidence:
1. Card goo seeds vary by card.
2. Some seeds can generate less aesthetically smooth distributions.

Counterpoint:
1. This is likely secondary unless roughness is highly card-specific.

Re-review result: **Low confidence tertiary factor.**

## Final Ranked Hypotheses

| Final Rank | Hypothesis | Confidence |
|---|---|---|
| 1 | Card goo roughening defaults (`displacementScale=6`, `animateNoise=true`) vs intro smooth profile (`0`/`false`) | High |
| 2 | Portal compositing path (cards) vs inline compositing path (intro) | Medium |
| 3 | More aggressive card goo geometry (drips/spacing/drop size) | Medium |
| 4 | Hover mount/unmount lifecycle impacts perceived smoothness | Low-Medium |
| 5 | Seed-driven per-card variation | Low |

## Validation Sequence

1. In DevTools, disable card goo `feDisplacementMap` on a hovered card and compare smoothness immediately.
2. In DevTools, disable the `feTurbulence` animation node and compare edge stability.
3. In DevTools, reduce card goo drip circles visibility (temporary node disable) to test geometry contribution.
4. Compare multiple cards to see whether roughness is consistent (supports config cause) or seed-specific (supports seed hypothesis).

## Current State (Post-fix)
`/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx`

Card goo now explicitly sets:
1. `displacementScale={0}`
2. `animateNoise={false}`

## Experiment Result: Hypothesis 1

Implemented test change:
1. In `/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx`, set card goo props to:
   - `displacementScale={0}`
   - `animateNoise={false}`

Outcome:
1. Visual result improved immediately; project-card goo now appears noticeably smoother and closer to intro goo.
2. Hypothesis #1 is validated as the primary driver.
3. Follow-up checks:
   - `pnpm -F @slop/web exec tsc --noEmit` passed.
   - Manual visual confirmation passed.

## Final Conclusion (Post-implementation)
The main smoothness gap came from card goo inheriting roughening defaults (`displacementScale=6`, `animateNoise=true`) while intro goo used a static/light profile. Secondary hypotheses (render mode, geometry intensity, lifecycle, seed variance) may still affect style nuance, but they are no longer required to explain the core issue.
