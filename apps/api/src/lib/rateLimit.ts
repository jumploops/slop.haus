/**
 * Simple in-memory rate limiter for MVP
 * Replace with Redis-based solution for production
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Map of key -> rate limit entry
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request is allowed under the rate limit
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // No existing entry or expired
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Check if under limit
  if (entry.count < options.maxRequests) {
    entry.count++;
    return {
      allowed: true,
      remaining: options.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  // Rate limited
  return {
    allowed: false,
    remaining: 0,
    resetAt: entry.resetAt,
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
