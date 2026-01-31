# Phase 2 - SlopGoo Component

## Status
Complete

## Goal
Implement a generic `SlopGoo` component that renders goo in screen space, attaches to the downmost edge, and animates slow drips.

## Tasks
- Create `SlopGoo` component with `targetRef` and config props.
- Measure geometry on mount and when transforms change:
  - `ResizeObserver` for size changes.
  - `MutationObserver` for class/style changes.
  - `scroll` + `resize` listeners, batched with `requestAnimationFrame`.
- Use a portal to render a `position: fixed` overlay in `document.body`.
- Generate beads/pool blobs/drips using seeded RNG.
- Add SVG filter (blur + alpha threshold + optional turbulence).
- Add CSS keyframes for slow falling drips.
- Ensure the overlay is tight around the goo bounds to keep perf acceptable.

## Files to Change (tentative)
- `apps/web/src/components/slop/SlopGoo.tsx`
- `apps/web/src/app/globals.css` (or existing slop-related styles file)
- `apps/web/src/lib/slop/geometry.ts` (import utilities)
- `apps/web/src/lib/slop/random.ts` (import utilities)

## Code Snippets (draft)
```tsx
export function SlopGoo({ targetRef, enabled = true, ...rest }: SlopGooProps) {
  // useLayoutEffect -> measure geometry
  // useEffect -> seed RNG to avoid SSR mismatch
  // createPortal -> fixed overlay SVG
}
```

```css
@keyframes slopFall {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  75% { transform: translateY(var(--fall)) scale(1); opacity: 1; }
  100% { transform: translateY(var(--fall)) scale(0.25); opacity: 0; }
}

.slop-drop {
  animation-name: slopFall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
```

## Verification Checklist
- Drips stay vertical while the target rotates.
- Goo stays attached to the lowest-facing edge after scroll/resize.
- Multiple `SlopGoo` instances do not conflict (unique filter IDs).
- Overlay does not intercept pointer events.
- Default color maps to a semantic token or CSS variable.
