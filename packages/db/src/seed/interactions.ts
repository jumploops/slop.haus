import { commentVotes, favorites, projectLikes, projectTools } from "../schema";
import {
  createRng,
  insertInChunks,
  pickMany,
  randInt,
  uuidFromSeed,
} from "./utils";

export type ProjectToolsRow = typeof projectTools.$inferInsert;
export type ProjectLikesRow = typeof projectLikes.$inferInsert;
export type FavoritesRow = typeof favorites.$inferInsert;
export type CommentVotesRow = typeof commentVotes.$inferInsert;

export function buildProjectTools(options: {
  seed: string;
  projectIds: string[];
  toolIds: string[];
}): ProjectToolsRow[] {
  const rng = createRng(options.seed);
  const rows: ProjectToolsRow[] = [];

  for (const projectId of options.projectIds) {
    const count = randInt(rng, 2, 5);
    const selected = pickMany(rng, options.toolIds, count);
    for (const toolId of selected) {
      rows.push({ projectId, toolId });
    }
  }

  return rows;
}

export function buildProjectLikes(options: {
  seed: string;
  projectIds: string[];
  userIds: string[];
}): ProjectLikesRow[] {
  const rng = createRng(options.seed);
  const rows: ProjectLikesRow[] = [];

  for (const projectId of options.projectIds) {
    const likeCount = randInt(rng, 3, 16);
    const devCount = Math.min(randInt(rng, 0, 4), likeCount, options.userIds.length);
    const devUsers = pickMany(rng, options.userIds, devCount);

    devUsers.forEach((userId) => {
      rows.push({
        projectId,
        userId,
        raterType: "dev",
        raterKeyHash: uuidFromSeed(`like:${projectId}:${userId}`),
      });
    });

    for (let i = 0; i < likeCount - devUsers.length; i += 1) {
      rows.push({
        projectId,
        userId: null,
        raterType: "public",
        raterKeyHash: uuidFromSeed(`like:${projectId}:public:${i}`),
      });
    }
  }

  return rows;
}

export function buildFavorites(options: {
  seed: string;
  projectIds: string[];
  userIds: string[];
}): FavoritesRow[] {
  const rng = createRng(options.seed);
  const rows: FavoritesRow[] = [];

  for (const userId of options.userIds) {
    if (rng() < 0.35) continue;
    const count = randInt(rng, 10, 30);
    const picks = pickMany(rng, options.projectIds, count);
    for (const projectId of picks) {
      rows.push({ userId, projectId });
    }
  }

  return rows;
}

export function buildCommentVotes(options: {
  seed: string;
  commentIds: string[];
  userIds: string[];
}): CommentVotesRow[] {
  const rng = createRng(options.seed);
  const rows: CommentVotesRow[] = [];

  for (const commentId of options.commentIds) {
    if (rng() < 0.6) continue;
    const count = randInt(rng, 1, 3);
    const voters = pickMany(rng, options.userIds, count);
    for (const userId of voters) {
      rows.push({ commentId, userId });
    }
  }

  return rows;
}

export async function seedProjectTools(db: any, rows: ProjectToolsRow[]): Promise<void> {
  await insertInChunks(db, projectTools, rows);
}

export async function seedProjectLikes(db: any, rows: ProjectLikesRow[]): Promise<void> {
  await insertInChunks(db, projectLikes, rows);
}

export async function seedFavorites(db: any, rows: FavoritesRow[]): Promise<void> {
  await insertInChunks(db, favorites, rows);
}

export async function seedCommentVotes(db: any, rows: CommentVotesRow[]): Promise<void> {
  await insertInChunks(db, commentVotes, rows);
}
