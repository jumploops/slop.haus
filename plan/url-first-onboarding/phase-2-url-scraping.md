# Phase 2: URL Scraping

## Status: ✅ Complete (2026-01-11)

**Implementation Notes:**
- Created `getScrapeConfig()` for URL type-specific Firecrawl configs
- Created `scrape_url` job handler that:
  - Fetches page content via Firecrawl
  - Downloads and saves screenshots to storage
  - Stores scraped content/metadata in draft
  - Queues `analyze_content` job on completion
- Registered handler in worker

## Goal

Implement URL detection logic and Firecrawl integration for different URL types.

## Dependencies

- Phase 1 complete (database schema, shared types)

## Tasks

### 2.1 URL Validation & Security

**File:** `packages/shared/src/url-validation.ts`

```typescript
const BLOCKED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
];

const BLOCKED_PATTERNS = [
  /^10\.\d+\.\d+\.\d+$/,      // 10.x.x.x
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/, // 172.16-31.x.x
  /^192\.168\.\d+\.\d+$/,     // 192.168.x.x
];

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  normalizedUrl?: string;
}

export function validateUrl(url: string): UrlValidationResult {
  // Check URL format
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  // Check protocol
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { valid: false, error: "Only HTTP/HTTPS URLs are allowed" };
  }

  // Check for blocked hosts
  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.includes(host)) {
    return { valid: false, error: "Internal URLs are not allowed" };
  }

  // Check for blocked IP patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(host)) {
      return { valid: false, error: "Private IP addresses are not allowed" };
    }
  }

  // Normalize URL
  const normalized = parsed.href.replace(/\/$/, "");

  return { valid: true, normalizedUrl: normalized };
}
```

### 2.2 Firecrawl Config by URL Type

**File:** `apps/worker/src/lib/scrape-configs.ts`

```typescript
import type { UrlType } from "@slop/shared";

export interface ScrapeConfig {
  formats: Array<string | { type: string; [key: string]: unknown }>;
  onlyMainContent: boolean;
  timeout: number;
  waitFor?: number;
}

export function getScrapeConfig(urlType: UrlType): ScrapeConfig {
  switch (urlType) {
    case "github":
    case "gitlab":
      return {
        formats: ["markdown"],
        onlyMainContent: false, // Need full page for metadata
        timeout: 30000,
      };

    case "npm":
    case "pypi":
      return {
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 30000,
      };

    case "chrome_webstore":
    case "steam":
      return {
        formats: [
          "markdown",
          {
            type: "screenshot",
            fullPage: false,
            viewport: { width: 1280, height: 800 },
          },
        ],
        onlyMainContent: true,
        timeout: 45000,
        waitFor: 2000, // Wait for dynamic content
      };

    case "live_site":
    default:
      return {
        formats: [
          "markdown",
          {
            type: "screenshot",
            fullPage: false,
            viewport: { width: 1280, height: 800 },
          },
        ],
        onlyMainContent: true,
        timeout: 60000,
      };
  }
}
```

### 2.3 Scrape URL Job Handler

**File:** `apps/worker/src/handlers/scrape-url.ts`

```typescript
import { db } from "@slop/db";
import { enrichmentDrafts } from "@slop/db/schema";
import { eq } from "drizzle-orm";
import { scrape } from "../lib/firecrawl";
import { getScrapeConfig } from "../lib/scrape-configs";
import { uploadBuffer, generateStorageKey } from "../lib/storage";
import { createJob } from "../lib/jobs";

interface ScrapeUrlPayload {
  draftId: string;
}

export async function handleScrapeUrl(payload: ScrapeUrlPayload): Promise<void> {
  const { draftId } = payload;

  // 1. Load draft
  const [draft] = await db
    .select()
    .from(enrichmentDrafts)
    .where(eq(enrichmentDrafts.id, draftId));

  if (!draft) {
    throw new Error(`Draft not found: ${draftId}`);
  }

  if (draft.status !== "pending" && draft.status !== "scraping") {
    console.log(`Draft ${draftId} not in scraping state, skipping`);
    return;
  }

  // 2. Update status to scraping
  await db
    .update(enrichmentDrafts)
    .set({ status: "scraping", updatedAt: new Date() })
    .where(eq(enrichmentDrafts.id, draftId));

  try {
    // 3. Get scrape config for URL type
    const config = getScrapeConfig(draft.detectedUrlType);

    // 4. Call Firecrawl
    const result = await scrape({
      url: draft.inputUrl,
      ...config,
    });

    if (!result.success) {
      throw new Error(result.error || "Scrape failed");
    }

    // 5. Handle screenshot if present
    let screenshotUrl: string | null = null;
    if (result.data?.screenshot) {
      // Firecrawl v2 returns URL, not base64
      const imageResponse = await fetch(result.data.screenshot);
      if (imageResponse.ok) {
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const key = generateStorageKey("draft-screenshots", "png");
        screenshotUrl = await uploadBuffer(key, imageBuffer, "image/png");
      }
    }

    // 6. Extract metadata
    const metadata = result.data?.metadata || {};
    const scrapedContent = {
      markdown: result.data?.markdown || null,
      links: result.data?.links || [],
    };

    // 7. Update draft with scraped data
    await db
      .update(enrichmentDrafts)
      .set({
        status: "analyzing",
        scrapedContent,
        scrapedMetadata: metadata,
        screenshotUrl,
        updatedAt: new Date(),
      })
      .where(eq(enrichmentDrafts.id, draftId));

    // 8. Queue analyze_content job
    await createJob("analyze_content", { draftId });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await db
      .update(enrichmentDrafts)
      .set({
        status: "failed",
        error: `Scrape failed: ${errorMessage}`,
        updatedAt: new Date(),
      })
      .where(eq(enrichmentDrafts.id, draftId));

    throw error; // Re-throw for job retry logic
  }
}
```

