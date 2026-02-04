# Slop Drip Blobs (Card Bottom)

**Status:** Deprecated (reverted to SVG mask)  
**Date:** 2026-01-30

## Goal
Replace the current drip mask approach with **absolute‑positioned drip blobs** that appear along the bottom edge of each project card. The blobs should feel intentional and react to the card’s tilt: left‑tilted cards get drips near the left edge, right‑tilted cards get drips near the right edge, and neutral cards get centered drips.

The implementation should be **simple to understand** and **easy to apply/remove/toggle** across the UI.

## Why This Direction
- Mask‑based drips proved hard to control and debug (left‑anchored artifacts, no visible offset).  
- Blob elements are explicit DOM nodes with clear positioning and styles.  
- Blob logic can be deterministic (seeded) and easy to turn off with Slop Mode.

## Visual Reference (SVG Mask Baseline)
The original SVG‑mask approach produced a **continuous bottom lip** with **varied drip lengths** across the width. The current blob output reads as **isolated dots/ovals** and does not match the “goo edge” look. The blob system must therefore emulate:
- A **connected lip** along the host edge (not just detached blobs).
- **Drip length variation** (some short, some longer “teardrops”).
- A silhouette that reads as a **single goo edge**, not polka dots.

## Design Principles
- **No layout impact:** drips should be absolutely positioned and not affect layout flow.
- **Stable randomness:** deterministic per card (seeded from project ID/slug).
- **Slop Mode gated:** easy to toggle on/off.
- **Minimal moving parts:** small helper + a couple utility classes.
- **Gravity-correct:** drips hang vertical relative to the viewport, even if the host edge is rotated.

## Scope (v1)
- Apply only on the main feed page (`/`) project cards.
- Treat other pages as future expansion once the feel is right.

## Proposed Behavior

### Placement Logic
- Determine tilt direction from the existing `slopIndex` / rotation bucket.
- Map tilt direction → blob anchor zone:
  - **Left tilt** → blobs near left third
  - **Right tilt** → blobs near right third
  - **Neutral** → blobs near center
- Add slight random offset inside the zone (seeded).

### Component Interface (Prop-Level Requirements)
The blob should be **modular and placement-agnostic** so it can be reused across components with minimal coupling to the host layout. The interface should support:

- **Placement modes** (no layout assumptions):
  - `full` (span the full width)
  - `edge` (left or right end)
  - `center` (middle cluster)
  - `custom` (explicit offset or range)
- **Edge silhouette**:
  - A **lip** segment (continuous edge) + **drip set** (hanging shapes).
  - `variant` or preset to toggle lip-only, drips-only, or lip+drips.
- **Gravity alignment**:
  - Drips remain **perfectly vertical** relative to the viewport even if the host element is rotated.
  - A **rotation angle** input (e.g., `hostAngle`) should allow the blob to counter-rotate.
- **Sizing controls**:
  - Blob count range (e.g., 2–4), size range, and drip depth.
  - A single prop or preset to keep the API simple.
- **Color control**:
  - Default to slop green, but allow override.

### Visual Style
- 2–4 blobs per card (low density).
- Blobs are **rounded droplet shapes** (ellipse + teardrop variant).
- Color defaults to **slop green** (same as logo), but allow override.
- Optional subtle shadow for depth.

## Proposed API (Simple + Reusable)

### Utility class
```css
.slop-blob {
  position: absolute;
  bottom: -10px;
  width: var(--blob-w, 18px);
  height: var(--blob-h, 14px);
  background: var(--slop-green);
  border-radius: 999px 999px 999px 999px;
  pointer-events: none;
}
```

### React helper (example)
```tsx
function SlopBlobs({
  seed,
  placement = "center",
  hostAngle = 0,
}: {
  seed: number;
  placement?: "full" | "edge-left" | "edge-right" | "center" | "custom";
  hostAngle?: number; // degrees
}) {
  const blobs = makeBlobLayout(seed, placement);
  return (
    <div className="absolute left-0 right-0 bottom-0 pointer-events-none">
      {blobs.map((b) => (
        <span
          key={b.id}
          className="slop-blob"
          style={{
            left: b.left,
            width: b.w,
            height: b.h,
            transform: `translateY(${b.yOffset || 0}px) rotate(${hostAngle * -1}deg)`,
          }}
        />
      ))}
    </div>
  );
}
```

### Placement function (pseudo)
```ts
function makeBlobLayout(seed, placement) {
  const rand = mulberry32(seed);
  const zone = placement === "edge-left" ? [5, 35] : placement === "edge-right" ? [65, 95] : [35, 65];
  const count = 2 + Math.floor(rand() * 3); // 2–4

  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: `${zone[0] + rand() * (zone[1] - zone[0])}%`,
    w: `${12 + rand() * 12}px`,
    h: `${10 + rand() * 10}px`,
  }));
}
```

## Integration Plan (When Implementing)
- Add `SlopBlobs` into `ProjectCard` only (initial scope).  
- Compute **direction** from the same index/rotation logic already used.  
- Gate render with `sloppy` / Slop Mode.

## Future Extensibility
- Add a `data-slop-blobs` attribute or class to enable on other components (hero cards, banners).
- Allow `--slop-blob-color` override per surface.
- Support “gooey” variant by adding a blur + drop‑shadow.

## Open Questions
- How should `custom` placement be expressed (explicit % offset vs range)?
- Should `full` placement span the entire width or use multiple zones?
- Is the lip always required, or should it be optional per component?
