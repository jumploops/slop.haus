import { projectRevisions } from "../schema";
import {
  addMinutes,
  createRng,
  insertInChunks,
  pick,
  randInt,
  randomPastDate,
  uuidFromSeed,
} from "./utils";

export type ProjectRevisionRow = typeof projectRevisions.$inferInsert;

export function buildProjectRevisions(options: {
  seed: string;
  projectIds: string[];
  reviewerIds: string[];
}): ProjectRevisionRow[] {
  const rng = createRng(options.seed);
  const rows: ProjectRevisionRow[] = [];
  const possibleFields = ["title", "tagline", "description", "vibePercent"] as const;

  for (const projectId of options.projectIds) {
    if (rng() > 0.15) continue;
    const revisionCount = randInt(rng, 1, 2);

    for (let i = 0; i < revisionCount; i += 1) {
      const submittedAt = randomPastDate(rng, 60);
      const statusRoll = rng();
      const status = statusRoll < 0.5 ? "pending" : statusRoll < 0.8 ? "approved" : "rejected";
      const reviewedCandidate =
        status === "pending" ? null : addMinutes(submittedAt, randInt(rng, 60, 60 * 24 * 3));
      const reviewedAt =
        reviewedCandidate && reviewedCandidate.getTime() > Date.now()
          ? new Date()
          : reviewedCandidate;
      const reviewerUserId = status === "pending" ? null : pick(rng, options.reviewerIds);
      const changedFields = possibleFields.filter(() => rng() < 0.6);
      if (!changedFields.length) changedFields.push(pick(rng, possibleFields));

      const title = changedFields.includes("title") ? "Updated title pass" : null;
      const tagline = changedFields.includes("tagline") ? "Refined tagline for clarity" : null;
      const description = changedFields.includes("description")
        ? "Adjusted copy to better match the project vibe."
        : null;
      const vibePercent = changedFields.includes("vibePercent") ? randInt(rng, 10, 90) : null;
      const vibeMode = rng() < 0.5 ? "overview" : null;
      if (vibeMode && !changedFields.includes("vibeMode")) {
        changedFields.push("vibeMode");
      }

      rows.push({
        id: uuidFromSeed(`revision:${projectId}:${i}`),
        projectId,
        status,
        title,
        tagline,
        description,
        vibePercent,
        vibeMode,
        vibeDetailsJson: null,
        changedFields,
        submittedAt,
        reviewedAt,
        reviewerUserId,
      });
    }
  }

  return rows;
}

export async function seedProjectRevisions(db: any, rows: ProjectRevisionRow[]): Promise<void> {
  await insertInChunks(db, projectRevisions, rows);
}
