import { enrichmentDrafts } from "../schema";
import {
  addMinutes,
  createRng,
  insertInChunks,
  pick,
  randInt,
  randomPastDate,
  uuidFromSeed,
} from "./utils";

export type EnrichmentDraftRow = typeof enrichmentDrafts.$inferInsert;

const urlSamples: Array<{
  url: string;
  type: "github" | "gitlab" | "npm" | "pypi" | "live_site";
}> = [
  { url: "https://github.com/slophaus/vibe-kit", type: "github" },
  { url: "https://npmjs.com/package/slop-kit", type: "npm" },
  { url: "https://vibe.dev/slop-kit", type: "live_site" },
  { url: "https://pypi.org/project/vibe-kit", type: "pypi" },
  { url: "https://gitlab.com/slophaus/ship-fast", type: "gitlab" },
];

export function buildEnrichmentDrafts(options: {
  seed: string;
  userIds: string[];
}): EnrichmentDraftRow[] {
  const rng = createRng(options.seed);
  const rows: EnrichmentDraftRow[] = [];

  const count = 15;
  for (let i = 0; i < count; i += 1) {
    const sample = pick(rng, urlSamples);
    const createdAt = randomPastDate(rng, 14);
    const statusRoll = rng();
    const status =
      statusRoll < 0.4
        ? "pending"
        : statusRoll < 0.65
          ? "ready"
          : statusRoll < 0.85
            ? "failed"
            : "submitted";

    rows.push({
      id: uuidFromSeed(`draft:${sample.url}:${i}`),
      userId: pick(rng, options.userIds),
      inputUrl: sample.url,
      detectedUrlType: sample.type,
      scrapedContent: status === "ready" ? { title: "Slop Kit", summary: "A fast vibe starter." } : null,
      scrapedMetadata: status === "ready" ? { ogTitle: "Slop Kit", ogDescription: "Ship fast." } : null,
      screenshotUrl: null,
      screenshotSource: null,
      suggestedTitle: status === "ready" ? "Slop Kit" : null,
      suggestedTagline: status === "ready" ? "Starter kit for sloppier shipping" : null,
      suggestedDescription: status === "ready" ? "A quick starter for vibey prototypes." : null,
      suggestedTools: status === "ready" ? ["Next.js", "Tailwind CSS"] : null,
      suggestedVibePercent: status === "ready" ? randInt(rng, 20, 80) : null,
      suggestedMainUrl: status === "ready" ? sample.url : null,
      suggestedRepoUrl: status === "ready" ? "https://github.com/slophaus/vibe-kit" : null,
      finalTitle: null,
      finalTagline: null,
      finalDescription: null,
      finalTools: null,
      finalVibePercent: null,
      finalMainUrl: null,
      finalRepoUrl: null,
      status,
      error: status === "failed" ? "Scrape timed out" : null,
      createdAt,
      updatedAt: (() => {
        const candidate = addMinutes(createdAt, randInt(rng, 5, 120));
        return candidate.getTime() > Date.now() ? new Date() : candidate;
      })(),
      expiresAt: null,
      deletedAt: null,
    });
  }

  return rows;
}

export async function seedEnrichmentDrafts(db: any, rows: EnrichmentDraftRow[]): Promise<void> {
  await insertInChunks(db, enrichmentDrafts, rows);
}
