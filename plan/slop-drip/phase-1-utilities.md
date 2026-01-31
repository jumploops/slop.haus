# Phase 1 - Utilities (Geometry + RNG)

## Status
Complete

## Goal
Provide reusable utilities to compute the target element’s downmost edge in viewport coordinates and to generate stable per-mount randomness.

## Tasks
- Add a small geometry module that:
  - Gets transformed corner points (prefer `getBoxQuads`, fallback to transform matrix + rect).
  - Sorts points CCW and selects the downmost edge by average Y.
  - Returns edge endpoints, edge direction, inward normal, and length.
- Add a deterministic RNG helper (e.g., `mulberry32(seed)`).
- Define shared types: `Point`, `Edge`, `Attach` helpers.

## Files to Change (tentative)
- `apps/web/src/lib/slop/geometry.ts`
- `apps/web/src/lib/slop/random.ts`
- `apps/web/src/lib/slop/types.ts`

## Code Snippets (draft)
```ts
export type Point = { x: number; y: number };

export type Edge = {
  a: Point;
  b: Point;
  eDir: Point; // unit direction from a -> b
  nIn: Point;  // inward normal
  length: number;
};

export function pickDownmostEdge(pointsCCW: Point[]): Edge { /* ... */ }
```

## Verification Checklist
- `getBoxQuads` path returns four points in viewport coordinates.
- Fallback path respects simple rotate transforms.
- Downmost edge selection is stable across rotations.
- Utilities are side-effect free and unit-testable.
