/**
 * Postgres-backed rate limiter (simple fixed-window counters)
 * Switch to Redis if write throughput becomes an issue.
 */

import { db } from "@slop/db";
import { rateLimits } from "@slop/db/schema";
import { sql, lt } from "drizzle-orm";

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request is allowed under the rate limit
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const nowMs = Date.now();
  const windowStartMs = Math.floor(nowMs / options.windowMs) * options.windowMs;
  const windowStart = new Date(windowStartMs);
  const windowEndMs = windowStartMs + options.windowMs;

  // Best-effort cleanup of old windows (1% chance)
  if (Math.random() < 0.01) {
    const cutoff = new Date(nowMs - 2 * 24 * 60 * 60 * 1000);
    await db.delete(rateLimits).where(lt(rateLimits.windowStart, cutoff));
  }

  const [row] = await db
    .insert(rateLimits)
    .values({
      key,
      windowStart,
      count: 1,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.windowStart],
      set: {
        count: sql`${rateLimits.count} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({ count: rateLimits.count });

  const count = row?.count ?? 1;
  const remaining = Math.max(0, options.maxRequests - count);

  return {
    allowed: count <= options.maxRequests,
    remaining,
    resetAt: windowEndMs,
  };
}

// Preset rate limiters for likes
export const LIKE_RATE_LIMITS = {
  // Max 30 likes per minute per rater
  perRater: {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  // Max 10 like changes per hour per project+rater
  perProjectRater: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  },
};

// Preset rate limiters for comment upvotes
export const COMMENT_VOTE_RATE_LIMITS = {
  // Max 60 comment votes per minute per user
  perUser: {
    windowMs: 60 * 1000,
    maxRequests: 60,
  },
  // Max 20 vote changes per hour per comment+user
  perCommentUser: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
  },
};

// Preset rate limiters for draft analysis
export const DRAFT_ANALYSIS_RATE_LIMITS = {
  // Max 5 analyses per hour per user
  perUser: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
  },
};
