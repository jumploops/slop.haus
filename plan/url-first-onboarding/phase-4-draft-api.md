# Phase 4: Draft API

## Status: ✅ Complete (2026-01-11)

**Implementation Notes:**
- Created `draftRoutes` with all 6 endpoints
- Added validation schemas to `@slop/shared/schemas.ts`
- Rate limiting (5/hour) uses in-memory Map
- All endpoints filter soft-deleted drafts (`deletedAt IS NULL`)
- Submit endpoint creates project, links tools, runs moderation
- Mounted routes at `/api/v1/drafts`

## Goal

Implement REST API endpoints for creating, reading, updating, and submitting drafts.

## Dependencies

- Phase 1 complete (database schema)
- Phase 2 complete (scrape job handler)
- Phase 3 complete (analyze job handler)

## Tasks

### 4.1 Create Drafts Router

**File:** `apps/api/src/routes/drafts.ts`

```typescript
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@slop/db";
import { enrichmentDrafts, projects, projectTools, tools } from "@slop/db/schema";
import { eq, and, isNull, inArray, desc } from "drizzle-orm";
import { requireAuth, requireGitHub } from "../middleware/auth";
import { createJob } from "../lib/jobs";
import { detectUrlType, validateUrl } from "@slop/shared";
import { moderateProject } from "../lib/moderation";
import { slugify } from "../lib/slugify";

const app = new Hono();

// Schema for analyze request
const analyzeSchema = z.object({
  url: z.string().url(),
});

// Schema for update request
const updateSchema = z.object({
  title: z.string().max(255).optional(),
  tagline: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  tools: z.array(z.string()).max(10).optional(),
  vibePercent: z.number().min(0).max(100).optional(),
  mainUrl: z.string().url().optional().nullable(),
  repoUrl: z.string().url().optional().nullable(),
});

// Schema for submit request
const submitSchema = z.object({
  vibeMode: z.enum(["overview", "detailed"]),
  vibeDetails: z.record(z.number()).optional(),
});

// Rate limiting: max 5 analyses per hour per user
const analysisLimits = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;

  const timestamps = analysisLimits.get(userId) || [];
  const recent = timestamps.filter((t) => t > hourAgo);

  if (recent.length >= 5) {
    return false;
  }

  recent.push(now);
  analysisLimits.set(userId, recent);
  return true;
}

// POST /api/v1/drafts/analyze - Start URL analysis
app.post("/analyze", requireGitHub(), async (c) => {
  const session = c.get("session");
  const body = await c.req.json();

  // Validate request
  const result = analyzeSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: "Invalid request", details: result.error.errors }, 400);
  }

  // Rate limit check
  if (!checkRateLimit(session.user.id)) {
    return c.json({ error: "Rate limit exceeded. Max 5 analyses per hour." }, 429);
  }

  // Validate URL
  const validation = validateUrl(result.data.url);
  if (!validation.valid) {
    return c.json({ error: validation.error }, 400);
  }

  // Detect URL type
  const detected = detectUrlType(validation.normalizedUrl!);

  // Create draft
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const [draft] = await db
    .insert(enrichmentDrafts)
    .values({
      userId: session.user.id,
      inputUrl: detected.canonicalUrl,
      detectedUrlType: detected.type,
      status: "pending",
      expiresAt,
    })
    .returning();

  // Queue scrape job
  await createJob("scrape_url", {
    draftId: draft.id,
    url: detected.canonicalUrl,
    urlType: detected.type,
  });

  return c.json(
    {
      draftId: draft.id,
      status: draft.status,
      detectedUrlType: detected.type,
    },
    202
  );
});

// GET /api/v1/drafts/:draftId - Get draft status and data
app.get("/:draftId", requireAuth(), async (c) => {
  const session = c.get("session");
  const draftId = c.req.param("draftId");

  const [draft] = await db
    .select()
    .from(enrichmentDrafts)
    .where(
      and(
        eq(enrichmentDrafts.id, draftId),
        eq(enrichmentDrafts.userId, session.user.id),
        isNull(enrichmentDrafts.deletedAt)  // Exclude soft-deleted
      )
    );

  if (!draft) {
    return c.json({ error: "Draft not found" }, 404);
  }

  // Format response based on status
  const response: Record<string, unknown> = {
    draftId: draft.id,
    status: draft.status,
    inputUrl: draft.inputUrl,
    detectedUrlType: draft.detectedUrlType,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };

  if (draft.status === "failed") {
    response.error = draft.error;
  }

  if (draft.status === "ready" || draft.status === "submitted") {
    response.screenshot = draft.screenshotUrl;
    response.suggested = {
      title: draft.suggestedTitle,
      tagline: draft.suggestedTagline,
      description: draft.suggestedDescription,
      tools: draft.suggestedTools || [],
      vibePercent: draft.suggestedVibePercent,
      mainUrl: draft.suggestedMainUrl,
      repoUrl: draft.suggestedRepoUrl,
    };
    response.final = {
      title: draft.finalTitle,
      tagline: draft.finalTagline,
      description: draft.finalDescription,
      tools: draft.finalTools,
      vibePercent: draft.finalVibePercent,
      mainUrl: draft.finalMainUrl,
      repoUrl: draft.finalRepoUrl,
    };
  }

  return c.json({ draft: response });
});

// PATCH /api/v1/drafts/:draftId - Update draft with user edits
app.patch("/:draftId", requireAuth(), async (c) => {
  const session = c.get("session");
  const draftId = c.req.param("draftId");
  const body = await c.req.json();

  // Validate request
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: "Invalid request", details: result.error.errors }, 400);
  }

  // Find draft
  const [draft] = await db
    .select()
    .from(enrichmentDrafts)
    .where(
      and(
        eq(enrichmentDrafts.id, draftId),
        eq(enrichmentDrafts.userId, session.user.id),
        isNull(enrichmentDrafts.deletedAt)  // Exclude soft-deleted
      )
    );

  if (!draft) {
    return c.json({ error: "Draft not found" }, 404);
  }

  if (draft.status !== "ready") {
    return c.json({ error: "Draft is not ready for editing" }, 400);
  }

  // Update final fields
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (result.data.title !== undefined) updates.finalTitle = result.data.title;
  if (result.data.tagline !== undefined) updates.finalTagline = result.data.tagline;
  if (result.data.description !== undefined) updates.finalDescription = result.data.description;
  if (result.data.tools !== undefined) updates.finalTools = result.data.tools;
  if (result.data.vibePercent !== undefined) updates.finalVibePercent = result.data.vibePercent;
  if (result.data.mainUrl !== undefined) updates.finalMainUrl = result.data.mainUrl;
  if (result.data.repoUrl !== undefined) updates.finalRepoUrl = result.data.repoUrl;

  await db
    .update(enrichmentDrafts)
    .set(updates)
    .where(eq(enrichmentDrafts.id, draftId));

  return c.json({ success: true });
});

// POST /api/v1/drafts/:draftId/submit - Convert draft to project
app.post("/:draftId/submit", requireGitHub(), async (c) => {
  const session = c.get("session");
  const draftId = c.req.param("draftId");
  const body = await c.req.json();

  // Validate request
  const result = submitSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: "Invalid request", details: result.error.errors }, 400);
  }

  // Find draft
  const [draft] = await db
    .select()
    .from(enrichmentDrafts)
    .where(
      and(
        eq(enrichmentDrafts.id, draftId),
        eq(enrichmentDrafts.userId, session.user.id),
        isNull(enrichmentDrafts.deletedAt)  // Exclude soft-deleted
      )
    );

  if (!draft) {
    return c.json({ error: "Draft not found" }, 404);
  }

  if (draft.status !== "ready") {
    return c.json({ error: "Draft is not ready for submission" }, 400);
  }

  // Resolve final values (prefer final, fallback to suggested)
  const title = draft.finalTitle || draft.suggestedTitle;
  const tagline = draft.finalTagline || draft.suggestedTagline;
  const description = draft.finalDescription || draft.suggestedDescription;
  const toolSlugs = (draft.finalTools || draft.suggestedTools || []) as string[];
  const vibePercent = draft.finalVibePercent ?? draft.suggestedVibePercent ?? 50;
  const mainUrl = draft.finalMainUrl ?? draft.suggestedMainUrl;
  const repoUrl = draft.finalRepoUrl ?? draft.suggestedRepoUrl;

  // Validate required fields
  if (!title || !tagline) {
    return c.json({ error: "Title and tagline are required" }, 400);
  }

  if (!mainUrl && !repoUrl) {
    return c.json({ error: "At least one URL (mainUrl or repoUrl) is required" }, 400);
  }

  // Calculate vibe percent for detailed mode
  let finalVibePercent = vibePercent;
  if (result.data.vibeMode === "detailed" && result.data.vibeDetails) {
    const values = Object.values(result.data.vibeDetails);
    finalVibePercent = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }

  // Generate unique slug
  const baseSlug = slugify(title);
  const existingSlugs = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(eq(projects.slug, baseSlug));

  let slug = baseSlug;
  if (existingSlugs.length > 0) {
    const count = existingSlugs.length + 1;
    slug = `${baseSlug}-${count}`;
  }

  // Create project
  const [project] = await db
    .insert(projects)
    .values({
      slug,
      authorUserId: session.user.id,
      title,
      tagline,
      description,
      mainUrl,
      repoUrl,
      vibeMode: result.data.vibeMode,
      vibePercent: finalVibePercent,
      vibeDetailsJson: result.data.vibeDetails || null,
      status: "published",
      enrichmentStatus: draft.screenshotUrl ? "completed" : "pending",
    })
    .returning();

  // Link tools
  if (toolSlugs.length > 0) {
    const toolRecords = await db
      .select({ id: tools.id, slug: tools.slug })
      .from(tools)
      .where(eq(tools.slug, toolSlugs[0])); // Simplified - should use IN

    // Actually query all tools
    const allToolRecords = await db
      .select({ id: tools.id, slug: tools.slug })
      .from(tools);

    const matchedTools = allToolRecords.filter((t) => toolSlugs.includes(t.slug));

    if (matchedTools.length > 0) {
      await db.insert(projectTools).values(
        matchedTools.map((tool) => ({
          projectId: project.id,
          toolId: tool.id,
        }))
      );
    }
  }

  // Run moderation
  const modResult = await moderateProject({
    title,
    tagline,
    description: description || undefined,
    mainUrl: mainUrl || undefined,
    repoUrl: repoUrl || undefined,
  });

  if (modResult.decision === "rejected" || modResult.decision === "hidden") {
    await db
      .update(projects)
      .set({ status: "hidden" })
      .where(eq(projects.id, project.id));

    // Still mark draft as submitted
    await db
      .update(enrichmentDrafts)
      .set({ status: "submitted", updatedAt: new Date() })
      .where(eq(enrichmentDrafts.id, draftId));

    return c.json(
      {
        project: { ...project, status: "hidden" },
        moderation: {
          decision: modResult.decision,
          reason: modResult.reason,
        },
      },
      201
    );
  }

  // Mark draft as submitted
  await db
    .update(enrichmentDrafts)
    .set({ status: "submitted", updatedAt: new Date() })
    .where(eq(enrichmentDrafts.id, draftId));

  // Queue enrichment jobs if needed
  if (!draft.screenshotUrl && mainUrl) {
    await createJob("enrich_screenshot", { projectId: project.id });
  }
  if (repoUrl) {
    await createJob("enrich_readme", { projectId: project.id });
  }

  return c.json({ project }, 201);
});

// GET /api/v1/drafts - List user's active drafts (for resuming)
app.get("/", requireAuth(), async (c) => {
  const session = c.get("session");

  const drafts = await db
    .select({
      id: enrichmentDrafts.id,
      inputUrl: enrichmentDrafts.inputUrl,
      detectedUrlType: enrichmentDrafts.detectedUrlType,
      status: enrichmentDrafts.status,
      suggestedTitle: enrichmentDrafts.suggestedTitle,
      screenshotUrl: enrichmentDrafts.screenshotUrl,
      createdAt: enrichmentDrafts.createdAt,
      updatedAt: enrichmentDrafts.updatedAt,
    })
    .from(enrichmentDrafts)
    .where(
      and(
        eq(enrichmentDrafts.userId, session.user.id),
        isNull(enrichmentDrafts.deletedAt),  // Exclude soft-deleted
        inArray(enrichmentDrafts.status, ["pending", "scraping", "analyzing", "ready"])
      )
    )
    .orderBy(desc(enrichmentDrafts.updatedAt))
    .limit(10);

  return c.json({ drafts });
});

// DELETE /api/v1/drafts/:draftId - Soft delete a draft (discard)
app.delete("/:draftId", requireAuth(), async (c) => {
  const session = c.get("session");
  const draftId = c.req.param("draftId");

  const result = await db
    .update(enrichmentDrafts)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(enrichmentDrafts.id, draftId),
        eq(enrichmentDrafts.userId, session.user.id),
        isNull(enrichmentDrafts.deletedAt)  // Can't delete twice
      )
    )
    .returning({ id: enrichmentDrafts.id });

  if (result.length === 0) {
    return c.json({ error: "Draft not found" }, 404);
  }

  return c.json({ success: true });
});

export default app;
```

