import type { SlopBand } from "@slop/shared";

const SLOP_BAND_BADGE_CLASS: Record<SlopBand, string> = {
  unrated: "bg-muted text-muted-foreground",
  sloppy: "bg-destructive text-white",
  stale: "bg-slop-orange text-white",
  decent: "bg-slop-lime text-white",
  solid: "bg-primary text-white",
  immaculate: "bg-primary text-white",
};

const SLOP_BAND_TEXT_CLASS: Record<SlopBand, string> = {
  unrated: "text-muted-foreground",
  sloppy: "text-destructive",
  stale: "text-slop-orange",
  decent: "text-slop-lime",
  solid: "text-primary",
  immaculate: "text-primary",
};

export function getSlopBandBadgeClass(band: SlopBand): string {
  return SLOP_BAND_BADGE_CLASS[band];
}

export function getSlopBandTextClass(band: SlopBand): string {
  return SLOP_BAND_TEXT_CLASS[band];
}
