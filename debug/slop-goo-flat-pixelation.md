# Debug: SlopGoo Flat-Band Pixelation

**Status:** Draft  
**Date:** 2026-02-06

## Problem
The goo effect looks smooth on obvious drip/blob circles, but the flatter bridge regions (especially when a new drip starts to form) show rough, pixelated-looking edges.  
Goal: identify likely causes before changing rendering code.

## Current Implementation Review

### Where the effect is built
- `apps/web/src/components/slop/SlopGoo.tsx`

### Filter pipeline (current)
1. `feGaussianBlur` (`stdDeviation={blur}`, default `8`)
2. `feColorMatrix` threshold-style alpha remap (`alpha' = alpha * threshold - 7`, default `threshold=18`)
3. `feTurbulence` animated noise
4. `feDisplacementMap` on the thresholded goo (`scale=6` unless reduced motion)

### Shape inputs (current)
- A baseline `line` plus:
- bead circles along edge,
- pool circles near edge,
- animated drip circles.

### Edge masking (current)
- A linear-gradient SVG mask aligned to edge normal.
- `edgeFeather` is set to `1` at active call sites:
  - `apps/web/src/components/project/ProjectCard.tsx`
  - `apps/web/src/app/page.tsx`

## Symptom Mapping
- Smooth drip blobs suggest circle geometry and blur are generally fine.
- Artifacts are strongest on flatter connecting regions, which are dominated by:
  - thin/flat alpha ramps after blur,
  - aggressive thresholding,
  - displacement of already-thresholded edges,
  - very narrow feathered mask transition.

## Hypotheses
1. **Threshold is too aggressive for flat connectors**
   - `threshold=18` with offset `-7` creates a steep cutoff. Flat/low-curvature regions have less alpha headroom, so they quantize into stair-stepped edges faster than large blobs.

2. **Displacement happens after thresholding**
   - The displacement map warps a high-contrast silhouette (`goo`) instead of a softer pre-threshold field, which can produce jagged edges in flat zones.

3. **Mask feather is too narrow (`edgeFeather=1`)**
   - The mask transition is only a couple of pixels wide, so minor noise/displacement can read as rough edge breakup near the baseline.

4. **Bridge geometry is undersampled between blobs**
   - Inter-blob spans can become thin when jitter + bead spacing + radius variance align, making those regions more sensitive to threshold/displacement aliasing.

5. **Filter rasterization/resolution may be limiting**
   - Filter region is large (`-50%` to `200%`) but no explicit filter resolution is set; in some sizes/zooms this can make filtered edges look coarse compared with raw circles.

## Validation Plan (No Code Changes Yet)
1. In DevTools, inspect `feDisplacementMap` output by temporarily setting `scale=0`; verify whether flat-band roughness largely disappears.
2. Compare visual output at lower threshold values (e.g., 12-15) while keeping other params fixed.
3. Compare `edgeFeather=1` vs `edgeFeather=3-4` to see if baseline roughness is mostly mask-transition aliasing.
4. Reduce bead spacing / increase minimum bead radius in a temporary local override to test bridge-thickness sensitivity.
5. Test at browser zoom levels (100%, 125%, 150%) to confirm whether artifact severity tracks rasterization scale.

## Notes
- This document captures hypotheses plus isolated experiment attempts as they are made.

## Attempt 1 (Hypothesis 1)
**Date:** 2026-02-05  
**Change:** Lowered default `threshold` in `SlopGoo` from `18` to `15`.  
**File:** `apps/web/src/components/slop/SlopGoo.tsx`  
**Scope:** No other filter, mask, or geometry changes.  
**Result:** No meaningful visual improvement in the flat-band roughness. Reverted.

## Attempt 2 (Hypothesis 2)
**Date:** 2026-02-05  
**Change:** Reordered filter pipeline so displacement is applied to blurred input before thresholding:
- `blur -> displacement -> threshold`
instead of:
- `blur -> threshold -> displacement`
**File:** `apps/web/src/components/slop/SlopGoo.tsx`  
**Scope:** Threshold default left at baseline (`18`); no geometry/mask parameter changes.  
**Result:** No meaningful visual improvement in the flat-band roughness. Reverted.

