# Phase 8: Polish & Production Readiness

## Status: Complete

## Goal

Add error handling, fallback options, cleanup jobs, rate limiting, and production hardening.

## Dependencies

- Phases 1-7 complete

## Tasks

### 8.1 Draft Cleanup Job

**File:** `apps/worker/src/handlers/cleanup-drafts.ts`

```typescript
import { db } from "@slop/db";
import { enrichmentDrafts } from "@slop/db/schema";
import { lt, and, inArray, isNull } from "drizzle-orm";

export async function handleCleanupDrafts(): Promise<void> {
  const now = new Date();

  // Soft-delete expired drafts (past expiresAt and not already deleted)
  const expiredResult = await db
    .update(enrichmentDrafts)
    .set({
      deletedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        lt(enrichmentDrafts.expiresAt, now),
        isNull(enrichmentDrafts.deletedAt)  // Not already deleted
      )
    )
    .returning({ id: enrichmentDrafts.id });

  console.log(`Soft-deleted ${expiredResult.length} expired drafts`);

  // Mark stale drafts as failed (stuck in scraping/analyzing for > 5 min)
  // These are NOT soft-deleted - user can still see and retry
  const staleThreshold = new Date(now.getTime() - 5 * 60 * 1000);

  const staleResult = await db
    .update(enrichmentDrafts)
    .set({
      status: "failed",
      error: "Analysis timed out",
      updatedAt: now,
    })
    .where(
      and(
        lt(enrichmentDrafts.updatedAt, staleThreshold),
        inArray(enrichmentDrafts.status, ["scraping", "analyzing"]),
        isNull(enrichmentDrafts.deletedAt)  // Not already deleted
      )
    )
    .returning({ id: enrichmentDrafts.id });

  console.log(`Marked ${staleResult.length} stale drafts as failed`);
}
```

### 8.2 Schedule Cleanup Job

**File:** `apps/worker/src/index.ts`

Add scheduled cleanup:

```typescript
import { handleCleanupDrafts } from "./handlers/cleanup-drafts";

// Run cleanup every hour
setInterval(async () => {
  try {
    await handleCleanupDrafts();
  } catch (error) {
    console.error("Cleanup job failed:", error);
  }
}, 60 * 60 * 1000);

// Also run on startup
handleCleanupDrafts().catch(console.error);
```

### 8.3 Improved Error Messages

**File:** `apps/web/src/lib/errors.ts`

```typescript
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Map API errors to user-friendly messages
    const message = error.message.toLowerCase();

    if (message.includes("rate limit")) {
      return "You've analyzed too many URLs recently. Please wait a bit and try again.";
    }
    if (message.includes("not found")) {
      return "We couldn't find that page. Please check the URL and try again.";
    }
    if (message.includes("timeout")) {
      return "The page took too long to load. Try again or use manual entry.";
    }
    if (message.includes("blocked") || message.includes("forbidden")) {
      return "This website doesn't allow automated access. Try manual entry instead.";
    }
    if (message.includes("github not linked")) {
      return "Please link your GitHub account to submit projects.";
    }
    if (message.includes("unauthorized")) {
      return "Please sign in to continue.";
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function getScrapeErrorRecovery(code: string): {
  message: string;
  action: "retry" | "manual" | "wait";
} {
  switch (code) {
    case "SCRAPE_FAILED":
      return {
        message: "We couldn't read that page.",
        action: "manual",
      };
    case "ANALYSIS_FAILED":
      return {
        message: "We couldn't extract project details.",
        action: "retry",
      };
    case "TIMEOUT":
      return {
        message: "Analysis took too long.",
        action: "retry",
      };
    case "RATE_LIMIT":
      return {
        message: "Too many requests.",
        action: "wait",
      };
    default:
      return {
        message: "Something went wrong.",
        action: "retry",
      };
  }
}
```

### 8.4 Enhanced Error UI

**File:** `apps/web/src/components/submit/AnalysisError.tsx`

