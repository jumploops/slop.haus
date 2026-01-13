# Phase 1: Database & Types

## Status: ✅ Complete (2026-01-11)

**Implementation Notes:**
- Created `enrichment_drafts` table with soft delete support (`deleted_at`)
- Created `draft_status` and `url_type` enums
- Added URL detection (`detectUrlType`) and validation (`validateUrl`) functions
- Added comprehensive TypeScript types for drafts and API responses
- Schema pushed successfully with `pnpm db:push`

## Goal

Create the database schema for storing draft submissions and define shared TypeScript types for the URL-first flow.

## Tasks

### 1.1 Create Enrichment Drafts Schema

**File:** `packages/db/src/schema/enrichment-drafts.ts`

```typescript
import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const draftStatusEnum = pgEnum("draft_status", [
  "pending",      // Just created, waiting for scrape
  "scraping",     // Firecrawl in progress
  "analyzing",    // LLM extraction in progress
  "ready",        // Ready for user review
  "submitted",    // Converted to project
  "failed",       // Unrecoverable error
  "expired",      // Past 24h, cleaned up
]);

export const urlTypeEnum = pgEnum("url_type", [
  "github",
  "gitlab",
  "npm",
  "pypi",
  "chrome_webstore",
  "steam",
  "live_site",
]);

export const enrichmentDrafts = pgTable("enrichment_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),

  // Input
  inputUrl: text("input_url").notNull(),
  detectedUrlType: urlTypeEnum("detected_url_type").notNull(),

  // Scraped Data (raw from Firecrawl)
  scrapedContent: jsonb("scraped_content"),  // { markdown, html, metadata }
  scrapedMetadata: jsonb("scraped_metadata"), // { title, description, ogImage, ... }
  screenshotUrl: text("screenshot_url"),      // Temporary storage URL

  // LLM Extracted Fields (suggested values)
  suggestedTitle: varchar("suggested_title", { length: 255 }),
  suggestedTagline: varchar("suggested_tagline", { length: 500 }),
  suggestedDescription: text("suggested_description"),
  suggestedTools: jsonb("suggested_tools").$type<string[]>(),
  suggestedVibePercent: integer("suggested_vibe_percent"),
  suggestedMainUrl: text("suggested_main_url"),
  suggestedRepoUrl: text("suggested_repo_url"),

  // User Edits (final values before submit, null = use suggested)
  finalTitle: varchar("final_title", { length: 255 }),
  finalTagline: varchar("final_tagline", { length: 500 }),
  finalDescription: text("final_description"),
  finalTools: jsonb("final_tools").$type<string[]>(),
  finalVibePercent: integer("final_vibe_percent"),
  finalMainUrl: text("final_main_url"),
  finalRepoUrl: text("final_repo_url"),

  // Status & Error
  status: draftStatusEnum("status").notNull().default("pending"),
  error: text("error"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),  // Set to createdAt + 24h
  deletedAt: timestamp("deleted_at"),  // Soft delete timestamp
});
```

### 1.2 Add New Job Types

**File:** `packages/db/src/schema/jobs.ts`

Update the job type handling to include new types:

```typescript
// Add to existing job type comments/documentation:
// Job types:
// - enrich_screenshot: Capture screenshot for project mainUrl
// - enrich_readme: Extract README from project repoUrl
// - moderate_async: Run moderation on enriched content
// - scrape_url: NEW - Scrape URL for draft analysis
// - analyze_content: NEW - LLM extraction for draft
// - cleanup_drafts: NEW - Remove expired drafts
```

No schema change needed since `type` is `varchar(100)`, but document the new types.

### 1.3 Create Shared Types

**File:** `packages/shared/src/url-detection.ts`

```typescript
export const URL_TYPES = [
  "github",
  "gitlab",
  "npm",
  "pypi",
  "chrome_webstore",
  "steam",
  "live_site",
] as const;

export type UrlType = typeof URL_TYPES[number];

export interface DetectedUrl {
  type: UrlType;
  originalUrl: string;
  canonicalUrl: string;
  isRepo: boolean;
  isStorefront: boolean;
}

export function detectUrlType(url: string): DetectedUrl {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

  if (host === "github.com") {
    return {
      type: "github",
      originalUrl: url,
      canonicalUrl: url.split("?")[0].replace(/\/$/, ""),
      isRepo: true,
      isStorefront: false,
    };
  }

  if (host === "gitlab.com") {
    return {
      type: "gitlab",
      originalUrl: url,
      canonicalUrl: url.split("?")[0].replace(/\/$/, ""),
      isRepo: true,
      isStorefront: false,
    };
  }

  if (host === "npmjs.com" || host === "npm.im") {
    return {
      type: "npm",
      originalUrl: url,
      canonicalUrl: url.split("?")[0].replace(/\/$/, ""),
      isRepo: true,
      isStorefront: false,
    };
  }

  if (host === "pypi.org") {
    return {
      type: "pypi",
      originalUrl: url,
      canonicalUrl: url.split("?")[0].replace(/\/$/, ""),
      isRepo: true,
      isStorefront: false,
    };
  }

  if (host === "chrome.google.com" && parsed.pathname.includes("/webstore/")) {
    return {
      type: "chrome_webstore",
      originalUrl: url,
      canonicalUrl: url,
      isRepo: false,
      isStorefront: true,
    };
  }

  if (host === "store.steampowered.com") {
    return {
      type: "steam",
      originalUrl: url,
      canonicalUrl: url,
      isRepo: false,
      isStorefront: true,
    };
  }

  return {
    type: "live_site",
    originalUrl: url,
    canonicalUrl: url.split("?")[0].replace(/\/$/, ""),
    isRepo: false,
    isStorefront: false,
  };
}
```

