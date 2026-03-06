"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "@/hooks/useIsClient";
import { getElementQuad, pickDownmostEdge } from "@/lib/slop/geometry";
import { mulberry32, randomSeed } from "@/lib/slop/random";
import type { Attach, Point } from "@/lib/slop/types";

const DEFAULT_ATTACH: Attach = { start: 0, end: 1 };

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
}

export type SlopGooProps = {
  targetRef: RefObject<HTMLElement | null>;
  seed?: number;
  rotationDeg?: number;
  renderMode?: "portal" | "inline";
  attach?: Attach;
  color?: string;
  thickness?: number;
  maxDrop?: number;
  blur?: number;
  threshold?: number;
  displacementScale?: number;
  animateNoise?: boolean;
  beadSpacing?: number;
  dripCount?: number;
  poolBias?: number;
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

export function SlopGoo({
  targetRef,
  seed: seedOverride,
  rotationDeg,
  renderMode = "portal",
  attach = DEFAULT_ATTACH,
  color = "var(--slop-green)",
  thickness = 14,
  maxDrop = 90,
  blur = 8,
  threshold = 18,
  displacementScale: displacementScaleOverride,
  animateNoise = true,
  beadSpacing = 18,
  dripCount = 7,
  poolBias = 0.65,
  viscositySeconds = 55,
  edgeInset = 0,
  edgeInsetLowEnd = 0,
  edgeOffset = 0,
  edgeFeather = 4,
  borderOffset = 0,
  useBorderOffset = true,
  zIndex = 5000,
  enabled = true,
}: SlopGooProps) {
  const isClient = useIsClient();
  const [generatedSeed] = useState(() => seedOverride ?? randomSeed());
  const seed = seedOverride ?? generatedSeed;
  const [geom, setGeom] = useState<null | {
    left: number;
    top: number;
    width: number;
    height: number;
    b0: Point;
    b1: Point;
    segLen: number;
    lowEndIsB1: boolean;
    mode: "fixed" | "absolute";
  }>(null);

  const id = useId().replace(/:/g, "");
  const filterId = `slop-goo-${id}`;
  const prefersReducedMotion = usePrefersReducedMotion();
  const showDrips = !prefersReducedMotion && dripCount > 0;

  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }
    const el = targetRef.current;
    if (!el) return;

    let raf = 0;

    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const position = getComputedStyle(el).position;
        const isFixed = position === "fixed";
        const rotationRad = typeof rotationDeg === "number" ? (rotationDeg * Math.PI) / 180 : undefined;
        let quad = getElementQuad(el, rotationRad !== undefined ? { rotationRad } : undefined);
        if (renderMode === "portal" && !isFixed) {
          const scrollX = window.scrollX || window.pageXOffset || 0;
          const scrollY = window.scrollY || window.pageYOffset || 0;
          quad = quad.map((p) => ({ x: p.x + scrollX, y: p.y + scrollY }));
        } else if (renderMode === "inline") {
          const parent = el.parentElement;
          if (!parent) {
            setGeom(null);
            return;
          }
          const parentRect = parent.getBoundingClientRect();
          quad = quad.map((p) => ({
            x: p.x - parentRect.left,
            y: p.y - parentRect.top,
          }));
        }
        if (quad.length < 4) {
          setGeom(null);
          return;
        }
        const edge = pickDownmostEdge(quad);
        if (edge.length < 2) {
          setGeom(null);
          return;
        }

        let t0 = 0;
        let t1 = 1;
        if ("mode" in attach && attach.mode === "pixels") {
          t0 = attach.startPx / edge.length;
          t1 = (attach.startPx + attach.lengthPx) / edge.length;
        } else {
          t0 = attach.start;
          t1 = attach.end;
        }
        t0 = clamp01(t0);
        t1 = clamp01(t1);
        if (t1 < t0) [t0, t1] = [t1, t0];

        const a0 = lerpPoint(edge.a, edge.b, t0);
        const a1 = lerpPoint(edge.a, edge.b, t1);

        const styles = useBorderOffset ? getComputedStyle(el) : null;
        const borderWidth = styles
          ? Math.max(
              Number.parseFloat(styles.borderTopWidth) || 0,
              Number.parseFloat(styles.borderRightWidth) || 0,
              Number.parseFloat(styles.borderBottomWidth) || 0,
              Number.parseFloat(styles.borderLeftWidth) || 0
            )
          : 0;
        const offset = edgeOffset + borderOffset + (useBorderOffset ? borderWidth : 0);
        const b0 = {
          x: a0.x - edge.nIn.x * offset,
          y: a0.y - edge.nIn.y * offset,
        };
        const b1 = {
          x: a1.x - edge.nIn.x * offset,
          y: a1.y - edge.nIn.y * offset,
        };

        const margin = Math.max(blur * 3, thickness * 2, 24);
        const minX = Math.min(b0.x, b1.x) - margin;
        const maxX = Math.max(b0.x, b1.x) + margin;
        const minY = Math.min(b0.y, b1.y) - margin;
        const maxY = Math.max(b0.y, b1.y) + maxDrop + margin;

        const left = minX;
        const top = minY;
        const width = Math.max(1, maxX - minX);
        const height = Math.max(1, maxY - minY);

        const lowEndIsB1 = b1.y > b0.y;
        let localB0 = { x: b0.x - left, y: b0.y - top };
        let localB1 = { x: b1.x - left, y: b1.y - top };
        let segLen = Math.hypot(localB1.x - localB0.x, localB1.y - localB0.y) || 1;
        const insetStart = edgeInset + (lowEndIsB1 ? 0 : edgeInsetLowEnd);
        const insetEnd = edgeInset + (lowEndIsB1 ? edgeInsetLowEnd : 0);
        if (segLen > insetStart + insetEnd) {
          const ex = (localB1.x - localB0.x) / segLen;
          const ey = (localB1.y - localB0.y) / segLen;
          localB0 = { x: localB0.x + ex * insetStart, y: localB0.y + ey * insetStart };
          localB1 = { x: localB1.x - ex * insetEnd, y: localB1.y - ey * insetEnd };
          segLen = Math.hypot(localB1.x - localB0.x, localB1.y - localB0.y) || 1;
        }

        setGeom({
          left,
          top,
          width,
          height,
          b0: localB0,
          b1: localB1,
          segLen,
          lowEndIsB1,
          mode: renderMode === "inline" ? "absolute" : isFixed ? "fixed" : "absolute",
        });
      });
    };

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
  }, [attach, blur, borderOffset, edgeInset, edgeInsetLowEnd, edgeOffset, enabled, maxDrop, renderMode, targetRef, thickness, useBorderOffset]);

  const shapes = useMemo(() => {
    if (!geom) return null;

    const rand = mulberry32(seed);
    const spacing = Math.max(6, beadSpacing);
    const thicknessSafe = Math.max(1, thickness);
    const biasPow = lerp(1, 4, clamp01(poolBias));
    const biasToLowEnd = geom.lowEndIsB1;

    const biasedU = (u: number) => {
      if (biasToLowEnd) return 1 - Math.pow(1 - u, biasPow);
      return Math.pow(u, biasPow);
    };

    const beads: Array<{ t: number; r: number; j: number }> = [];
    const beadCount = Math.max(2, Math.floor(geom.segLen / spacing));
    for (let i = 0; i <= beadCount; i += 1) {
      const u = i / beadCount;
      const isEnd = i === 0 || i === beadCount;
      const t = isEnd ? u : clamp01(u + (rand() - 0.5) * (1 / beadCount) * 0.6);
      const g = biasToLowEnd ? t : 1 - t;
      const r = isEnd
        ? thicknessSafe * (0.6 + g * 0.2)
        : thicknessSafe * (0.35 + rand() * 0.25 + g * 0.25);
      const j = isEnd ? 0 : (rand() - 0.5) * thicknessSafe * 0.25;
      beads.push({ t, r, j });
    }

    const poolBlobs: Array<{ t: number; r: number; y: number }> = [];
    for (let k = 0; k < 3; k += 1) {
      const u = biasedU(rand());
      poolBlobs.push({
        t: u,
        r: thicknessSafe * (0.9 + rand() * 0.6),
        y: thicknessSafe * (0.25 + rand() * 0.35),
      });
    }

    const drips: Array<{ t: number; r: number; fall: number; dur: number; delay: number }> = [];
    const dripTotal = showDrips ? Math.max(0, Math.floor(dripCount)) : 0;
    for (let i = 0; i < dripTotal; i += 1) {
      const u = biasedU(rand());
      const g = biasToLowEnd ? u : 1 - u;
      const r = thicknessSafe * (0.25 + rand() * 0.35 + g * 0.15);
      const fall = lerp(maxDrop * 0.35, maxDrop, rand()) * (0.75 + g * 0.35);
      const dur = viscositySeconds * (0.65 + rand() * 0.8);
      const delay = -rand() * dur;
      drips.push({ t: u, r, fall, dur, delay });
    }

    return { beads, poolBlobs, drips };
  }, [beadSpacing, dripCount, geom, maxDrop, poolBias, seed, showDrips, thickness, viscositySeconds]);

  if (!enabled || !isClient || !geom || !shapes) return null;

  const seedValue = seed;
  const { left, top, width, height, b0, b1, mode } = geom;
  const dx = b1.x - b0.x;
  const dy = b1.y - b0.y;
  const segLen = Math.hypot(dx, dy) || 1;
  const ex = dx / segLen;
  const ey = dy / segLen;

  let nx = ey;
  let ny = -ex;
  if (ny < 0) {
    nx = -nx;
    ny = -ny;
  }

  const baselineStroke = Math.max(1, thickness);
  const maskId = `slop-goo-mask-${id}`;
  const gradientId = `slop-goo-mask-gradient-${id}`;
  const feather = Math.max(0, edgeFeather);
  const displacementScale = prefersReducedMotion ? 0 : displacementScaleOverride ?? 6;
  const filterPad = Math.ceil(blur * 3 + displacementScale + 8);
  const gx1 = b0.x - nx * feather;
  const gy1 = b0.y - ny * feather;
  const gx2 = b0.x + nx * feather;
  const gy2 = b0.y + ny * feather;
  const svg = (
    <div
      style={{
        position: mode,
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
          <filter
            id={filterId}
            filterUnits="userSpaceOnUse"
            x={-filterPad}
            y={-filterPad}
            width={width + filterPad * 2}
            height={height + filterPad * 2}
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values={`
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 ${threshold} -7
              `}
              result="goo"
            />
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed={seedValue % 997} result="noise">
              {!prefersReducedMotion && animateNoise && (
                <animate attributeName="baseFrequency" dur="90s" values="0.010;0.014;0.010" repeatCount="indefinite" />
              )}
            </feTurbulence>
            <feDisplacementMap
              in="goo"
              in2="noise"
              scale={displacementScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1={gx1}
            y1={gy1}
            x2={gx2}
            y2={gy2}
          >
            <stop offset="0" stopColor="black" stopOpacity={feather === 0 ? 1 : 0} />
            <stop offset="1" stopColor="white" stopOpacity="1" />
          </linearGradient>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width={width} height={height} fill={`url(#${gradientId})`} />
          </mask>
        </defs>

        <g filter={`url(#${filterId})`} mask={`url(#${maskId})`}>
          <line
            x1={b0.x}
            y1={b0.y}
            x2={b1.x}
            y2={b1.y}
            stroke={color}
            strokeWidth={baselineStroke}
            strokeLinecap="round"
          />

          {shapes.beads.map((bd, i) => {
            const p = { x: b0.x + dx * bd.t, y: b0.y + dy * bd.t };
            const cx = p.x + nx * (thickness * 0.12) + ex * bd.j;
            const cy = p.y + ny * (thickness * 0.12) + ey * bd.j;
            return <circle key={`b${i}`} cx={cx} cy={cy} r={bd.r} fill={color} />;
          })}

          {shapes.poolBlobs.map((pb, i) => {
            const p = { x: b0.x + dx * pb.t, y: b0.y + dy * pb.t };
            const cx = p.x + nx * pb.y;
            const cy = p.y + ny * pb.y;
            return <circle key={`p${i}`} cx={cx} cy={cy} r={pb.r} fill={color} />;
          })}

          {showDrips &&
            shapes.drips.map((d, i) => {
              const p = { x: b0.x + dx * d.t, y: b0.y + dy * d.t };
              const cx = p.x + nx * (thickness * 0.25);
              const cy = p.y + ny * (thickness * 0.25);
              const style = {
                "--slop-fall": `${d.fall}px`,
                animationDuration: `${d.dur}s`,
                animationDelay: `${d.delay}s`,
              } as CSSProperties;

              return (
                <circle
                  key={`d${i}`}
                  className="slop-goo-drop"
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

  return renderMode === "inline" ? svg : createPortal(svg, document.body);
}
