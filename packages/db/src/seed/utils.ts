import { createHash } from "crypto";

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStringToSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed: string | number): Rng {
  const numericSeed = typeof seed === "number" ? seed : hashStringToSeed(seed);
  return mulberry32(numericSeed);
}

export function randInt(rng: Rng, min: number, max: number): number {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(rng() * (high - low + 1)) + low;
}

export function randFloat(rng: Rng, min: number, max: number): number {
  return rng() * (max - min) + min;
}

export function pick<T>(rng: Rng, items: T[]): T {
  return items[randInt(rng, 0, items.length - 1)];
}

export function pickMany<T>(rng: Rng, items: T[], count: number): T[] {
  const pool = [...items];
  const result: T[] = [];
  const target = Math.min(count, pool.length);
  for (let i = 0; i < target; i += 1) {
    const idx = randInt(rng, 0, pool.length - 1);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function uuidFromSeed(value: string): string {
  const hash = createHash("sha256").update(value).digest();
  const bytes = Array.from(hash.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

export function randomPastDate(rng: Rng, daysBack: number): Date {
  const now = Date.now();
  const offsetMs = randInt(rng, 0, daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offsetMs);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export async function insertInChunks(
  db: any,
  table: any,
  rows: any[],
  chunkSize = 500
): Promise<void> {
  if (!rows.length) return;
  for (const chunk of chunkArray(rows, chunkSize)) {
    await db.insert(table).values(chunk).onConflictDoNothing();
  }
}

export function formatNumber(value: number, decimals: number): string {
  return value.toFixed(decimals);
}
