export type SlopBand = "unrated" | "sloppy" | "stale" | "decent" | "solid" | "immaculate";
export type RatedSlopBand = Exclude<SlopBand, "unrated">;

const MIN_SLOP_SCORE = 0;
const MAX_SLOP_SCORE = 10;
const IMMACULATE_AGGREGATE_THRESHOLD = 9.5;

const SLOP_BAND_TERM: Record<SlopBand, string> = {
  unrated: "UNRATED",
  sloppy: "SLOPPY",
  stale: "STALE",
  decent: "DECENT",
  solid: "SOLID",
  immaculate: "IMMACULATE",
};

export function getSlopBandForReviewScore(score: number): RatedSlopBand {
  const normalized = normalizeSlopScore(score);
  if (normalized >= MAX_SLOP_SCORE) return "immaculate";
  if (normalized >= 8) return "solid";
  if (normalized >= 6) return "decent";
  if (normalized >= 4) return "stale";
  return "sloppy";
}

export function getSlopBandForAggregateScore(score: number, reviewCount: number): SlopBand {
  if (reviewCount <= 0) {
    return "unrated";
  }

  const normalized = normalizeSlopScore(score);
  if (normalized >= IMMACULATE_AGGREGATE_THRESHOLD) return "immaculate";
  if (normalized >= 8) return "solid";
  if (normalized >= 6) return "decent";
  if (normalized >= 4) return "stale";
  return "sloppy";
}

export function getSlopBandTerm(band: SlopBand): string {
  return SLOP_BAND_TERM[band];
}

export function getSlopBandLabel(band: SlopBand): string {
  if (band === "unrated") {
    return SLOP_BAND_TERM[band];
  }

  return `${SLOP_BAND_TERM[band]} SLOP`;
}

function normalizeSlopScore(score: number): number {
  if (!Number.isFinite(score)) {
    return MIN_SLOP_SCORE;
  }

  if (score < MIN_SLOP_SCORE) {
    return MIN_SLOP_SCORE;
  }

  if (score > MAX_SLOP_SCORE) {
    return MAX_SLOP_SCORE;
  }

  return score;
}
