import type { Edge, Point } from "./types";

function sortPointsCCW(points: Point[]): Point[] {
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  return [...points].sort(
    (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx)
  );
}

function parseAngle(value: string | null | undefined) {
  if (!value || value === "none") return null;
  const raw = value.trim().split(/\s+/)[0];
  const match = raw.match(/^(-?\\d*\\.?\\d+)(deg|rad|turn)$/);
  if (!match) return null;
  const amount = Number.parseFloat(match[1]);
  const unit = match[2];
  if (Number.isNaN(amount)) return null;
  if (unit === "rad") return amount;
  if (unit === "turn") return amount * Math.PI * 2;
  return (amount * Math.PI) / 180;
}

function getRotationAngle(el: HTMLElement) {
  const style = getComputedStyle(el);
  const transform = style.transform;
  if (transform && transform !== "none") {
    const Matrix = typeof DOMMatrixReadOnly !== "undefined" ? DOMMatrixReadOnly : DOMMatrix;
    const matrix = new Matrix(transform);
    return Math.atan2(matrix.b, matrix.a);
  }
  const rotate = (style as CSSStyleDeclaration & { rotate?: string }).rotate;
  const angle = parseAngle(rotate);
  return angle ?? 0;
}

function computeQuadWithAngle(el: HTMLElement, angle: number) {
  const rect = el.getBoundingClientRect();
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const halfW = width / 2;
  const halfH = height / 2;

  const local: Point[] = [
    { x: -halfW, y: -halfH },
    { x: halfW, y: -halfH },
    { x: halfW, y: halfH },
    { x: -halfW, y: halfH },
  ];

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const world = local.map((p) => ({
    x: cx + p.x * cos - p.y * sin,
    y: cy + p.x * sin + p.y * cos,
  }));

  return sortPointsCCW(world);
}

export function getElementQuad(el: HTMLElement, options?: { rotationRad?: number }): Point[] {
  if (typeof options?.rotationRad === "number") {
    return computeQuadWithAngle(el, options.rotationRad);
  }

  const anyEl = el as HTMLElement & { getBoxQuads?: (options?: { box: string }) => DOMQuad[] };
  if (typeof anyEl.getBoxQuads === "function") {
    const quads = anyEl.getBoxQuads({ box: "border" });
    if (quads && quads.length) {
      const q = quads[0];
      const pts = [q.p1, q.p2, q.p3, q.p4].map((p) => ({ x: p.x, y: p.y }));
      return sortPointsCCW(pts);
    }
  }

  return computeQuadWithAngle(el, getRotationAngle(el));
}

export function pickDownmostEdge(pointsCCW: Point[]): Edge {
  let bestI = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < pointsCCW.length; i += 1) {
    const a = pointsCCW[i];
    const b = pointsCCW[(i + 1) % pointsCCW.length];
    const score = (a.y + b.y) / 2;
    if (score > bestScore) {
      bestScore = score;
      bestI = i;
    }
  }

  const a = pointsCCW[bestI];
  const b = pointsCCW[(bestI + 1) % pointsCCW.length];
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const length = Math.hypot(vx, vy) || 1;
  const eDir = { x: vx / length, y: vy / length };
  const nIn = { x: -eDir.y, y: eDir.x };

  return { a, b, eDir, nIn, length };
}
