A solid way to get **“dripping paint / goo” that is (a) vector-ish/resizable, (b) randomized per render, (c) animatable very slowly, and (d) *gravity-aware* even when the target element is rotated** is to treat the drips as a *separate overlay* rendered in **screen space** (so gravity is always “down”), while computing the **attachment edge** from the element’s transformed geometry.

That one design choice solves your hardest requirement:

* The card can tilt/rotate however you want.
* The goo stays visually **attached to the card’s lowest-facing edge**.
* The drips still fall **straight down the screen**.

Below is a recommended implementation that’s flexible and looks good with minimal “physics”.

---

## The approach that fits your constraints

### 1) Render the slime in a portal overlay (not inside the transformed element)

If you draw the drips *inside* a rotated card, the drips rotate too (bad for “gravity”).
So instead:

* Put the goo in a `position: fixed` overlay (or a top-level absolute layer).
* Compute where the card’s “bottom edge” is *in viewport coordinates*.
* Draw the slime there.

### 2) Pick the “downmost” edge of the rotated rectangle

Get the element’s 4 corners in viewport space, then:

* Consider the 4 edges (p0–p1, p1–p2, p2–p3, p3–p0)
* Pick the edge with the largest **average Y** (lowest on screen)

That automatically handles “tilted left” cases: the “lowest” edge will be the one visually closest to the bottom of the screen, and you can bias goo toward the lower corner.

### 3) Draw goo using SVG “metaballs” + a goo filter

This is the classic “gooey” trick:

* Draw circles/ellipses (beads) along the attachment edge
* Spawn a few circles that slowly translate downward (drips)
* Apply an SVG filter: blur + alpha threshold → blobs merge/split like slime

It’s:

* **Resizable** (SVG)
* **Randomizable** (seed per mount)
* **Animatable** (CSS transforms)
* Looks “viscous” with long durations + subtle motion

### 4) Control knobs you asked for

You can expose options like:

* `attachStart` / `attachEnd` as **percent** along the edge
* Or `attachStartPx` / `attachLengthPx` as **pixels**
* `thickness` (how much it “grips” into the element)
* `maxDrop` (how far drips can fall)
* `poolBias` (how strongly it pools toward the lower corner)
* `viscositySeconds` (slower animation)

---

## A concrete React/TS implementation (gravity-aware, randomized, slow drips)

### CSS (global)

```css
@keyframes slopFall {
  0%   { transform: translateY(0px) scale(1); opacity: 1; }
  75%  { transform: translateY(var(--fall)) scale(1); opacity: 1; }
  100% { transform: translateY(var(--fall)) scale(0.25); opacity: 0; }
}

.slop-drop {
  transform-box: fill-box;
  transform-origin: center;
  animation-name: slopFall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
```

### Component

