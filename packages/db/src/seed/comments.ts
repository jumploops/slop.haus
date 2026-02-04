import { comments } from "../schema";
import {
  createRng,
  insertInChunks,
  pick,
  randFloat,
  randInt,
  uuidFromSeed,
} from "./utils";

export type CommentRow = typeof comments.$inferInsert;

const reviewSnippets = [
  "Feels like a prototype that accidentally shipped.",
  "The vibe is strong but the UX stumbles.",
  "Honestly kind of charming once you get past the chaos.",
  "Fast, messy, and weirdly productive.",
  "Great concept, needs one more polish pass.",
  "The slop is intentional and it works.",
  "Could be tighter, but the idea is solid.",
  "Surprisingly useful for a weekend build.",
];

const replySnippets = [
  "Agree with this.",
  "I had the same experience.",
  "Not sure about that, but fair point.",
  "The vibe is everything here.",
  "It breaks sometimes but I still like it.",
];

export function buildComments(options: {
  seed: string;
  projectIds: string[];
  userIds: string[];
}): CommentRow[] {
  const rng = createRng(options.seed);
  const rows: CommentRow[] = [];

  for (const projectId of options.projectIds) {
    const rootCount = randInt(rng, 3, 8);
    const rootIds: string[] = [];

    for (let i = 0; i < rootCount; i += 1) {
      const id = uuidFromSeed(`comment:${projectId}:${i}`);
      rootIds.push(id);

      const statusRoll = rng();
      const status = statusRoll < 0.85 ? "visible" : statusRoll < 0.95 ? "hidden" : "removed";
      const reviewScore = rng() < 0.65 ? randInt(rng, 1, 5) : null;

      rows.push({
        id,
        projectId,
        authorUserId: pick(rng, options.userIds),
        parentCommentId: null,
        depth: 0,
        body: pick(rng, reviewSnippets),
        reviewScore,
        upvoteCount: Math.max(0, Math.round(randFloat(rng, 0, 12))),
        status,
      });

      const replyCount = rng() < 0.5 ? randInt(rng, 1, 3) : 0;
      for (let j = 0; j < replyCount; j += 1) {
        const replyId = uuidFromSeed(`comment:${projectId}:${i}:reply:${j}`);
        rows.push({
          id: replyId,
          projectId,
          authorUserId: pick(rng, options.userIds),
          parentCommentId: id,
          depth: 1,
          body: pick(rng, replySnippets),
          reviewScore: null,
          upvoteCount: Math.max(0, Math.round(randFloat(rng, 0, 6))),
          status: "visible",
        });
      }
    }

    if (rootIds.length && rng() < 0.25) {
      const parent = pick(rng, rootIds);
      const replyId = uuidFromSeed(`comment:${projectId}:${parent}:deep`);
      rows.push({
        id: replyId,
        projectId,
        authorUserId: pick(rng, options.userIds),
        parentCommentId: parent,
        depth: 2,
        body: pick(rng, replySnippets),
        reviewScore: null,
        upvoteCount: Math.max(0, Math.round(randFloat(rng, 0, 4))),
        status: "visible",
      });
    }
  }

  return rows;
}

export async function seedComments(db: any, rows: CommentRow[]): Promise<void> {
  await insertInChunks(db, comments, rows);
}
