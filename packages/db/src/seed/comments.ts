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

const MIN_REVIEW_SCORE = 0;
const MAX_REVIEW_SCORE = 10;
const LOW_MAX_SCORE = 3;
const MID_MIN_SCORE = 4;
const MID_MAX_SCORE = 7;
const HIGH_MIN_SCORE = 8;

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

function clampReviewScore(value: number): number {
  if (value < MIN_REVIEW_SCORE) return MIN_REVIEW_SCORE;
  if (value > MAX_REVIEW_SCORE) return MAX_REVIEW_SCORE;
  return value;
}

function getScoreBoundsForTarget(targetScore: number): { minScore: number; maxScore: number } {
  if (targetScore >= HIGH_MIN_SCORE) {
    return { minScore: HIGH_MIN_SCORE, maxScore: MAX_REVIEW_SCORE };
  }
  if (targetScore >= MID_MIN_SCORE) {
    return { minScore: MID_MIN_SCORE, maxScore: MID_MAX_SCORE };
  }
  return { minScore: MIN_REVIEW_SCORE, maxScore: LOW_MAX_SCORE };
}

function buildReviewScores(options: {
  targetScore: number;
  reviewCount: number;
  rng: () => number;
}): number[] {
  const { targetScore, reviewCount, rng } = options;
  const normalizedTarget = clampReviewScore(targetScore);
  const { minScore, maxScore } = getScoreBoundsForTarget(normalizedTarget);

  const minTotal = minScore * reviewCount;
  const maxTotal = maxScore * reviewCount;
  const desiredTotal = Math.max(minTotal, Math.min(maxTotal, Math.round(normalizedTarget * reviewCount)));
  const scores = Array.from({ length: reviewCount }, () => minScore);

  let remaining = desiredTotal - minTotal;
  let attempts = 0;
  const maxAttempts = reviewCount * 100;

  while (remaining > 0 && attempts < maxAttempts) {
    const index = randInt(rng, 0, scores.length - 1);
    if (scores[index] >= maxScore) {
      attempts += 1;
      continue;
    }
    scores[index] += 1;
    remaining -= 1;
  }

  if (remaining > 0) {
    for (let index = 0; index < scores.length && remaining > 0; index += 1) {
      const room = maxScore - scores[index];
      if (room <= 0) continue;
      const delta = Math.min(room, remaining);
      scores[index] += delta;
      remaining -= delta;
    }
  }

  // Add controlled variance without changing each project's total score.
  const transferAttempts = reviewCount * 2;
  for (let attempt = 0; attempt < transferAttempts; attempt += 1) {
    const fromIndex = randInt(rng, 0, scores.length - 1);
    const toIndex = randInt(rng, 0, scores.length - 1);
    if (fromIndex === toIndex) continue;
    if (scores[fromIndex] <= minScore) continue;
    if (scores[toIndex] >= maxScore) continue;

    scores[fromIndex] -= 1;
    scores[toIndex] += 1;
  }

  return scores;
}

export function buildProjectReviewScoreTargets(options: {
  projectIds: string[];
  seed: string;
}): Map<string, number> {
  const { projectIds, seed } = options;
  if (!projectIds.length) return new Map();

  const rng = createRng(seed);
  const shuffledProjectIds = [...projectIds];
  for (let index = shuffledProjectIds.length - 1; index > 0; index -= 1) {
    const swapIndex = randInt(rng, 0, index);
    [shuffledProjectIds[index], shuffledProjectIds[swapIndex]] = [
      shuffledProjectIds[swapIndex],
      shuffledProjectIds[index],
    ];
  }

  const lowProjectIds: string[] = [];
  const midProjectIds: string[] = [];
  const highProjectIds: string[] = [];

  for (let index = 0; index < shuffledProjectIds.length; index += 1) {
    const bucket = index % 3;
    if (bucket === 0) {
      lowProjectIds.push(shuffledProjectIds[index]);
    } else if (bucket === 1) {
      midProjectIds.push(shuffledProjectIds[index]);
    } else {
      highProjectIds.push(shuffledProjectIds[index]);
    }
  }

  const targets = new Map<string, number>();

  function assignTargetsToBucket(projectIdsForBucket: string[], minScore: number, maxScore: number): void {
    for (let index = 0; index < projectIdsForBucket.length; index += 1) {
      const target =
        projectIdsForBucket.length === 1
          ? (minScore + maxScore) / 2
          : minScore + (index * (maxScore - minScore)) / (projectIdsForBucket.length - 1);
      targets.set(projectIdsForBucket[index], Number(target.toFixed(2)));
    }
  }

  assignTargetsToBucket(lowProjectIds, MIN_REVIEW_SCORE, LOW_MAX_SCORE);
  assignTargetsToBucket(midProjectIds, MID_MIN_SCORE, MID_MAX_SCORE);
  assignTargetsToBucket(highProjectIds, HIGH_MIN_SCORE, MAX_REVIEW_SCORE);

  return targets;
}

export function buildComments(options: {
  seed: string;
  projectIds: string[];
  userIds: string[];
  projectTargetScores?: Map<string, number>;
}): CommentRow[] {
  const rng = createRng(options.seed);
  const rows: CommentRow[] = [];

  for (const projectId of options.projectIds) {
    const rootCount = randInt(rng, 3, 8);
    const targetScore = options.projectTargetScores?.get(projectId) ?? randInt(rng, 0, 10);
    const reviewScores = buildReviewScores({
      targetScore,
      reviewCount: rootCount,
      rng,
    });
    const rootIds: string[] = [];

    for (let i = 0; i < rootCount; i += 1) {
      const id = uuidFromSeed(`comment:${projectId}:${i}`);
      rootIds.push(id);

      const statusRoll = rng();
      const status = statusRoll < 0.85 ? "visible" : statusRoll < 0.95 ? "hidden" : "removed";

      rows.push({
        id,
        projectId,
        authorUserId: pick(rng, options.userIds),
        parentCommentId: null,
        depth: 0,
        body: pick(rng, reviewSnippets),
        reviewScore: reviewScores[i],
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
