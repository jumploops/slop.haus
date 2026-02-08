import { eq, inArray } from "drizzle-orm";
import { projects } from "../schema";
import {
  addMinutes,
  createRng,
  formatNumber,
  insertInChunks,
  pick,
  randFloat,
  randInt,
  randomPastDate,
  slugify,
  uuidFromSeed,
} from "./utils";

export type ProjectRow = typeof projects.$inferInsert;

const adjectives = [
  "vibey",
  "neon",
  "sloppy",
  "lofi",
  "rapid",
  "fuzzy",
  "glitchy",
  "chaotic",
  "sunset",
  "retro",
  "pixel",
  "holo",
  "tiny",
  "wild",
  "ghost",
  "dream",
  "proto",
  "shimmer",
  "pocket",
  "instant",
];

const nouns = [
  "board",
  "studio",
  "deck",
  "atlas",
  "garden",
  "radio",
  "canvas",
  "tracker",
  "portal",
  "relay",
  "planner",
  "gallery",
  "lab",
  "stack",
  "feed",
  "focus",
  "map",
  "hub",
  "diary",
  "lens",
];

const verbs = [
  "ships",
  "remixes",
  "autofills",
  "summarizes",
  "sketches",
  "routes",
  "rates",
  "rebuilds",
  "syncs",
  "collides",
  "vibes",
  "drips",
];

const taglineTemplates = [
  "A {adj} {noun} that {verb} your momentum.",
  "Ship a {noun} with {adj} energy.",
  "The {noun} you build when vibes are {adj}.",
  "{adjCap} {noun} for teams that move fast.",
  "Turn ideas into a {adj} {noun} in minutes.",
];

const descriptionTemplates = [
  "Built for fast experiments, this {noun} keeps your team shipping while the vibe stays {adj}.",
  "A {adj} layer for projects that need momentum, clarity, and just enough chaos.",
  "If you want to go from idea to demo, this {noun} keeps everything in a single, {adj} loop.",
  "A lightweight {noun} for shipping prototypes that feel {adj} without sacrificing speed.",
];

const urlPrefixes = [
  "https://example.com/",
  "https://demo.slop.haus/",
  "https://vibes.dev/",
  "https://shipit.app/",
];

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildTagline(adj: string, noun: string, rng: () => number): string {
  const template = pick(rng, taglineTemplates);
  return template
    .replace("{adj}", adj)
    .replace("{adjCap}", capitalize(adj))
    .replace("{noun}", noun)
    .replace("{verb}", pick(rng, verbs));
}

function buildDescription(adj: string, noun: string, rng: () => number): string {
  const template = pick(rng, descriptionTemplates);
  return template.replace("{adj}", adj).replace("{noun}", noun);
}

export function buildProjects(options: {
  count: number;
  seed: string;
  authorIds: string[];
}): ProjectRow[] {
  const rng = createRng(options.seed);
  const rows: ProjectRow[] = [];

  for (let i = 0; i < options.count; i += 1) {
    const adj = pick(rng, adjectives);
    const noun = pick(rng, nouns);
    const slugBase = slugify(`${adj}-${noun}-${i + 1}`);
    const slug = slugBase.length ? slugBase : `project-${i + 1}`;
    const title = `${capitalize(adj)} ${capitalize(noun)}`;

    const vibeMode = rng() < 0.6 ? "overview" : "detailed";
    const vibePercent = randInt(rng, 5, 95);

    const createdAt = randomPastDate(rng, 120);
    const updatedAtCandidate = addMinutes(createdAt, randInt(rng, 10, 60 * 24 * 14));
    const updatedAt = updatedAtCandidate.getTime() > Date.now() ? new Date() : updatedAtCandidate;
    const lastEditedCandidate = addMinutes(updatedAt, randInt(rng, 5, 60 * 24 * 7));
    const lastEditedAt =
      rng() < 0.4
        ? lastEditedCandidate.getTime() > Date.now()
          ? new Date()
          : lastEditedCandidate
        : null;

    const mainUrl = rng() < 0.75 ? `${pick(rng, urlPrefixes)}${slug}` : null;
    const repoUrl = rng() < 0.6 ? `https://github.com/slophaus/${slug}` : null;

    const statusRoll = rng();
    const status = statusRoll < 0.8 ? "published" : statusRoll < 0.95 ? "hidden" : "removed";

    const enrichmentRoll = rng();
    const enrichmentStatus = enrichmentRoll < 0.7 ? "completed" : enrichmentRoll < 0.9 ? "pending" : "failed";

    const hotScore = formatNumber(randFloat(rng, 0, 200), 4);

    const vibeDetailsJson =
      vibeMode === "detailed"
        ? {
            axes: [
              { label: "coherence", score: Number(formatNumber(randFloat(rng, 0.2, 0.95), 2)) },
              { label: "novelty", score: Number(formatNumber(randFloat(rng, 0.2, 0.95), 2)) },
              { label: "ship_speed", score: Number(formatNumber(randFloat(rng, 0.2, 0.95), 2)) },
            ],
          }
        : null;

    rows.push({
      id: uuidFromSeed(`project:${slug}`),
      slug,
      authorUserId: pick(rng, options.authorIds),
      title,
      tagline: buildTagline(adj, noun, rng),
      description: buildDescription(adj, noun, rng),
      mainUrl,
      repoUrl,
      vibeMode,
      vibePercent,
      vibeDetailsJson,
      likeCount: 0,
      reviewCount: 0,
      reviewScoreTotal: 0,
      slopScore: "0",
      hotScore,
      commentCount: 0,
      status,
      enrichmentStatus,
      createdAt,
      updatedAt,
      lastEditedAt,
    });
  }

  return rows;
}

export async function seedProjects(db: any, rows: ProjectRow[]): Promise<void> {
  await insertInChunks(db, projects, rows);
}

export async function fetchProjectMap(
  db: any,
  slugs: string[]
): Promise<Map<string, string>> {
  if (!slugs.length) return new Map();
  const found = await db
    .select({ id: projects.id, slug: projects.slug })
    .from(projects)
    .where(inArray(projects.slug, slugs));
  return new Map(found.map((row) => [row.slug, row.id]));
}

export async function updateProjectCounts(
  db: any,
  counts: Map<string, { likeCount: number; reviewCount: number; reviewScoreTotal: number; commentCount: number }>
): Promise<void> {
  for (const [projectId, values] of counts.entries()) {
    const slopScore =
      values.reviewCount > 0 ? formatNumber(values.reviewScoreTotal / values.reviewCount, 2) : "0";

    await db
      .update(projects)
      .set({
        likeCount: values.likeCount,
        reviewCount: values.reviewCount,
        reviewScoreTotal: values.reviewScoreTotal,
        slopScore,
        commentCount: values.commentCount,
      })
      .where(eq(projects.id, projectId));
  }
}
