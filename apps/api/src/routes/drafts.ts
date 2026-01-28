import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { db } from "@slop/db";
import {
  enrichmentDrafts,
  projects,
  projectTools,
  projectMedia,
  tools,
  jobs,
} from "@slop/db/schema";
import { eq, and, isNull, inArray, desc, like } from "drizzle-orm";
import { requireAuth, requireGitHub } from "../middleware/auth";
import { checkRateLimit, DRAFT_ANALYSIS_RATE_LIMITS } from "../lib/rateLimit";
import {
  detectUrlType,
  validateUrl,
  slugify,
  generateUniqueSlug,
  analyzeUrlSchema,
  updateDraftSchema,
  submitDraftSchema,
} from "@slop/shared";
import { moderateProject } from "../lib/moderation";

const draftRoutes = new Hono();

// Rate limiting: max 5 analyses per hour per user (Postgres-backed)

// GET /api/v1/drafts - List user's active drafts (for resuming)
draftRoutes.get("/", requireAuth(), async (c) => {
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
        isNull(enrichmentDrafts.deletedAt), // Exclude soft-deleted
        inArray(enrichmentDrafts.status, [
          "pending",
          "scraping",
          "analyzing",
          "ready",
        ])
      )
    )
    .orderBy(desc(enrichmentDrafts.updatedAt))
    .limit(10);

  return c.json({ drafts });
});

