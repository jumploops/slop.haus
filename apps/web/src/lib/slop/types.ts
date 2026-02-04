export type Point = { x: number; y: number };

export type Edge = {
  a: Point;
  b: Point;
  eDir: Point;
  nIn: Point;
  length: number;
};

export type Attach =
  | { mode?: "percent"; start: number; end: number }
  | { mode: "pixels"; startPx: number; lengthPx: number };
