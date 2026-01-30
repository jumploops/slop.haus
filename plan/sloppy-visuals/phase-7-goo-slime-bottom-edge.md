# Phase 7 — Goo/Slime Bottom Edge

**Status:** Draft  
**Goal:** Add a “drippy paint / slime” bottom edge treatment using procedural SVG masks, without clipping content.

## Concept Summary
The effect is composed of two layers:
1. **Silhouette geometry** (rounded drips hanging off the bottom edge).
2. **Surface texture** (subtle wet edge grain/shine).

To keep layout stable and readable:
- Apply the mask to a **pseudo-element that sits below** the component.
- Keep component content unmasked.
- Generate the mask with **stable, seeded randomness**.

## Primary Targets (initial)
- Feed intro card (hero-ish surface)
- Large card surfaces (project detail hero or card containers)

## Proposed Implementation

### 1) CSS: Drips via mask on a pseudo-element
```css
.slop {
  position: relative;
  overflow: visible;
}

.slop::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: var(--slop-depth, 28px);
  background: inherit;
  pointer-events: none;

  -webkit-mask-image: var(--slop-mask);
  mask-image: var(--slop-mask);
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;

  filter: drop-shadow(0 2px 0 rgba(0,0,0,0.08));
}

@supports not (mask-image: url("")) {
  .slop::after { display: none; }
}
```

### 2) JS: Generate a drip mask (seeded SVG)
```ts
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function svgToDataUrl(svg: string) {
  const encoded = btoa(unescape(encodeURIComponent(svg)));
  return `url("data:image/svg+xml;base64,${encoded}")`;
}

function makeDripMask({
  seed,
  dripCount = 8,
  baseline = 0.28,
  maxExtra = 0.68,
  roughness = 0.06,
  samples = 120,
} = {}) {
  const rand = mulberry32(seed ?? 1);
  const W = samples;
  const H = 100;
  const base = baseline * H;
  const depth = new Array(W + 1).fill(base);

  for (let i = 0; i < dripCount; i++) {
    const center = rand() * W;
    const width = 6 + rand() * 22;
    const len = (maxExtra * H) * (0.35 + rand());

    const x0 = Math.max(0, center - width / 2);
    const x1 = Math.min(W, center + width / 2);
    const span = Math.max(1e-6, x1 - x0);

    for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
      const t = (x - x0) / span;
      const bump = Math.sin(Math.PI * t);
      depth[x] = Math.min(H, Math.max(depth[x], base + len * bump));
    }
  }

  for (let x = 0; x <= W; x++) {
    const jitter = (rand() * 2 - 1) * roughness * H;
    depth[x] = Math.max(0, Math.min(H, depth[x] + jitter));
  }

  const sx = (x: number) => (x / W) * 100;
  let d = `M 0 0 L 100 0 L 100 ${depth[W].toFixed(2)} `;
  for (let x = W - 1; x >= 0; x--) {
    d += `L ${sx(x).toFixed(2)} ${depth[x].toFixed(2)} `;
  }
  d += "Z";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
  <path d="${d}" fill="white"/>
</svg>`.trim();

  return svgToDataUrl(svg);
}
```

### 3) React/Next: Stable, client‑only seed
```tsx
import { useEffect, useRef } from "react";

export function SlopDripWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    el.style.setProperty("--slop-mask", makeDripMask({ seed, dripCount: 9 }));
    el.style.setProperty("--slop-depth", "30px");
  }, []);

  return (
    <div ref={ref} className="slop" data-slop>
      {children}
    </div>
  );
}
```

## Optional: “Wet” Surface Texture
Add a subtle overlay using a turbulence texture on a pseudo-element.

```css
.slop::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.12;
  mix-blend-mode: multiply;
  background-image: var(--slop-grain);
  background-size: 180px 180px;
}
```

## Tuning Knobs
- `baseline`: 0.22–0.35 (thicker lip)
- `dripCount`: 6–12 (chaos level)
- `maxExtra`: 0.5–0.85 (drip length)
- `roughness`: 0.03–0.09 (edge variation)
- `--slop-depth`: 18px (buttons) to 32–48px (hero)

## Files to Change (When Implementing)
- `apps/web/src/app/globals.css` (utility classes, mask support)
- New helper: `apps/web/src/lib/slop-drip.ts` (mask generator)
- Component targets (feed intro, detail hero)

## Risks / Considerations
- **SSR mismatch**: generate masks client‑side only.
- **Performance**: keep mask count low; avoid regenerating frequently.
- **Accessibility**: maintain readable contrast; keep drips non‑interactive.

## Verification Checklist
- Drips render only when Slop Mode is on.
- No layout shift or clipped content.
- Works in Chrome/Safari; graceful fallback if mask unsupported.
