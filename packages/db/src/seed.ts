import { db } from "./index";
import { projects } from "./schema";
import { notInArray, sql } from "drizzle-orm";
import { buildComments, seedComments } from "./seed/comments";
import { buildEnrichmentDrafts, seedEnrichmentDrafts } from "./seed/enrichment";
import {
  buildCommentVotes,
  buildFavorites,
  buildProjectLikes,
  buildProjectTools,
  seedCommentVotes,
  seedFavorites,
  seedProjectLikes,
  seedProjectTools,
} from "./seed/interactions";
import { buildModerationEvents, buildFlags, seedFlags, seedModerationEvents } from "./seed/moderation";
import { buildProjects, fetchProjectMap, seedProjects, updateProjectCounts } from "./seed/projects";
import { buildProjectRevisions, seedProjectRevisions } from "./seed/revisions";
import { seedTools } from "./seed/tools";
import { seedUsers } from "./seed/users";

const PROJECT_COUNT = 200;
const SEED_TOKEN = "slop-heavy-v1";

async function seed() {
  const start = Date.now();
  console.log(`Seeding database (heavy, ${PROJECT_COUNT} projects)...`);

  const toolMap = await seedTools(db);
  console.log(`Tools ready: ${toolMap.size}`);
  if (!toolMap.size) {
    throw new Error("No tools available; cannot generate project tool tags.");
  }

  const userMap = await seedUsers(db);
  const userIds = [...userMap.values()];
  console.log(`Users ready: ${userMap.size}`);
  if (!userIds.length) {
    throw new Error("No seed users available; cannot generate projects.");
  }

  const projectsBase = buildProjects({
    count: PROJECT_COUNT,
    seed: `${SEED_TOKEN}:projects`,
    authorIds: userIds,
  });
  const seedSlugs = projectsBase.map((project) => project.slug);
  await seedProjects(db, projectsBase);

  const projectMap = await fetchProjectMap(
    db,
    projectsBase.map((project) => project.slug)
  );
  const projectIds = projectsBase.map((project) => projectMap.get(project.slug) ?? project.id);
  console.log(`Projects ready: ${projectIds.length}`);

  const toolIds = [...toolMap.values()];
  const projectTools = buildProjectTools({
    seed: `${SEED_TOKEN}:project-tools`,
    projectIds,
    toolIds,
  });
  await seedProjectTools(db, projectTools);

  const comments = buildComments({
    seed: `${SEED_TOKEN}:comments`,
    projectIds,
    userIds,
  });
  await seedComments(db, comments);

  const projectLikes = buildProjectLikes({
    seed: `${SEED_TOKEN}:likes`,
    projectIds,
    userIds,
  });
  await seedProjectLikes(db, projectLikes);

  const favorites = buildFavorites({
    seed: `${SEED_TOKEN}:favorites`,
    projectIds,
    userIds,
  });
  await seedFavorites(db, favorites);

  const commentVotes = buildCommentVotes({
    seed: `${SEED_TOKEN}:comment-votes`,
    commentIds: comments.map((comment) => comment.id),
    userIds,
  });
  await seedCommentVotes(db, commentVotes);

  const reviewerIds = [
    userMap.get("admin@slop.haus"),
    userMap.get("mod@slop.haus"),
  ].filter((id): id is string => Boolean(id));

  const revisions = buildProjectRevisions({
    seed: `${SEED_TOKEN}:revisions`,
    projectIds,
    reviewerIds: reviewerIds.length ? reviewerIds : userIds,
  });
  await seedProjectRevisions(db, revisions);

  const moderationEvents = buildModerationEvents({
    seed: `${SEED_TOKEN}:moderation`,
    projectIds,
    commentIds: comments.map((comment) => comment.id),
  });
  await seedModerationEvents(db, moderationEvents);

  const flags = buildFlags({
    seed: `${SEED_TOKEN}:flags`,
    projectIds,
    commentIds: comments.map((comment) => comment.id),
    userIds,
  });
  await seedFlags(db, flags);

  const drafts = buildEnrichmentDrafts({
    seed: `${SEED_TOKEN}:drafts`,
    userIds,
  });
  await seedEnrichmentDrafts(db, drafts);

  const counts = new Map<string, { likeCount: number; reviewCount: number; reviewScoreTotal: number; commentCount: number }>();
  for (const projectId of projectIds) {
    counts.set(projectId, { likeCount: 0, reviewCount: 0, reviewScoreTotal: 0, commentCount: 0 });
  }

  for (const like of projectLikes) {
    const entry = counts.get(like.projectId);
    if (!entry) continue;
    entry.likeCount += 1;
  }

  for (const comment of comments) {
    const entry = counts.get(comment.projectId);
    if (!entry) continue;
    entry.commentCount += 1;
    if (comment.reviewScore !== null && comment.reviewScore !== undefined) {
      entry.reviewCount += 1;
      entry.reviewScoreTotal += comment.reviewScore;
    }
  }

  const [{ count: nonSeedCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projects)
    .where(notInArray(projects.slug, seedSlugs));

  if (nonSeedCount > 0) {
    console.warn(
      `Skipping project count updates; found ${nonSeedCount} non-seed projects in the database.`
    );
  } else {
    await updateProjectCounts(db, counts);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log("Seed complete:");
  console.log(`- Projects: ${projectIds.length}`);
  console.log(`- Comments: ${comments.length}`);
  console.log(`- Likes: ${projectLikes.length}`);
  console.log(`- Favorites: ${favorites.length}`);
  console.log(`- Comment votes: ${commentVotes.length}`);
  console.log(`- Revisions: ${revisions.length}`);
  console.log(`- Moderation events: ${moderationEvents.length}`);
  console.log(`- Flags: ${flags.length}`);
  console.log(`- Drafts: ${drafts.length}`);
  console.log(`Done in ${elapsed}s.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
