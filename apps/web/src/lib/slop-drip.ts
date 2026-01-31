"use client";

import { useEffect, useRef } from "react";

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function svgToDataUrl(svg: string) {
  const encoded = btoa(unescape(encodeURIComponent(svg)));
  return `url("data:image/svg+xml;base64,${encoded}")`;
}

function randomSeed() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.random() * 2 ** 32);
}

interface DripMaskOptions {
  seed?: number;
  dripCount?: number;
  baseline?: number;
  maxExtra?: number;
  roughness?: number;
  samples?: number;
  segmented?: boolean;
}

function makeDripMask({
  seed,
  dripCount = 8,
  baseline = 0.28,
  maxExtra = 0.68,
  roughness = 0.06,
  samples = 120,
  segmented = false,
}: DripMaskOptions = {}) {
  const rand = mulberry32(seed ?? 1);
  const W = samples;
  const H = 100;
  const base = baseline * H;
  const depth = new Array(W + 1).fill(segmented ? 0 : base);

  for (let i = 0; i < dripCount; i += 1) {
    const center = rand() * W;
    const width = 6 + rand() * 22;
    const len = maxExtra * H * (0.35 + rand());

    const x0 = Math.max(0, center - width / 2);
    const x1 = Math.min(W, center + width / 2);
    const span = Math.max(1e-6, x1 - x0);

    for (let x = Math.floor(x0); x <= Math.ceil(x1); x += 1) {
      const t = (x - x0) / span;
      const bump = Math.sin(Math.PI * t);
      depth[x] = Math.min(H, Math.max(depth[x], base + len * bump));
    }
  }

  for (let x = 0; x <= W; x += 1) {
    if (segmented && depth[x] <= 0) continue;
    const jitter = (rand() * 2 - 1) * roughness * H;
    depth[x] = Math.max(0, Math.min(H, depth[x] + jitter));
  }

  const sx = (x: number) => (x / W) * 100;

  let d = "";
  if (segmented) {
    const epsilon = 0.5;
    let start = -1;
    for (let x = 0; x <= W; x += 1) {
      const hasDepth = depth[x] > epsilon;
      if (start === -1 && hasDepth) {
        start = x;
      } else if (start !== -1 && !hasDepth) {
        const end = x - 1;
        d += `M ${sx(start).toFixed(2)} 0 L ${sx(end).toFixed(2)} 0 `;
        for (let xi = end; xi >= start; xi -= 1) {
          d += `L ${sx(xi).toFixed(2)} ${depth[xi].toFixed(2)} `;
        }
        d += "Z ";
        start = -1;
      }
    }
    if (start !== -1) {
      const end = W;
      d += `M ${sx(start).toFixed(2)} 0 L ${sx(end).toFixed(2)} 0 `;
      for (let xi = end; xi >= start; xi -= 1) {
        d += `L ${sx(xi).toFixed(2)} ${depth[xi].toFixed(2)} `;
      }
      d += "Z ";
    }
  } else {
    d = `M 0 0 L 100 0 L 100 ${depth[W].toFixed(2)} `;
    for (let x = W - 1; x >= 0; x -= 1) {
      d += `L ${sx(x).toFixed(2)} ${depth[x].toFixed(2)} `;
    }
    d += "Z";
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
  <path d="${d}" fill="white"/>
</svg>`.trim();

  return svgToDataUrl(svg);
}

interface SlopDripOptions extends DripMaskOptions {
  depth?: number;
}

export function useSlopDrip(enabled: boolean, options: SlopDripOptions = {}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const seedRef = useRef<number | null>(null);

  const {
    seed,
    depth = 28,
    dripCount = 8,
    baseline = 0.28,
    maxExtra = 0.68,
    roughness = 0.06,
    samples = 120,
    segmented = false,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!enabled) {
      el.style.removeProperty("--slop-mask");
      el.style.removeProperty("--slop-depth");
      el.style.removeProperty("--slop-mask-x");
      return;
    }
    if (seedRef.current === null) {
      seedRef.current = seed ?? randomSeed();
    }
    const mask = makeDripMask({
      seed: seedRef.current,
      dripCount,
      baseline,
      maxExtra,
      roughness,
      samples,
      segmented,
    });
    el.style.setProperty("--slop-mask", mask);
    el.style.setProperty("--slop-depth", `${depth}px`);
    const offsetSeed = seedRef.current ?? 1;
    const offsetRand = mulberry32(offsetSeed + 101)();
    el.style.setProperty("--slop-mask-x", `${Math.floor(offsetRand * 100)}%`);
  }, [enabled, depth, dripCount, baseline, maxExtra, roughness, samples]);

  return ref;
}