```tsx
"use client";

import Link from "next/link";
import { getScrapeErrorRecovery } from "@/lib/errors";

interface AnalysisErrorProps {
  error: string;
  code?: string;
  onRetry: () => void;
  onManual: () => void;
}

export function AnalysisError({ error, code, onRetry, onManual }: AnalysisErrorProps) {
  const recovery = getScrapeErrorRecovery(code || "UNKNOWN");

  return (
    <div className="analysis-error">
      <div className="analysis-error-icon">
        <ErrorIcon />
      </div>

      <h2>Analysis Failed</h2>
      <p className="error-message">{error || recovery.message}</p>

      <div className="analysis-error-actions">
        {recovery.action === "retry" && (
          <button onClick={onRetry} className="btn btn-primary">
            Try Again
          </button>
        )}

        {recovery.action === "wait" && (
          <p className="text-muted">Please wait a few minutes before trying again.</p>
        )}

        <button onClick={onManual} className="btn btn-secondary">
          Enter Details Manually
        </button>
      </div>

      <div className="analysis-error-help">
        <p className="text-muted text-small">
          Having trouble?{" "}
          <Link href="https://github.com/your-repo/issues" target="_blank">
            Report an issue
          </Link>
        </p>
      </div>
    </div>
  );
}

function ErrorIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor">
      <circle cx="24" cy="24" r="20" strokeWidth="2" />
      <line x1="24" y1="14" x2="24" y2="26" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="32" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
```

### 8.5 Rate Limiting with Redis (Production)

**File:** `apps/api/src/lib/rate-limit.ts`

```typescript
import { Redis } from "ioredis";

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (!redis) {
    // Fallback to in-memory for development
    return { allowed: true, remaining: limit, resetAt: new Date() };
  }

  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `ratelimit:${key}`;

  // Remove old entries
  await redis.zremrangebyscore(redisKey, 0, windowStart);

  // Count current entries
  const count = await redis.zcard(redisKey);

  if (count >= limit) {
    // Get oldest entry to calculate reset time
    const oldest = await redis.zrange(redisKey, 0, 0, "WITHSCORES");
    const resetAt = oldest.length >= 2
      ? new Date(Number(oldest[1]) + windowMs)
      : new Date(now + windowMs);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Add new entry
  await redis.zadd(redisKey, now, `${now}`);
  await redis.pexpire(redisKey, windowMs);

  return {
    allowed: true,
    remaining: limit - count - 1,
    resetAt: new Date(now + windowMs),
  };
}
```

### 8.6 URL Blocklist

**File:** `packages/shared/src/url-blocklist.ts`

```typescript
const BLOCKED_DOMAINS = [
  // Shorteners (potential abuse)
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",

  // Adult content
  "pornhub.com",
  "xvideos.com",

  // Known spam/scam domains
  // Add as needed
];

const BLOCKED_PATTERNS = [
  /malware/i,
  /phishing/i,
  /hack.*tool/i,
];

export function isUrlBlocked(url: string): { blocked: boolean; reason?: string } {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    // Check domain blocklist
    for (const domain of BLOCKED_DOMAINS) {
      if (host === domain || host.endsWith(`.${domain}`)) {
        return { blocked: true, reason: "Domain not allowed" };
      }
    }

    // Check path patterns
    const fullUrl = url.toLowerCase();
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(fullUrl)) {
        return { blocked: true, reason: "URL pattern not allowed" };
      }
    }

    return { blocked: false };
  } catch {
    return { blocked: true, reason: "Invalid URL" };
  }
}
```

### 8.7 Retry Logic for Scraping

**File:** `apps/worker/src/handlers/scrape-url.ts`

Update to include better retry logic:

```typescript
// Add to existing handler
const MAX_SCRAPE_RETRIES = 2;

async function scrapeWithRetry(url: string, config: ScrapeConfig, attempt = 1): Promise<ScrapeResult> {
  try {
    const result = await scrape({ url, ...config });
    return result;
  } catch (error) {
    if (attempt < MAX_SCRAPE_RETRIES) {
      // Wait before retry (exponential backoff)
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      return scrapeWithRetry(url, config, attempt + 1);
    }
    throw error;
  }
}
```

### 8.8 Manual Entry Fallback

**File:** `apps/web/src/app/submit/manual/page.tsx`

Copy existing form-based submit page here. This preserves the old flow as a fallback.