**File:** `packages/shared/src/draft-types.ts`

```typescript
import type { UrlType } from "./url-detection";

export const DRAFT_STATUSES = [
  "pending",
  "scraping",
  "analyzing",
  "ready",
  "submitted",
  "failed",
  "expired",
] as const;

export type DraftStatus = typeof DRAFT_STATUSES[number];

export interface DraftSuggested {
  title: string | null;
  tagline: string | null;
  description: string | null;
  tools: string[];
  vibePercent: number | null;
  mainUrl: string | null;
  repoUrl: string | null;
}

export interface DraftFinal {
  title: string | null;
  tagline: string | null;
  description: string | null;
  tools: string[];
  vibePercent: number | null;
  mainUrl: string | null;
  repoUrl: string | null;
}

export interface EnrichmentDraft {
  id: string;
  userId: string;
  inputUrl: string;
  detectedUrlType: UrlType;
  screenshotUrl: string | null;
  suggested: DraftSuggested;
  final: DraftFinal;
  status: DraftStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

// API Request/Response types
export interface AnalyzeUrlRequest {
  url: string;
}

export interface AnalyzeUrlResponse {
  draftId: string;
  status: DraftStatus;
  detectedUrlType: UrlType;
}

export interface DraftResponse {
  draft: EnrichmentDraft;
}

export interface UpdateDraftRequest {
  title?: string;
  tagline?: string;
  description?: string;
  tools?: string[];
  vibePercent?: number;
  mainUrl?: string;
  repoUrl?: string;
}

export interface SubmitDraftRequest {
  vibeMode: "overview" | "detailed";
  vibeDetails?: Record<string, number>;
}

// SSE Event types
export interface DraftProgressEvent {
  type: "status" | "progress" | "complete" | "error";
  data: {
    status?: DraftStatus;
    message?: string;
    step?: string;
    draftId?: string;
    error?: string;
    code?: string;
  };
}
```

### 1.4 Export from Shared Package

**File:** `packages/shared/src/index.ts`

Add exports:
```typescript
export * from "./url-detection";
export * from "./draft-types";
```

### 1.5 Export from DB Package

**File:** `packages/db/src/schema/index.ts`

Add:
```typescript
export * from "./enrichment-drafts";
```

### 1.6 Create Migration

Run Drizzle to generate migration:

```bash
pnpm --filter @slop/db db:generate
```

This will create the migration file in `packages/db/drizzle/`.

### 1.7 Apply Migration

```bash
pnpm db:push
```

## Verification

- [ ] `enrichment_drafts` table exists in database
- [ ] Enum types `draft_status` and `url_type` created
- [ ] `detectUrlType()` correctly identifies GitHub, GitLab, npm, etc.
- [ ] Types exported from `@slop/shared`
- [ ] Schema exported from `@slop/db`

## Files Changed

| File | Change |
|------|--------|
| `packages/db/src/schema/enrichment-drafts.ts` | NEW |
| `packages/db/src/schema/index.ts` | Add export |
| `packages/shared/src/url-detection.ts` | NEW |
| `packages/shared/src/draft-types.ts` | NEW |
| `packages/shared/src/index.ts` | Add exports |
| `packages/db/drizzle/*.sql` | Migration (auto-generated) |

## Notes

- Draft expiry is 24 hours from creation
- `final_*` columns are null by default; null means "use suggested value"
- `scraped_content` stores raw Firecrawl response for debugging
- Indexes on `user_id`, `status`, `expires_at`, `deleted_at` for efficient queries
- **Soft delete**: `deletedAt` is set instead of removing rows
  - Manual discard: `deletedAt` set immediately
  - Auto-expire: `deletedAt` set after 24 hours
  - All queries should filter `WHERE deleted_at IS NULL`