### 4.2 Mount Router in API

**File:** `apps/api/src/index.ts`

```typescript
import drafts from "./routes/drafts";

// Add to route mounting
app.route("/api/v1/drafts", drafts);
```

### 4.3 Create Job Helper (if not exists)

**File:** `apps/api/src/lib/jobs.ts`

```typescript
import { db } from "@slop/db";
import { jobs } from "@slop/db/schema";

export async function createJob(
  type: string,
  payload: Record<string, unknown>
): Promise<string> {
  const [job] = await db
    .insert(jobs)
    .values({
      type,
      payload,
      status: "pending",
    })
    .returning({ id: jobs.id });

  return job.id;
}
```

### 4.4 Add Shared Exports to API

Ensure `@slop/shared` exports are available:

```typescript
// In apps/api/package.json, ensure dependency:
"@slop/shared": "workspace:*"
```

## API Reference

### GET /api/v1/drafts

List user's active (non-deleted) drafts for resuming.

**Auth:** Required

**Response:**
```json
{
  "drafts": [
    {
      "id": "uuid",
      "inputUrl": "https://github.com/user/project",
      "detectedUrlType": "github",
      "status": "ready",
      "suggestedTitle": "Project Name",
      "screenshotUrl": "https://...",
      "createdAt": "2026-01-10T...",
      "updatedAt": "2026-01-10T..."
    }
  ]
}
```