Add a prominent link from the URL-first flow when analysis fails.

### 8.9 Monitoring & Logging

**File:** `apps/worker/src/lib/metrics.ts`

```typescript
interface AnalysisMetrics {
  draftId: string;
  urlType: string;
  scrapeTimeMs: number;
  analyzeTimeMs: number;
  success: boolean;
  errorCode?: string;
}

export function logAnalysisMetrics(metrics: AnalysisMetrics): void {
  // For now, just log to console
  // In production, send to metrics service (DataDog, etc.)
  console.log("METRICS:analysis", JSON.stringify(metrics));
}

// Track field edit rates to measure LLM accuracy
interface EditMetrics {
  draftId: string;
  fieldsEdited: string[];
  fieldCount: number;
}

export function logEditMetrics(metrics: EditMetrics): void {
  console.log("METRICS:edits", JSON.stringify(metrics));
}
```

### 8.10 Security Headers

**File:** `apps/api/src/middleware/security.ts`

```typescript
import { MiddlewareHandler } from "hono";

export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next();

  // Prevent content type sniffing
  c.header("X-Content-Type-Options", "nosniff");

  // XSS protection
  c.header("X-XSS-Protection", "1; mode=block");

  // Prevent framing (clickjacking)
  c.header("X-Frame-Options", "DENY");

  // Referrer policy
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
};
```

## Verification Checklist

### Error Handling
- [x] Scrape failures show user-friendly message
- [x] Analysis failures offer retry option
- [x] Rate limit errors show wait time
- [x] Network errors handled gracefully
- [x] Timeout errors trigger cleanup

### Fallbacks
- [x] Manual entry available at /submit/manual
- [x] Failed analysis links to manual entry
- [x] SSE failure falls back to polling

### Cleanup
- [x] Expired drafts soft-deleted automatically (deletedAt set)
- [x] Stale drafts marked as failed (but not deleted, user can retry)
- [x] Cleanup runs on schedule
- [x] Manual discard soft-deletes immediately

### Security
- [x] Internal IPs blocked (via validateUrl in url-detection.ts)
- [ ] URL shorteners blocked (deferred - basic validation sufficient for MVP)
- [x] Rate limiting enforced (in-memory, 5/hour)
- [x] Security headers set (via Hono secureHeaders middleware)

### Monitoring
- [x] Analysis timing logged (console.log)
- [x] Error codes tracked (via SSE events)
- [ ] Edit rates measurable (deferred for production)

## Files Changed

| File | Change |
|------|--------|
| `apps/worker/src/handlers/cleanup-drafts.ts` | NEW |
| `apps/worker/src/index.ts` | Schedule cleanup |
| `apps/web/src/lib/errors.ts` | NEW |
| `apps/web/src/components/submit/AnalysisError.tsx` | NEW |
| `apps/api/src/lib/rate-limit.ts` | NEW |
| `packages/shared/src/url-blocklist.ts` | NEW |
| `apps/worker/src/handlers/scrape-url.ts` | Add retry logic |
| `apps/web/src/app/submit/manual/page.tsx` | NEW (copy old form) |
| `apps/worker/src/lib/metrics.ts` | NEW |
| `apps/api/src/middleware/security.ts` | NEW |

## Production Checklist

- [ ] Redis configured for rate limiting
- [ ] Metrics endpoint configured
- [ ] Error tracking (Sentry) configured
- [ ] Storage bucket configured (S3/R2)
- [ ] CDN configured for screenshots
- [ ] Cleanup job verified in production logs
- [ ] Rate limits tested under load

## Notes

- Cleanup runs every hour (configurable)
- Stale draft threshold is 5 minutes
- Draft expiry is 24 hours
- Rate limit: 5 analyses per hour per user
- URL blocklist is minimal; expand as needed
- Metrics are console-logged for MVP; upgrade for production
- **Soft delete behavior:**
  - Auto-expire (24h): Sets `deletedAt`, draft no longer visible
  - Manual discard: Sets `deletedAt` immediately via DELETE endpoint
  - Stale (5min stuck): Sets status to "failed", does NOT delete (user can see error)
  - Soft-deleted drafts excluded from all queries via `WHERE deleted_at IS NULL`