## Attempt 3 (Hypothesis 3)
**Date:** 2026-02-05  
**Change:** Increased `edgeFeather` at active call sites from `1` to `4`.  
**Files:**
- `apps/web/src/components/project/ProjectCard.tsx`
- `apps/web/src/app/page.tsx`  
**Scope:** Filter order and threshold kept at baseline; only mask feather width changed.  
**Result:** No meaningful visual improvement in the flat-band roughness. Reverted.

## Attempt 4 (Hypothesis 4)
**Date:** 2026-02-05  
**Change:** Densified/interpolated bead bridge geometry in `SlopGoo`:
- effective bead spacing reduced (`beadSpacing * 0.75`)
- bead count uses `ceil(...)` instead of `floor(...)`
- jitter amplitude reduced for bead center positions
- non-end bead minimum radius increased
**File:** `apps/web/src/components/slop/SlopGoo.tsx`  
**Scope:** Filter pipeline, threshold, and edge feathering kept at baseline.  
**Result:** No meaningful visual improvement in the flat-band roughness. Reverted.

## Updated Analysis (2026-02-06)
What we are seeing is a common SVG goo-filter gotcha: blobs start as clean vector geometry, but once they pass through the SVG filter chain they become a rasterized offscreen bitmap. We then apply high-contrast operations (alpha thresholding) and resampling (displacement) to that bitmap.

That combination makes long, thin, mostly straight regions (the flat connective goo between blobs) show stair-stepping/jaggies, especially when the baseline is diagonal due to tilt.

### Why flat areas look pixelated while blobs still look good

#### 1) Filters rasterize; the goo edge becomes a hard bitmap edge
- `feGaussianBlur` creates a smooth alpha ramp.
- `feColorMatrix` with `0 0 0 ${threshold} -7` makes the alpha transition extremely steep (threshold-like).
- A steep threshold makes the final edge crisp with only a tiny partial-alpha transition band.

On large round blobs there are enough pixels across the contour that this still reads smooth. On long, flatter connective areas, the transition may only be around 1-3 pixels; when diagonal, staircase artifacts are obvious.

#### 2) Tilt inflates the axis-aligned bounding box, and the filter region doubles it
When the baseline is diagonal, its axis-aligned bounding box (AABB) is larger than a horizontal equivalent. Our current filter region is:

```svg
<filter x="-50%" y="-50%" width="200%" height="200%">
```

That doubles an already inflated AABB. Browsers use internal caps/heuristics for filter buffers. Large filter regions may be rendered at lower effective resolution and scaled up, which presents as pixelation in flatter areas. This also explains stronger artifacts when tilted.

#### 3) Displacement after threshold warps a hard edge
Current order:
1. blur
2. threshold
3. turbulence
4. displacement

Displacement is a resampling step. Resampling a high-frequency hard edge makes artifacts easier to see, especially on thin, near-straight regions.

### Recommended fix order

#### Fix 1: Tight filter region with `userSpaceOnUse`
Replace the giant percentage region with a tight region in viewport space. We already pad the SVG viewport via `margin`; filter padding should be minimal/safe, not 2x expansion.

```tsx
const disp = prefersReducedMotion ? 0 : 6;
const pad = Math.ceil(blur * 3 + disp + 8);

<filter
  id={filterId}
  filterUnits="userSpaceOnUse"
  x={-pad}
  y={-pad}
  width={width + pad * 2}
  height={height + pad * 2}
>
  ...
</filter>
```

#### Fix 2: Set `filterRes` using DPR (quality-first option)
Force higher filter raster resolution (with perf tradeoff):

```tsx
const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
const fxW = Math.ceil((width + pad * 2) * dpr);
const fxH = Math.ceil((height + pad * 2) * dpr);

<filter
  ...
  filterRes={`${fxW} ${fxH}`}
>
```

#### Fix 3: Displace before threshold
Preferred order:
1. blur
2. displace
3. threshold
4. optional tiny post-blur