### 2.4 GitHub-Specific Metadata (Optional Enhancement)

**File:** `apps/worker/src/lib/github-api.ts`

```typescript
interface GitHubRepoInfo {
  name: string;
  description: string | null;
  homepage: string | null;
  topics: string[];
  language: string | null;
  languages: Record<string, number>;
}

export async function fetchGitHubRepoInfo(url: string): Promise<GitHubRepoInfo | null> {
  // Extract owner/repo from URL
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;

  const [, owner, repo] = match;
  const repoName = repo.replace(/\.git$/, "");

  try {
    // Note: This is unauthenticated, rate limited to 60 req/hour
    // For production, use GITHUB_TOKEN for higher limits
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          // Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    // Fetch languages
    const languagesResponse = await fetch(data.languages_url);
    const languages = languagesResponse.ok
      ? await languagesResponse.json()
      : {};

    return {
      name: data.name,
      description: data.description,
      homepage: data.homepage,
      topics: data.topics || [],
      language: data.language,
      languages,
    };
  } catch {
    return null;
  }
}
```

### 2.5 Register Handler in Worker

**File:** `apps/worker/src/index.ts`

Add to handler registration:

```typescript
import { handleScrapeUrl } from "./handlers/scrape-url";

// In the job type switch/map:
case "scrape_url":
  await handleScrapeUrl(job.payload);
  break;
```

### 2.6 Update Shared Exports

**File:** `packages/shared/src/index.ts`

```typescript
export * from "./url-validation";
```

## Verification

- [ ] `validateUrl()` blocks internal IPs and non-HTTP URLs
- [ ] `getScrapeConfig()` returns appropriate config for each URL type
- [ ] `handleScrapeUrl` successfully scrapes GitHub repo URL
- [ ] `handleScrapeUrl` successfully scrapes live site with screenshot
- [ ] Draft status transitions: `pending` → `scraping` → `analyzing`
- [ ] Failed scrapes set status to `failed` with error message
- [ ] Screenshot uploaded to storage when available

## Test Cases

```typescript
// URL Validation
validateUrl("https://github.com/user/repo") // valid
validateUrl("http://localhost:3000") // invalid - blocked host
validateUrl("file:///etc/passwd") // invalid - wrong protocol
validateUrl("https://10.0.0.1/admin") // invalid - private IP

// URL Detection
detectUrlType("https://github.com/user/repo") // github
detectUrlType("https://www.npmjs.com/package/foo") // npm
detectUrlType("https://example.com") // live_site

// Scrape Configs
getScrapeConfig("github") // markdown only, no screenshot
getScrapeConfig("live_site") // markdown + screenshot
```

## Files Changed

| File | Change |
|------|--------|
| `packages/shared/src/url-validation.ts` | NEW |
| `packages/shared/src/index.ts` | Add export |
| `apps/worker/src/lib/scrape-configs.ts` | NEW |
| `apps/worker/src/handlers/scrape-url.ts` | NEW |
| `apps/worker/src/lib/github-api.ts` | NEW (optional) |
| `apps/worker/src/index.ts` | Register handler |

## Notes

- GitHub API is rate limited (60 req/hour unauthenticated)
- For production, consider adding `GITHUB_TOKEN` for higher limits
- Screenshot storage uses same storage abstraction as existing enrichment
- Firecrawl timeout varies by URL type (30s for repos, 60s for live sites)
