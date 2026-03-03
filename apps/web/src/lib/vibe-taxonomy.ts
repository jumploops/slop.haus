export const VIBE_BUCKETS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

export type VibeBucket = (typeof VIBE_BUCKETS)[number];

const VIBE_LABEL_BY_BUCKET: Record<VibeBucket, string> = {
  0: "Handcrafted",
  10: "Mostly Human",
  20: "Mostly Human",
  30: "Mostly Human",
  40: "AI-Assisted",
  50: "AI-Assisted",
  60: "AI-Assisted",
  70: "Mostly AI",
  80: "Mostly AI",
  90: "Vibecoded",
  100: "Pure Vibe",
};

export function clampVibePercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

export function getRoundedVibeBucket(percent: number): VibeBucket {
  const clampedPercent = clampVibePercent(percent);
  // Rounded deciles per product decision (e.g. 5 -> 10, 95 -> 100).
  const roundedBucket = Math.round(clampedPercent / 10) * 10;
  const boundedBucket = Math.max(0, Math.min(100, roundedBucket));
  return boundedBucket as VibeBucket;
}

export function getVibeLabel(percent: number): string {
  return VIBE_LABEL_BY_BUCKET[getRoundedVibeBucket(percent)];
}

export function getVibeTaxonomy(percent: number): {
  clampedPercent: number;
  bucket: VibeBucket;
  label: string;
} {
  const clampedPercent = clampVibePercent(percent);
  const bucket = getRoundedVibeBucket(clampedPercent);
  return {
    clampedPercent,
    bucket,
    label: VIBE_LABEL_BY_BUCKET[bucket],
  };
}