// POST /api/v1/drafts/analyze - Start URL analysis
draftRoutes.post("/analyze", requireGitHub(), async (c) => {
  const session = c.get("session");
  const body = await c.req.json();

  // Validate request
  const result = analyzeUrlSchema.safeParse(body);
  if (!result.success) {
    return c.json(
      { error: "Invalid request", details: result.error.errors },
      400
    );
  }

  // Rate limit check
  const rateLimit = await checkRateLimit(
    `draft-analysis:user:${session.user.id}`,
    DRAFT_ANALYSIS_RATE_LIMITS.perUser
  );
  if (!rateLimit.allowed) {
    return c.json(
      {
        error: "Rate limit exceeded. Max 5 analyses per hour.",
        code: "RATE_LIMITED",
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      },
      429
    );
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
  await db.insert(jobs).values({
    type: "scrape_url",
    payload: {
      draftId: draft.id,
      url: detected.canonicalUrl,
      urlType: detected.type,
    },
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
draftRoutes.get("/:draftId", requireAuth(), async (c) => {
  const session = c.get("session");
  const draftId = c.req.param("draftId");

  const [draft] = await db
    .select()
    .from(enrichmentDrafts)
    .where(
      and(
        eq(enrichmentDrafts.id, draftId),
        eq(enrichmentDrafts.userId, session.user.id),
        isNull(enrichmentDrafts.deletedAt) // Exclude soft-deleted
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
draftRoutes.patch("/:draftId", requireAuth(), async (c) => {
  const session = c.get("session");
  const draftId = c.req.param("draftId");
  const body = await c.req.json();

  // Validate request
  const result = updateDraftSchema.safeParse(body);
  if (!result.success) {
    return c.json(
      { error: "Invalid request", details: result.error.errors },
      400
    );
  }

  // Find draft
  const [draft] = await db
    .select()
    .from(enrichmentDrafts)
    .where(
      and(
        eq(enrichmentDrafts.id, draftId),
        eq(enrichmentDrafts.userId, session.user.id),
        isNull(enrichmentDrafts.deletedAt) // Exclude soft-deleted
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
  if (result.data.tagline !== undefined)
    updates.finalTagline = result.data.tagline;
  if (result.data.description !== undefined)
    updates.finalDescription = result.data.description;
  if (result.data.tools !== undefined) updates.finalTools = result.data.tools;
  if (result.data.vibePercent !== undefined)
    updates.finalVibePercent = result.data.vibePercent;
  if (result.data.mainUrl !== undefined)
    updates.finalMainUrl = result.data.mainUrl;
  if (result.data.repoUrl !== undefined)
    updates.finalRepoUrl = result.data.repoUrl;

  await db
    .update(enrichmentDrafts)
    .set(updates)
    .where(eq(enrichmentDrafts.id, draftId));

  return c.json({ success: true });
});

// POST /api/v1/drafts/:draftId/submit - Convert draft to project
draftRoutes.post("/:draftId/submit", requireGitHub(), async (c) => {
  const session = c.get("session");
  const draftId = c.req.param("draftId");
  const body = await c.req.json();

  // Validate request
  const result = submitDraftSchema.safeParse(body);
  if (!result.success) {
    return c.json(
      { error: "Invalid request", details: result.error.errors },
      400
    );
  }

  // Find draft
  const [draft] = await db
    .select()
    .from(enrichmentDrafts)
    .where(
      and(
        eq(enrichmentDrafts.id, draftId),
        eq(enrichmentDrafts.userId, session.user.id),
        isNull(enrichmentDrafts.deletedAt) // Exclude soft-deleted
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
    return c.json(
      { error: "At least one URL (mainUrl or repoUrl) is required" },
      400
    );
  }

  // Calculate vibe percent for detailed mode
  let finalVibePercent = vibePercent;
  if (result.data.vibeMode === "detailed" && result.data.vibeDetails) {
    const values = Object.values(result.data.vibeDetails);
    if (values.length > 0) {
      finalVibePercent = Math.round(
        values.reduce((a, b) => a + b, 0) / values.length
      );
    }
  }

  // Generate unique slug
  const baseSlug = slugify(title);
  const existingSlugs = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(like(projects.slug, `${baseSlug}%`));

  const slug = generateUniqueSlug(
    baseSlug,
    existingSlugs.map((s) => s.slug)
  );

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

  // Insert screenshot into projectMedia if we have one
  if (draft.screenshotUrl) {
    await db.insert(projectMedia).values({
      projectId: project.id,
      type: "screenshot",
      url: draft.screenshotUrl,
      source: "firecrawl",
      isPrimary: true,
    });
  }

  // Link tools
  if (toolSlugs.length > 0) {
    const toolRecords = await db
      .select({ id: tools.id, slug: tools.slug })
      .from(tools)
      .where(inArray(tools.slug, toolSlugs));

    if (toolRecords.length > 0) {
      await db.insert(projectTools).values(
        toolRecords.map((tool) => ({
          projectId: project.id,
          toolId: tool.id,
        }))
      );
    }
  }

  // Run moderation
  const modResult = await moderateProject({
    id: project.id,
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
    await db.insert(jobs).values({
      type: "enrich_screenshot",
      payload: { projectId: project.id },
    });
  }
  if (repoUrl) {
    await db.insert(jobs).values({
      type: "enrich_readme",
      payload: { projectId: project.id },
    });
  }

  return c.json({ project }, 201);
});

// Helper function for status messages
function getStatusMessage(status: string): string {
  switch (status) {
    case "pending":
      return "Starting analysis...";
    case "scraping":
      return "Fetching page content...";
    case "analyzing":
      return "Extracting project details...";
    case "ready":
      return "Analysis complete!";
    case "failed":
      return "Analysis failed";
    default:
      return "Processing...";
  }
}

// GET /api/v1/drafts/:draftId/events - SSE stream for progress
draftRoutes.get("/:draftId/events", requireAuth(), async (c) => {
  const session = c.get("session");
  const draftId = c.req.param("draftId");

  // Verify ownership
  const [draft] = await db
    .select()
    .from(enrichmentDrafts)
    .where(
      and(
        eq(enrichmentDrafts.id, draftId),
        eq(enrichmentDrafts.userId, session.user.id),
        isNull(enrichmentDrafts.deletedAt)
      )
    );

  if (!draft) {
    return c.json({ error: "Draft not found" }, 404);
  }

  return streamSSE(c, async (stream) => {
    let lastStatus = draft.status;
    let lastUpdatedAt = draft.updatedAt;
    let pollCount = 0;
    const maxPolls = 150; // 5 minutes max with adaptive polling
    let pollIntervalMs = 2000;
    const maxPollIntervalMs = 5000;

    // Send initial status
    await stream.writeSSE({
      event: "status",
      data: JSON.stringify({
        status: lastStatus,
        message: getStatusMessage(lastStatus),
      }),
    });

    // Poll for updates
    while (pollCount < maxPolls) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      pollCount++;

      // Check if client disconnected
      if (stream.aborted) {
        console.log(`SSE client disconnected for draft ${draftId}`);
        break;
      }

      const [currentDraft] = await db
        .select()
        .from(enrichmentDrafts)
        .where(eq(enrichmentDrafts.id, draftId));

      if (!currentDraft) {
        await stream.writeSSE({
          event: "error",
          data: JSON.stringify({
            error: "Draft not found",
            code: "DRAFT_NOT_FOUND",
          }),
        });
        break;
      }

      // Status or updatedAt changed
      if (
        currentDraft.status !== lastStatus ||
        (currentDraft.updatedAt && currentDraft.updatedAt.getTime() !== lastUpdatedAt?.getTime())
      ) {
        lastStatus = currentDraft.status;
        lastUpdatedAt = currentDraft.updatedAt;
        pollIntervalMs = 2000;

        if (lastStatus === "ready") {
          await stream.writeSSE({
            event: "complete",
            data: JSON.stringify({ draftId }),
          });
          break;
        }

        if (lastStatus === "failed") {
          await stream.writeSSE({
            event: "error",
            data: JSON.stringify({
              error: currentDraft.error || "Analysis failed",
              code: "ANALYSIS_FAILED",
            }),
          });
          break;
        }

        await stream.writeSSE({
          event: "status",
          data: JSON.stringify({
            status: lastStatus,
            message: getStatusMessage(lastStatus),
          }),
        });

        // Send progress event for step completion
        if (lastStatus === "analyzing") {
          await stream.writeSSE({
            event: "progress",
            data: JSON.stringify({
              step: "scraping",
              status: "completed",
            }),
          });
        }
      } else if (pollIntervalMs < maxPollIntervalMs) {
        pollIntervalMs = Math.min(maxPollIntervalMs, pollIntervalMs + 1000);
      }

      // Heartbeat every 15 seconds
      if (pollCount % 15 === 0) {
        await stream.writeSSE({
          event: "heartbeat",
          data: JSON.stringify({ timestamp: Date.now() }),
        });
      }
    }

    // Timeout
    if (pollCount >= maxPolls) {
      await stream.writeSSE({
        event: "error",
        data: JSON.stringify({
          error: "Analysis timed out",
          code: "TIMEOUT",
        }),
      });
    }
  });
});

// POST /api/v1/drafts/:draftId/retry - Retry a failed draft
draftRoutes.post("/:draftId/retry", requireAuth(), async (c) => {
  const session = c.get("session");
  const draftId = c.req.param("draftId");

  const [draft] = await db
    .select()
    .from(enrichmentDrafts)
    .where(
      and(
        eq(enrichmentDrafts.id, draftId),
        eq(enrichmentDrafts.userId, session.user.id),
        eq(enrichmentDrafts.status, "failed"),
        isNull(enrichmentDrafts.deletedAt)
      )
    );

  if (!draft) {
    return c.json({ error: "Draft not found or not in failed state" }, 404);
  }

  // Rate limit check for retry
  const retryLimit = await checkRateLimit(
    `draft-analysis:user:${session.user.id}`,
    DRAFT_ANALYSIS_RATE_LIMITS.perUser
  );
  if (!retryLimit.allowed) {
    return c.json(
      {
        error: "Rate limit exceeded. Max 5 analyses per hour.",
        code: "RATE_LIMITED",
        retryAfter: Math.ceil((retryLimit.resetAt - Date.now()) / 1000),
      },
      429
    );
  }

  // Reset draft and re-queue scrape job
  await db
    .update(enrichmentDrafts)
    .set({
      status: "pending",
      error: null,
      updatedAt: new Date(),
    })
    .where(eq(enrichmentDrafts.id, draftId));

  await db.insert(jobs).values({
    type: "scrape_url",
    payload: {
      draftId: draft.id,
      url: draft.inputUrl,
      urlType: draft.detectedUrlType,
    },
  });

  return c.json({ success: true, draftId: draft.id }, 202);
});

// DELETE /api/v1/drafts/:draftId - Soft delete a draft (discard)
draftRoutes.delete("/:draftId", requireAuth(), async (c) => {
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
        isNull(enrichmentDrafts.deletedAt) // Can't delete twice
      )
    )
    .returning({ id: enrichmentDrafts.id });

  if (result.length === 0) {
    return c.json({ error: "Draft not found" }, 404);
  }

  return c.json({ success: true });
});

export { draftRoutes };