```svg
<feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />

<feTurbulence
  type="fractalNoise"
  baseFrequency="0.012"
  numOctaves="2"
  seed={seedValue % 997}
  result="noise"
>
  {!prefersReducedMotion && (
    <animate attributeName="baseFrequency" dur="90s" values="0.010;0.014;0.010" repeatCount="indefinite" />
  )}
</feTurbulence>

<feDisplacementMap
  in="blur"
  in2="noise"
  scale={prefersReducedMotion ? 0 : 6}
  xChannelSelector="R"
  yChannelSelector="G"
  result="warped"
/>

<feColorMatrix
  in="warped"
  mode="matrix"
  values={`
    1 0 0 0 0
    0 1 0 0 0
    0 0 1 0 0
    0 0 0 ${threshold} -7
  `}
  result="goo"
/>

<feGaussianBlur in="goo" stdDeviation="0.6" result="out" />
```

#### Fix 4: Soften threshold ramp
Two knobs:
- Lower `threshold` (e.g., 12-15).
- Recompute matrix bias instead of pinning `-7` when `threshold` changes.

To preserve existing cutoff behavior:
- current cutoff is approximately `7/18 ~= 0.3889`
- use `alphaBias = -threshold * cutoff`

```tsx
const cutoff = 7 / 18;
const alphaBias = -threshold * cutoff;
```

```tsx
values={`
  1 0 0 0 0
  0 1 0 0 0
  0 0 1 0 0
  0 0 0 ${threshold} ${alphaBias}
`}
```

#### Fix 5: Optional visual masking
If minor jaggies remain and we want a low-cost visual hide:
- tiny final blur (`0.4-0.8`)
- subtle grain/noise overlay to mask banding/jagged edges

### Quick root-cause confirmation toggles
1. Disable displacement (`scale=0`): if artifacts drop, displacement resampling is significant.
2. Remove color matrix temporarily: if artifacts disappear, threshold steepness is primary.
3. Tighten filter region (`userSpaceOnUse`): if tilted cases clean up, filter buffer downsampling was involved.

### Practical recommended combo
1. Fix 1 (tight `userSpaceOnUse` filter region)
2. Fix 3 (displace before threshold)
3. Optional tiny post-blur (`0.5-0.7`)

This is expected to preserve blob quality while reducing jaggies on flatter connective sections.

## Attempt 5 (Fix 1)
**Date:** 2026-02-06  
**Change:** Replaced oversized percentage filter region with tight viewport-space bounds using `filterUnits="userSpaceOnUse"` and computed `filterPad`.
**File:** `apps/web/src/components/slop/SlopGoo.tsx`  
**Scope:** Kept filter stage order and threshold behavior unchanged; only filter region sizing changed.
**Result:** Visible improvement in jagged flat-band areas. Kept.

## Attempt 6 (Fix 2)
**Date:** 2026-02-06  
**Change:** Added DPR-aware `filterRes` on the SVG filter with a conservative total-pixel cap (`maxFilterPixels = 3_000_000`) to improve raster quality without unbounded cost.
**File:** `apps/web/src/components/slop/SlopGoo.tsx`  
**Scope:** Kept filter stage order, threshold behavior, and tight `userSpaceOnUse` bounds from Attempt 5.
**Result:** No meaningful visual improvement. Reverted.

## Attempt 7 (Fix 3)
**Date:** 2026-02-06  
**Change:** Reordered filter stages to displace before threshold:
- `blur -> turbulence -> displacement -> threshold`
instead of:
- `blur -> threshold -> turbulence -> displacement`
**File:** `apps/web/src/components/slop/SlopGoo.tsx`  
**Scope:** Kept tight `userSpaceOnUse` filter bounds from Attempt 5; did not add optional post-threshold micro-blur yet.
**Result:** No meaningful visual improvement. Reverted.

## Attempt 8 (Post-Threshold Micro-Blur)
**Date:** 2026-02-06  
**Change:** Added a tiny final blur stage after displacement:
- `feGaussianBlur in="warped" stdDeviation="0.6"`
**File:** `apps/web/src/components/slop/SlopGoo.tsx`  
**Scope:** Kept filter stage order (baseline), threshold behavior, and tight `userSpaceOnUse` bounds from Attempt 5.
**Result:** Initially looked smoother, but this masked the underlying artifact and softened blob definition too much. Reverted.