### POST /api/v1/drafts/analyze

Start URL analysis.

**Auth:** GitHub-linked account required

**Request:**
```json
{
  "url": "https://github.com/user/project"
}
```

**Response (202):**
```json
{
  "draftId": "uuid",
  "status": "pending",
  "detectedUrlType": "github"
}
```

**Errors:**
- `400` - Invalid URL
- `401` - Not authenticated
- `403` - GitHub not linked
- `429` - Rate limit exceeded

### GET /api/v1/drafts/:draftId

Get draft status and data.

**Auth:** Required (owner only)

**Response (ready):**
```json
{
  "draft": {
    "draftId": "uuid",
    "status": "ready",
    "inputUrl": "https://github.com/user/project",
    "detectedUrlType": "github",
    "screenshot": "https://...",
    "suggested": {
      "title": "Project Name",
      "tagline": "A great project",
      "description": "...",
      "tools": ["typescript", "react"],
      "vibePercent": 75,
      "mainUrl": null,
      "repoUrl": "https://github.com/user/project"
    },
    "final": {
      "title": null,
      "tagline": null,
      ...
    }
  }
}
```

### PATCH /api/v1/drafts/:draftId

Update draft with user edits.

**Auth:** Required (owner only)

**Request:**
```json
{
  "title": "My Custom Title",
  "tools": ["typescript"]
}
```