```tsx
import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Point = { x: number; y: number };

type AttachPercent = { mode?: "percent"; start: number; end: number };
type AttachPixels  = { mode: "pixels"; startPx: number; lengthPx: number };
type Attach = AttachPercent | AttachPixels;

type SlopGooProps = {
  targetRef: React.RefObject<HTMLElement>;

  // Where along the chosen bottom edge the goo attaches
  attach?: Attach;

  // Visual controls
  color?: string;
  thickness?: number;     // how wide the attachment "band" is
  maxDrop?: number;       // max fall distance for drips
  blur?: number;          // goo blur amount (bigger = gooier, heavier)
  threshold?: number;     // alpha threshold strength
  beadSpacing?: number;   // spacing of beads along edge
  dripCount?: number;     // number of simultaneous drips
  poolBias?: number;      // 0..1: bias slime to lower corner
  viscositySeconds?: number; // larger = slower drips

  zIndex?: number;
  enabled?: boolean;
};

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function lerpPt(a: Point, b: Point, t: number): Point { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }; }

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sortPointsCCW(points: Point[]): Point[] {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  return [...points].sort(
    (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx)
  );
}

// Prefer getBoxQuads when available (gives transformed corners accurately)
function getElementQuad(el: HTMLElement): Point[] {
  const anyEl = el as any;
  if (typeof anyEl.getBoxQuads === "function") {
    const quads = anyEl.getBoxQuads({ box: "border" });
    if (quads && quads.length) {
      const q = quads[0];
      const pts = [q.p1, q.p2, q.p3, q.p4].map((p: any) => ({ x: p.x, y: p.y }));
      return sortPointsCCW(pts);
    }
  }

  // Fallback: assumes a simple rotate around center (good for “slop mode” tilts)
  const rect = el.getBoundingClientRect();
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const tr = getComputedStyle(el).transform;
  let angle = 0;
  if (tr && tr !== "none") {
    const m = new DOMMatrixReadOnly(tr);
    angle = Math.atan2(m.b, m.a);
  }

  const hw = w / 2;
  const hh = h / 2;

  const local: Point[] = [
    { x: -hw, y: -hh },
    { x:  hw, y: -hh },
    { x:  hw, y:  hh },
    { x: -hw, y:  hh },
  ];

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const world = local.map(p => ({
    x: cx + p.x * cos - p.y * sin,
    y: cy + p.x * sin + p.y * cos,
  }));

  return sortPointsCCW(world);
}

function pickDownmostEdge(ptsCCW: Point[]) {
  // edges: (i -> i+1)
  let bestI = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < 4; i++) {
    const a = ptsCCW[i];
    const b = ptsCCW[(i + 1) % 4];
    const score = (a.y + b.y) / 2; // average Y
    if (score > bestScore) {
      bestScore = score;
      bestI = i;
    }
  }
  const a = ptsCCW[bestI];
  const b = ptsCCW[(bestI + 1) % 4];

  // In a CCW polygon, the inward normal is the “left normal” of edge (a->b)
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len = Math.hypot(vx, vy) || 1;
  const ex = vx / len;
  const ey = vy / len;
  const nIn = { x: -ey, y: ex }; // inward normal (unit)

  return { edgeA: a, edgeB: b, eDir: { x: ex, y: ey }, nIn, length: len };
}

export function SlopGoo({
  targetRef,
  attach = { start: 0, end: 1 },
  color = "#19c37d",
  thickness = 14,
  maxDrop = 90,
  blur = 8,
  threshold = 18,
  beadSpacing = 18,
  dripCount = 7,
  poolBias = 0.65,
  viscositySeconds = 55,
  zIndex = 9999,
  enabled = true,
}: SlopGooProps) {
  const [seed, setSeed] = useState<number>(0);
  const [geom, setGeom] = useState<null | {
    left: number; top: number; width: number; height: number;
    b0: Point; b1: Point; // baseline endpoints in overlay coords
    nIn: Point;           // inward normal in overlay coords
    segLen: number;
    lowEndIsB1: boolean;
  }>(null);

  const id = useId().replace(/:/g, "");
  const filterId = `slopGoo_${id}`;

  // Make it random per mount without SSR mismatch
  useEffect(() => {
    setSeed(Math.floor(Math.random() * 1_000_000_000));
  }, []);

  useLayoutEffect(() => {
    if (!enabled) return;
    const el = targetRef.current;
    if (!el) return;

    let raf = 0;

    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const quad = getElementQuad(el);
        const { edgeA, edgeB, eDir, nIn, length } = pickDownmostEdge(quad);

        if (length < 2) {
          setGeom(null);
          return;
        }

        // Convert attach options into t0..t1 along the chosen edge
        let t0 = 0, t1 = 1;
        if ((attach as AttachPixels).mode === "pixels") {
          const a = attach as AttachPixels;
          t0 = a.startPx / length;
          t1 = (a.startPx + a.lengthPx) / length;
        } else {
          const a = attach as AttachPercent;
          t0 = a.start;
          t1 = a.end;
        }
        t0 = clamp01(t0);
        t1 = clamp01(t1);
        if (t1 < t0) [t0, t1] = [t1, t0];

        const A0 = { x: edgeA.x + eDir.x * (t0 * length), y: edgeA.y + eDir.y * (t0 * length) };
        const A1 = { x: edgeA.x + eDir.x * (t1 * length), y: edgeA.y + eDir.y * (t1 * length) };

        // Slightly offset baseline into the element so it “grips” the border
        const grip = thickness * 0.35;
        const B0 = { x: A0.x + nIn.x * grip, y: A0.y + nIn.y * grip };
        const B1 = { x: A1.x + nIn.x * grip, y: A1.y + nIn.y * grip };

        const margin = Math.max(blur * 3, thickness * 2, 24);
        const minX = Math.min(B0.x, B1.x) - margin;
        const maxX = Math.max(B0.x, B1.x) + margin;
        const minY = Math.min(B0.y, B1.y) - margin;
        const maxY = Math.max(B0.y, B1.y) + maxDrop + margin;

        const left = minX;
        const top = minY;
        const width = Math.max(1, maxX - minX);
        const height = Math.max(1, maxY - minY);

        const b0 = { x: B0.x - left, y: B0.y - top };
        const b1 = { x: B1.x - left, y: B1.y - top };

        const segLen = Math.hypot(b1.x - b0.x, b1.y - b0.y) || 1;
        const lowEndIsB1 = B1.y > B0.y;

        setGeom({ left, top, width, height, b0, b1, nIn, segLen, lowEndIsB1 });
      });
    };

    // Observers to keep it attached during slop-mode transforms
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    const mo = new MutationObserver(measure);
    mo.observe(el, { attributes: true, attributeFilter: ["style", "class"] });

    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);

    measure();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [enabled, targetRef, attach, thickness, maxDrop, blur]);

  const shapes = useMemo(() => {
    if (!geom || !seed) return null;

    const rand = mulberry32(seed);

    // Helper to bias [0..1] toward 0 or 1 (pooling)
    const biasPow = lerp(1, 4, clamp01(poolBias)); // 1..4
    const biasToLowEnd = geom.lowEndIsB1;

    const biasedU = (u: number) => {
      if (biasToLowEnd) return 1 - Math.pow(1 - u, biasPow);
      return Math.pow(u, biasPow);
    };

    const beads: Array<{ t: number; r: number; j: number }> = [];
    const beadCount = Math.max(2, Math.floor(geom.segLen / beadSpacing));
    for (let i = 0; i <= beadCount; i++) {
      const u = i / beadCount;
      const t = clamp01(u + (rand() - 0.5) * (1 / beadCount) * 0.6);

      // Slightly larger beads near the low end to feel “pooled”
      const g = biasToLowEnd ? t : 1 - t;
      const r = thickness * (0.35 + rand() * 0.25 + g * 0.25);
      beads.push({ t, r, j: (rand() - 0.5) * thickness * 0.25 });
    }

    // A few extra “pool blobs” near the low corner
    const poolBlobs: Array<{ t: number; r: number; y: number }> = [];
    for (let k = 0; k < 3; k++) {
      const u = biasedU(rand()); // clustered near low end
      poolBlobs.push({
        t: u,
        r: thickness * (0.9 + rand() * 0.6),
        y: thickness * (0.25 + rand() * 0.35),
      });
    }

    const drips: Array<{
      t: number;
      r: number;
      fall: number;
      dur: number;
      delay: number;
    }> = [];

    for (let i = 0; i < dripCount; i++) {
      const u = biasedU(rand());
      const g = biasToLowEnd ? u : 1 - u;

      const r = thickness * (0.25 + rand() * 0.35 + g * 0.15);
      const fall = lerp(maxDrop * 0.35, maxDrop, rand()) * (0.75 + g * 0.35);

      // Viscosity = long durations, plus per-drip variance
      const dur = viscositySeconds * (0.65 + rand() * 0.8);
      const delay = -rand() * dur; // negative delay to desync immediately

      drips.push({ t: u, r, fall, dur, delay });
    }

    return { beads, poolBlobs, drips };
  }, [geom, seed, thickness, beadSpacing, dripCount, maxDrop, poolBias, viscositySeconds]);

  if (!enabled || !geom || !shapes) return null;

  const { left, top, width, height, b0, b1 } = geom;

  const dx = b1.x - b0.x;
  const dy = b1.y - b0.y;
  const segLen = Math.hypot(dx, dy) || 1;
  const ex = dx / segLen;
  const ey = dy / segLen;

  // Normal pointing “down” from the baseline (perp to edge, choose the one with positive Y)
  let nx = ey, ny = -ex;
  if (ny < 0) { nx = -nx; ny = -ny; }

  const baselineStroke = Math.max(1, thickness);

  const svg = (
    <div
      style={{
        position: "fixed",
        left,
        top,
        width,
        height,
        pointerEvents: "none",
        zIndex,
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              // threshold controls “how blobby” the merge is
              values={`
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 ${threshold} -7
              `}
              result="goo"
            />
            {/* Optional: tiny organic wobble in the edge, very slow */}
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed={seed % 997} result="noise">
              <animate attributeName="baseFrequency" dur="90s" values="0.010;0.014;0.010" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="goo" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        <g filter={`url(#${filterId})`}>
          {/* Baseline “band” attached to the edge */}
          <line
            x1={b0.x} y1={b0.y}
            x2={b1.x} y2={b1.y}
            stroke={color}
            strokeWidth={baselineStroke}
            strokeLinecap="round"
          />

          {/* Beads along the edge to roughen the silhouette */}
          {shapes.beads.map((bd, i) => {
            const p = { x: b0.x + dx * bd.t, y: b0.y + dy * bd.t };
            // small jitter downward from baseline
            const cx = p.x + nx * (thickness * 0.12) + ex * bd.j;
            const cy = p.y + ny * (thickness * 0.12) + ey * bd.j;
            return <circle key={`b${i}`} cx={cx} cy={cy} r={bd.r} fill={color} />;
          })}

          {/* Pool blobs near the low corner */}
          {shapes.poolBlobs.map((pb, i) => {
            const p = { x: b0.x + dx * pb.t, y: b0.y + dy * pb.t };
            const cx = p.x + nx * pb.y;
            const cy = p.y + ny * pb.y;
            return <circle key={`p${i}`} cx={cx} cy={cy} r={pb.r} fill={color} />;
          })}

          {/* Falling drops (slow) */}
          {shapes.drips.map((d, i) => {
            const p = { x: b0.x + dx * d.t, y: b0.y + dy * d.t };
            const cx = p.x + nx * (thickness * 0.25);
            const cy = p.y + ny * (thickness * 0.25);

            const style = {
              // CSS variables for per-drop distance
              ["--fall" as any]: `${d.fall}px`,
              animationDuration: `${d.dur}s`,
              animationDelay: `${d.delay}s`,
            } as React.CSSProperties;

            return (
              <circle
                key={`d${i}`}
                className="slop-drop"
                cx={cx}
                cy={cy}
                r={d.r}
                fill={color}
                style={style}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );

  return createPortal(svg, document.body);
}
```

### Usage

```tsx
function ProjectCard() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        ref={ref}
        className="card slop-tilt-left"
        style={{ transform: "rotate(-6deg)" }} // your slop mode
      >
        ...
      </div>

      <SlopGoo
        targetRef={ref}
        attach={{ start: 0.1, end: 0.95 }}  // percent along bottom edge
        thickness={16}
        maxDrop={110}
        poolBias={0.8}
        viscositySeconds={80}
        color="#11d46a"
        zIndex={5000}
      />
    </>
  );
}
```

---

## Why this matches your “tilt left, pool to corner, but drip vertically” requirement

* **Attach edge respects rotation:** We compute the element’s transformed corners and choose the *downmost* edge in viewport space.
* **Pooling to the lower corner:** We bias blob sizes + drip spawn positions toward the edge endpoint with higher Y.
* **Drips are vertical:** Because the SVG overlay is `position: fixed` (not transformed), the animation is always screen-down.
* **Attach width control:** `attach.start/end` (percent) or pixel-based attach can constrain where on the edge it sticks.
* **Reusable:** Works for cards, buttons, headers—anything you can `ref`.

---

## If you also want “dripping paint” for *non-drip* elements (generic slop styling)

You can reuse the same ingredients in simpler forms:

### A) “Wet / messy edges” without drips

Apply an SVG filter (turbulence + displacement) to a pseudo-element background or to an SVG mask that clips the element. This gives you that irregular “paint edge” look everywhere (badges, underlines, dividers).

### B) Procedural SVG path generator (crisper, more ‘vector’)

Instead of metaballs, generate a single `<path d="...">` for the drip silhouette. This gives maximum control over shape, but animation becomes either:

* path-morphing (JS updates), or
* moving control points slowly with noise.

Metaballs + goo filter is usually the sweet spot for “slop”: it *looks* physical with easy animation.

---

## Practical notes / gotchas (worth knowing up front)

* **Performance:** SVG goo filters are expensive if the filtered region is huge. Keep the overlay height tight (`maxDrop + margin`). The component above does that.
* **Stacking/z-index:** Because it’s in a portal, you’ll want consistent z-index conventions. Sometimes you’ll want it *behind* the card; sometimes above. Expose `zIndex`.
* **Transform updates:** CSS transforms won’t trigger ResizeObserver. The MutationObserver + scroll/resize listeners handle most “slop mode” changes.
* **Reduced motion:** You can disable the falling drops when `prefers-reduced-motion` is on (keep only the static goo).
* **SSR:** If you SSR, keep randomization in `useEffect` (as shown) to avoid hydration mismatch.