## Attempt 9 (Post-Threshold Micro-Blur Tune)
**Date:** 2026-02-06  
**Change:** Increased post-threshold blur from `stdDeviation="0.6"` to `stdDeviation="0.8"`.
**File:** `apps/web/src/components/slop/SlopGoo.tsx`  
**Scope:** Same filter chain and bounds as Attempt 8; only micro-blur strength changed.
**Result:** Further degraded overall goo/blob quality. Reverted.

## Current Kept Changes
- Attempt 5 only: tight filter region with `filterUnits="userSpaceOnUse"` and computed `filterPad`.

## External Review Follow-up (2026-02-06)
The latest external review suggests the remaining jaggies are likely driven by final compositing/resampling and alpha-transfer behavior, not just filter-region sizing.

### Highest-probability remaining causes
1. Final compositor resample from subpixel placement (`left/top/width/height` not device-pixel aligned).
2. Threshold steepness and cutoff are coupled (`alpha' = alpha * threshold - 7`), so prior threshold tests likely changed shape and smoothness at the same time.
3. Drip-neck/bridge regions are worst-case geometry for aliasing (thin, diagonal, near-straight contours during emergence).

### Additional approaches to test (from external review)
1. Device-pixel snap overlay bounds during measurement.
2. Decouple threshold cutoff from slope (bias computed from fixed cutoff ratio).
3. Replace hard alpha remap with `feComponentTransfer` alpha S-curve.
4. Add tiny high-frequency micro-displacement pass (not blur) for anti-stair-step breakup.
5. Two-pass render (soft low-opacity underlay + crisp overlay).
6. Geometry-side drip-neck support (short stem/capsule near emergence).

## Attempt 10 (Device-Pixel Snap)
**Date:** 2026-02-06  
**Change:** Snapped measured overlay bounds to device-pixel increments:
- floor origin (`left/top`) to DPR grid
- ceil extents (`right/bottom`) to DPR grid
- derive `width/height` from snapped bounds
**File:** `apps/web/src/components/slop/SlopGoo.tsx`  
**Scope:** Kept filter pipeline and threshold behavior unchanged; retained Attempt 5 filter-region fix.
**Result:** No meaningful visual improvement. Reverted.

## Attempt 11 (Cutoff/Slope Decoupling)
**Date:** 2026-02-06  
**Change:** Decoupled threshold cutoff from slope in alpha remap:
- keep cutoff constant at `7/18`
- compute bias as `-threshold * (7/18)` instead of fixed `-7`
- set test slope (`threshold`) to `12` (was `18`) to widen transition band without moving cutoff
**File:** `apps/web/src/components/slop/SlopGoo.tsx`  
**Scope:** Kept filter pipeline and Attempt 5 filter-region fix; reverted device-pixel snap from Attempt 10.
**Result:** No meaningful visual improvement. Reverted.

## Attempt 12 (Alpha S-Curve via feComponentTransfer)
**Date:** 2026-02-06  
**Change:** Replaced hard alpha `feColorMatrix` threshold remap with `feComponentTransfer` alpha table curve (pseudo-smoothstep) while keeping RGB identity.
**File:** `apps/web/src/components/slop/SlopGoo.tsx`  
**Scope:** Kept filter stage order and Attempt 5 filter-region fix; reverted Attempt 11 math changes.
**Result:** Looked worse overall. Reverted.

## External Review Follow-up #2 (2026-02-06)
New signal: the artifact looking similar across 100%/125%/150% zoom suggests screen-pixel/fractional-placement resampling is likely not the primary cause. Most likely remaining issue is intrinsic filter aliasing at thin diagonal neck/bridge regions near cutoff boundaries.

### Recommended next approaches
1. **Edge-band-only blur (not whole-shape blur)**
   - Build hard and soft silhouettes from the same warped field.
   - Compute `edgeBand = soft OUT hard`.
   - Apply tiny blur only to `edgeBand`, then merge back over hard silhouette.
   - Goal: smooth jaggies while preserving crisp blob interiors.

2. **Revisit threshold with fixed cutoff**
   - If slope changes are tested, always maintain cutoff (`bias = -slope * cutoff`) so only edge steepness changes.
   - Useful especially for the soft silhouette in the edge-band method.

3. **Micro high-frequency edge breakup displacement**
   - Keep existing low-frequency displacement pass.
   - Add a second tiny displacement pass with higher frequency and low scale to break staircase perception without mush.