**Response:**
```json
{
  "success": true
}
```

### POST /api/v1/drafts/:draftId/submit

Convert draft to project.

**Auth:** GitHub-linked account required

**Request:**
```json
{
  "vibeMode": "overview"
}
```

**Response (201):**
```json
{
  "project": {
    "id": "uuid",
    "slug": "project-name",
    ...
  }
}
```

### DELETE /api/v1/drafts/:draftId

Soft delete (discard) a draft. Sets `deletedAt` timestamp.

**Auth:** Required (owner only)

**Response:**
```json
{
  "success": true
}
```

**Notes:**
- Draft is soft-deleted immediately (not hard deleted)
- Cannot delete an already-deleted draft (returns 404)
- Useful for: wrong URL entered, broken scrape, user wants to start over

## Verification

- [ ] GET / returns user's active drafts
- [ ] GET / excludes soft-deleted drafts
- [ ] GET / excludes submitted/failed/expired drafts
- [ ] POST /analyze creates draft and queues job
- [ ] GET /:id returns draft with correct status
- [ ] GET /:id returns 404 for soft-deleted drafts
- [ ] GET /:id returns 404 for other user's drafts
- [ ] PATCH /:id updates final fields
- [ ] PATCH /:id rejects non-ready drafts
- [ ] POST /:id/submit creates project from draft
- [ ] POST /:id/submit runs moderation
- [ ] POST /:id/submit handles tool linking
- [ ] DELETE /:id soft-deletes draft (sets deletedAt)
- [ ] DELETE /:id returns 404 for already-deleted draft
- [ ] Rate limiting enforced (5/hour)

## Files Changed

| File | Change |
|------|--------|
| `apps/api/src/routes/drafts.ts` | NEW |
| `apps/api/src/index.ts` | Mount router |
| `apps/api/src/lib/jobs.ts` | NEW (if not exists) |

## Notes

- Rate limiting uses in-memory map (replace with Redis for production)
- Draft ownership enforced on all endpoints
- Moderation runs synchronously on submit
- Screenshot from draft is reused (no re-scraping)
- Tool matching queries database on submit
- **Soft delete**: All queries filter `WHERE deleted_at IS NULL`
- **Resumability**: GET /drafts allows users to see and resume incomplete drafts
- **Manual discard**: DELETE sets `deletedAt` immediately for user-initiated cancellation