4. **Two-pass render (soft underlay + crisp overlay)**
   - Draw goo twice with different filters/opacities.
   - Keep crisp primary silhouette while a faint underlayer hides jagged transitions.

5. **Geometry assist during drip emergence**
   - Add a short temporary stem/capsule where drips begin.
   - Avoid razor-thin necks that are most sensitive to threshold toggling.

### Practical next-test order
1. Edge-band-only blur inside filter chain.
2. Soft-slope-with-fixed-cutoff tuning within that edge-band path.
3. Micro high-frequency displacement pass if jaggy lines remain.

## Attempt 13 (Edge-Band-Only Blur)
**Date:** 2026-02-06  
**Change:** Implemented hard+soft silhouette pipeline from the same displaced field, then blurred only `soft OUT hard` edge band and merged back:
- `warpedField -> hard (slope=threshold, bias=-7)`
- `warpedField -> soft (slope=10, bias=-10 * cutoff)`
- `edgeBand = soft OUT hard`
- blur `edgeBand` (`stdDeviation=0.35`)
- attenuate edge alpha (`0.35`) and merge with `hard`
**File:** `apps/web/src/components/slop/SlopGoo.tsx`  
**Scope:** Kept Attempt 5 tight `userSpaceOnUse` filter bounds; replaced single-threshold output path with edge-band merge.
**Result:** Improvement was insufficient; rough edges still visible in flat/neck regions. Kept for parameter tuning.

## Attempt 14 (Edge-Band Parameter Tune A)
**Date:** 2026-02-06  
**Change:** Tuned edge-band smoothing/weight:
- `softSlope: 10 -> 8` (wider soft band)
- `edgeBandBlur: 0.35 -> 0.45`
- `edgeBandAlpha: 0.35 -> 0.42`
**File:** `apps/web/src/components/slop/SlopGoo.tsx`  
**Scope:** Same edge-band-only pipeline from Attempt 13; only parameter tuning.
**Result:** No meaningful visual improvement. Reverted.

## Attempt 15 (Micro High-Frequency Edge Displacement)
**Date:** 2026-02-06  
**Change:** Added a second displacement pass for subtle high-frequency edge breakup:
- restore Attempt 13 tuning baseline (`softSlope=10`, `edgeBandBlur=0.35`, `edgeBandAlpha=0.35`)
- add `microNoise` turbulence (`baseFrequency=0.18`, `numOctaves=1`)
- apply low-scale displacement on `warpedField` (`scale=0.9`) before hard/soft threshold branches
**File:** `apps/web/src/components/slop/SlopGoo.tsx`  
**Scope:** Keeps Attempt 5 bounds and Attempt 13 edge-band pipeline; only adds micro edge-breakup pass and reverts Attempt 14 tuning.
**Result:** No meaningful visual improvement. Reverted.

## Attempt 16 (Two-Pass Soft Underlay + Crisp Overlay)
**Date:** 2026-02-06  
**Change:** Replaced edge-band pipeline with a true two-pass render:
- `soft` filter: displaced field + softer threshold (`slope=10`, fixed-cutoff bias)
- `hard` filter: displaced field + original hard threshold (`slope=threshold`, bias `-7`)
- render same goo geometry twice (soft underlay at low opacity, then hard overlay)
**File:** `apps/web/src/components/slop/SlopGoo.tsx`  
**Scope:** Keeps Attempt 5 tight filter bounds; reverts Attempt 15 micro-displacement and Attempt 13 edge-band merge.
**Result:** No meaningful visual improvement. Reverted.

## Attempt 17 (Geometry Assist: Drip Emergence Stem)
**Date:** 2026-02-06  
**Change:** Added a short static stem/capsule geometry at each drip root to avoid razor-thin emergence necks:
- for each drip, render a short rounded `line` from baseline toward drip center
- stem width scales with drip radius (`max(d.r * 1.6, thickness * 0.55)`)
- existing animated drip circles are kept unchanged
**File:** `apps/web/src/components/slop/SlopGoo.tsx`  
**Scope:** Keeps Attempt 5 filter bounds and baseline single-filter chain; no additional filter stages added.
**Result:** No meaningful visual improvement. Reverted.
