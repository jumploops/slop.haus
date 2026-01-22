import { Hono } from "hono";
import { db } from "@slop/db";
import {
  projects,
  projectMedia,
  projectTools,
  projectRevisions,
  tools,
  user,
  jobs,
  moderationEvents,
} from "@slop/db/schema";
import { eq, desc, and, gte, sql, inArray, like } from "drizzle-orm";
import { requireAuth, requireGitHub, getSession } from "../middleware/auth";
import {
  createProjectSchema,
  updateProjectSchema,
  feedQuerySchema,
} from "@slop/shared";
import { slugify, generateUniqueSlug } from "@slop/shared";
import { moderateProject } from "../lib/moderation";
import { getStorage, generateStorageKey } from "../lib/storage";

const projectRoutes = new Hono();

// Helper: fetch complete project with author, media, and tools
async function fetchCompleteProject(projectId: string) {
  const [project] = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      title: projects.title,
      tagline: projects.tagline,
      description: projects.description,
      mainUrl: projects.mainUrl,
      repoUrl: projects.repoUrl,
      vibeMode: projects.vibeMode,
      vibePercent: projects.vibePercent,
      vibeDetailsJson: projects.vibeDetailsJson,
      likeCount: projects.likeCount,
      reviewCount: projects.reviewCount,
      reviewScoreTotal: projects.reviewScoreTotal,
      slopScore: sql<number>`${projects.slopScore}::float`,
      commentCount: projects.commentCount,
      status: projects.status,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      lastEditedAt: projects.lastEditedAt,
      authorUserId: projects.authorUserId,
      author: {
        id: user.id,
        name: user.name,
        image: user.image,
        devVerified: user.devVerified,
      },
    })
    .from(projects)
    .leftJoin(user, eq(projects.authorUserId, user.id))
    .where(eq(projects.id, projectId));

  if (!project) return null;

  // Get media
  const media = await db
    .select()
    .from(projectMedia)
    .where(eq(projectMedia.projectId, project.id));

  // Get tools
  const projectToolsList = await db
    .select({
      id: tools.id,
      name: tools.name,
      slug: tools.slug,
    })
    .from(projectTools)
    .innerJoin(tools, eq(projectTools.toolId, tools.id))
    .where(eq(projectTools.projectId, project.id));

  return {
    ...project,
    media,
    tools: projectToolsList,
  };
}

// Helper: compute hot score
function computeHotScore(score: number, createdAt: Date): number {
  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const gravity = 1.8;
  return score / Math.pow(ageHours + 2, gravity);
}

// Helper: get time window filter
function getTimeWindowFilter(window: string) {
  const now = new Date();
  switch (window) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

// List projects (feed)
projectRoutes.get("/", async (c) => {
  const query = feedQuerySchema.parse(c.req.query());
  const { sort, window, page, limit } = query;

  const offset = (page - 1) * limit;
  const timeFilter = getTimeWindowFilter(window);

  // Build where conditions
  const conditions = [eq(projects.status, "published")];
  if (timeFilter) {
    conditions.push(gte(projects.createdAt, timeFilter));
  }

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projects)
    .where(and(...conditions));

  // Get projects with author
  let orderBy;
  if (sort === "new") {
    orderBy = desc(projects.createdAt);
  } else if (sort === "top") {
    orderBy = desc(projects.slopScore);
  } else {
    // hot - we'll sort in memory after fetching
    orderBy = desc(projects.createdAt);
  }

  const projectList = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      title: projects.title,
      tagline: projects.tagline,
      mainUrl: projects.mainUrl,
      repoUrl: projects.repoUrl,
      vibePercent: projects.vibePercent,
      likeCount: projects.likeCount,
      reviewCount: projects.reviewCount,
      reviewScoreTotal: projects.reviewScoreTotal,
      slopScore: sql<number>`${projects.slopScore}::float`,
      commentCount: projects.commentCount,
      createdAt: projects.createdAt,
      author: {
        id: user.id,
        name: user.name,
        image: user.image,
        devVerified: user.devVerified,
      },
    })
    .from(projects)
    .leftJoin(user, eq(projects.authorUserId, user.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    // For hot sort, fetch more items to sort in memory
    // TODO: For production, precompute hot scores periodically and store in DB
    // This in-memory approach has a practical limit of ~50 pages (1000 items)
    .limit(sort === "hot" ? Math.max(1000, offset + limit) : limit)
    .offset(sort === "hot" ? 0 : offset);

  let result = projectList;

  // For hot sort, compute scores and re-sort
  if (sort === "hot") {
    const scored = projectList.map((p) => ({
      ...p,
      hotScore: computeHotScore(p.slopScore, p.createdAt),
    }));
    scored.sort((a, b) => b.hotScore - a.hotScore);
    result = scored.slice(offset, offset + limit);
  }

  // Get primary media for each project
  const projectIds = result.map((p) => p.id);
  const media =
    projectIds.length > 0
      ? await db
          .select()
          .from(projectMedia)
          .where(
            and(
              inArray(projectMedia.projectId, projectIds),
              eq(projectMedia.isPrimary, true)
            )
          )
      : [];

  const mediaByProject = new Map(media.map((m) => [m.projectId, m]));

  const projectsWithMedia = result.map((p) => ({
    ...p,
    primaryMedia: mediaByProject.get(p.id) || null,
  }));

  return c.json({
    projects: projectsWithMedia,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  });
});

// Get single project
projectRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const [project] = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      title: projects.title,
      tagline: projects.tagline,
      description: projects.description,
      mainUrl: projects.mainUrl,
      repoUrl: projects.repoUrl,
      vibeMode: projects.vibeMode,
      vibePercent: projects.vibePercent,
      vibeDetailsJson: projects.vibeDetailsJson,
      likeCount: projects.likeCount,
      reviewCount: projects.reviewCount,
      reviewScoreTotal: projects.reviewScoreTotal,
      slopScore: sql<number>`${projects.slopScore}::float`,
      commentCount: projects.commentCount,
      status: projects.status,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      lastEditedAt: projects.lastEditedAt,
      authorUserId: projects.authorUserId,
      author: {
        id: user.id,
        name: user.name,
        image: user.image,
        devVerified: user.devVerified,
      },
    })
    .from(projects)
    .leftJoin(user, eq(projects.authorUserId, user.id))
    .where(eq(projects.slug, slug));

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  // Get media
  const media = await db
    .select()
    .from(projectMedia)
    .where(eq(projectMedia.projectId, project.id));

  // Get tools
  const projectToolsList = await db
    .select({
      id: tools.id,
      name: tools.name,
      slug: tools.slug,
    })
    .from(projectTools)
    .innerJoin(tools, eq(projectTools.toolId, tools.id))
    .where(eq(projectTools.projectId, project.id));

  return c.json({
    project: {
      ...project,
      media,
      tools: projectToolsList,
    },
  });
});

// Create project
projectRoutes.post("/", requireGitHub(), async (c) => {
  const session = c.get("session");
  const body = await c.req.json();

  // Validate input
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const data = parsed.data;

  // Generate unique slug
  const baseSlug = slugify(data.title);
  const existingSlugs = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(like(projects.slug, `${baseSlug}%`));

  const slug = generateUniqueSlug(
    baseSlug,
    existingSlugs.map((s) => s.slug)
  );

  // Compute vibe percent if detailed mode
  let vibePercent = data.vibePercent ?? 0;
  if (data.vibeMode === "detailed" && data.vibeDetails) {
    const values = Object.values(data.vibeDetails);
    vibePercent = Math.round(
      values.reduce((a, b) => a + b, 0) / values.length
    );
  }

  // Create project
  const [project] = await db
    .insert(projects)
    .values({
      slug,
      authorUserId: session.user.id,
      title: data.title,
      tagline: data.tagline,
      description: data.description || null,
      mainUrl: data.mainUrl || null,
      repoUrl: data.repoUrl || null,
      vibeMode: data.vibeMode,
      vibePercent,
      vibeDetailsJson: data.vibeDetails || null,
    })
    .returning();

  // Link tools if provided
  if (data.tools && data.tools.length > 0) {
    const toolRecords = await db
      .select()
      .from(tools)
      .where(inArray(tools.slug, data.tools));

    if (toolRecords.length > 0) {
      await db.insert(projectTools).values(
        toolRecords.map((t) => ({
          projectId: project.id,
          toolId: t.id,
        }))
      );
    }
  }

  // Run synchronous moderation with confidence scoring
  const modResult = await moderateProject({
    id: project.id,
    title: data.title,
    tagline: data.tagline,
    description: data.description,
    mainUrl: data.mainUrl,
    repoUrl: data.repoUrl,
  });

  // Handle moderation decision
  if (modResult.decision === "rejected") {
    // Absolute confidence on serious label - remove immediately
    await db
      .update(projects)
      .set({ status: "removed", updatedAt: new Date() })
      .where(eq(projects.id, project.id));

    return c.json(
      {
        project: { ...project, status: "removed" },
        moderation: {
          approved: false,
          decision: modResult.decision,
          reason: modResult.reason || "Content rejected",
        },
      },
      201
    );
  }

  if (modResult.decision === "hidden") {
    // High confidence on serious label - hide for review
    await db
      .update(projects)
      .set({ status: "hidden", updatedAt: new Date() })
      .where(eq(projects.id, project.id));

    return c.json(
      {
        project: { ...project, status: "hidden" },
        moderation: {
          approved: false,
          decision: modResult.decision,
          reason: modResult.reason || "Content pending review",
        },
      },
      201
    );
  }

  // Create enrichment jobs for both URLs if they exist
  if (data.mainUrl) {
    await db.insert(jobs).values({
      type: "enrich_screenshot",
      payload: { projectId: project.id },
    });
  }
  if (data.repoUrl) {
    await db.insert(jobs).values({
      type: "enrich_readme",
      payload: { projectId: project.id },
    });
  }

  // For "approved" and "flagged" - project is published
  // "flagged" means it's published but queued for human review
  return c.json({
    project,
    moderation: modResult.decision === "flagged" ? {
      approved: true,
      decision: modResult.decision,
      reason: modResult.reason || "Content flagged for review",
    } : undefined,
  }, 201);
});

// Update project (creates revision for moderation)
projectRoutes.patch("/:slug", requireAuth(), async (c) => {
  const session = c.get("session");
  const slug = c.req.param("slug");
  const body = await c.req.json();

  // Find project
  const [existing] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug));

  if (!existing) {
    return c.json({ error: "Project not found" }, 404);
  }

  // Check ownership
  if (existing.authorUserId !== session.user.id && session.user.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Validate input
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const data = parsed.data;

  // Check for pending revision
  const [pendingRevision] = await db
    .select()
    .from(projectRevisions)
    .where(
      and(
        eq(projectRevisions.projectId, existing.id),
        eq(projectRevisions.status, "pending")
      )
    );

  if (pendingRevision) {
    return c.json(
      { error: "A revision is already pending review", revisionId: pendingRevision.id },
      409
    );
  }

  // Determine which fields were actually changed (sent in the request)
  const changedFields: string[] = [];
  if (data.title !== undefined) changedFields.push("title");
  if (data.tagline !== undefined) changedFields.push("tagline");
  if (data.description !== undefined) changedFields.push("description");
  if (data.mainUrl !== undefined) changedFields.push("mainUrl");
  if (data.repoUrl !== undefined) changedFields.push("repoUrl");
  if (data.vibeMode !== undefined) changedFields.push("vibeMode");
  if (data.vibePercent !== undefined) changedFields.push("vibePercent");
  if (data.vibeDetails !== undefined) changedFields.push("vibeDetails");
  if (data.tools !== undefined) changedFields.push("tools");

  // Create revision
  const [revision] = await db
    .insert(projectRevisions)
    .values({
      projectId: existing.id,
      title: data.title,
      tagline: data.tagline,
      description: data.description,
      mainUrl: data.mainUrl,
      repoUrl: data.repoUrl,
      vibeMode: data.vibeMode,
      vibePercent: data.vibePercent,
      vibeDetailsJson: data.vibeDetails,
      changedFields,
    })
    .returning();

  // Run moderation on changed text content
  const textContent = [
    data.title,
    data.tagline,
    data.description,
  ].filter(Boolean).join("\n\n");

  // Determine if we should auto-approve
  let shouldApprove = false;

  if (textContent) {
    // Text content changed - run moderation
    const modResult = await moderateProject({
      id: revision.id,
      title: data.title || existing.title,
      tagline: data.tagline || existing.tagline,
      description: data.description,
      mainUrl: data.mainUrl,
      repoUrl: data.repoUrl,
    });
    shouldApprove = modResult.approved;
  } else {
    // No text content changed (only tools, vibe, URLs, etc.)
    // Auto-approve since there's nothing to moderate
    shouldApprove = true;
  }

  if (shouldApprove) {
    // Apply changes immediately
    const updates: Record<string, any> = {
      updatedAt: new Date(),
      lastEditedAt: new Date(),
    };

    if (data.title !== undefined) updates.title = data.title;
    if (data.tagline !== undefined) updates.tagline = data.tagline;
    if (data.description !== undefined) updates.description = data.description;
    if (data.mainUrl !== undefined) updates.mainUrl = data.mainUrl;
    if (data.repoUrl !== undefined) updates.repoUrl = data.repoUrl;
    if (data.vibeMode !== undefined) updates.vibeMode = data.vibeMode;
    if (data.vibePercent !== undefined) updates.vibePercent = data.vibePercent;
    if (data.vibeDetails !== undefined) updates.vibeDetailsJson = data.vibeDetails;

    await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, existing.id));

    // Mark revision as approved
    await db
      .update(projectRevisions)
      .set({ status: "approved", reviewedAt: new Date() })
      .where(eq(projectRevisions.id, revision.id));

    // Handle tools update
    if (data.tools !== undefined) {
      await db.delete(projectTools).where(eq(projectTools.projectId, existing.id));
      if (data.tools.length > 0) {
        const toolRecords = await db
          .select()
          .from(tools)
          .where(inArray(tools.slug, data.tools));
        if (toolRecords.length > 0) {
          await db.insert(projectTools).values(
            toolRecords.map((t) => ({ projectId: existing.id, toolId: t.id }))
          );
        }
      }
    }

    // Fetch complete project with author, media, tools for response
    const completeProject = await fetchCompleteProject(existing.id);
    return c.json({ project: completeProject, revision: { ...revision, status: "approved" } });
  }

  // Moderation flagged - revision stays pending for human review
  const completeProject = await fetchCompleteProject(existing.id);
  return c.json({
    message: "Revision submitted for review",
    revision,
    project: completeProject,
  });
});

// Delete project (soft delete)
projectRoutes.delete("/:slug", requireAuth(), async (c) => {
  const session = c.get("session");
  const slug = c.req.param("slug");

  // Find project
  const [existing] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug));

  if (!existing) {
    return c.json({ error: "Project not found" }, 404);
  }

  // Check ownership
  if (existing.authorUserId !== session.user.id && session.user.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Soft delete
  await db
    .update(projects)
    .set({ status: "removed", updatedAt: new Date() })
    .where(eq(projects.id, existing.id));

  return c.json({ success: true });
});

// Re-enrich project (refresh screenshots/README)
projectRoutes.post("/:slug/refresh", requireAuth(), async (c) => {
  const session = c.get("session");
  const slug = c.req.param("slug");

  // Find project
  const [existing] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug));

  if (!existing) {
    return c.json({ error: "Project not found" }, 404);
  }

  // Check ownership
  if (existing.authorUserId !== session.user.id && session.user.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Check cooldown: max once per hour
  const lastJob = await db
    .select()
    .from(jobs)
    .where(
      and(
        sql`${jobs.payload}->>'projectId' = ${existing.id}`,
        gte(jobs.createdAt, new Date(Date.now() - 60 * 60 * 1000))
      )
    )
    .limit(1);

  if (lastJob.length > 0) {
    return c.json(
      { error: "Refresh already requested recently. Please wait an hour." },
      429
    );
  }

  // Create enrichment jobs for both URLs if they exist
  let jobsQueued = 0;
  if (existing.mainUrl) {
    await db.insert(jobs).values({
      type: "enrich_screenshot",
      payload: { projectId: existing.id },
    });
    jobsQueued++;
  }
  if (existing.repoUrl) {
    await db.insert(jobs).values({
      type: "enrich_readme",
      payload: { projectId: existing.id },
    });
    jobsQueued++;
  }
  if (jobsQueued === 0) {
    return c.json({ error: "Project has no URL to enrich" }, 400);
  }

  // Update enrichment status to pending
  await db
    .update(projects)
    .set({ enrichmentStatus: "pending", updatedAt: new Date() })
    .where(eq(projects.id, existing.id));

  return c.json({ success: true, message: "Enrichment job queued" });
});

// Upload custom screenshot
projectRoutes.post("/:slug/screenshot", requireAuth(), async (c) => {
  const session = c.get("session");
  const slug = c.req.param("slug");

  // Find project
  const [existing] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug));

  if (!existing) {
    return c.json({ error: "Project not found" }, 404);
  }

  // Check ownership
  if (existing.authorUserId !== session.user.id && session.user.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Parse multipart form
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: "File too large (max 5MB)" }, 400);
  }

  // Validate file type
  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "Invalid file type. Allowed: PNG, JPEG, WebP" }, 400);
  }

  // Get file extension from mime type
  const extensions: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };
  const ext = extensions[file.type] || "png";

  // Upload to storage
  const buffer = Buffer.from(await file.arrayBuffer());
  const storage = getStorage();
  const key = generateStorageKey("project-screenshots", ext);
  const url = await storage.upload(key, buffer, file.type);

  // Update projectMedia - set old screenshots as not primary
  await db
    .update(projectMedia)
    .set({ isPrimary: false })
    .where(
      and(eq(projectMedia.projectId, existing.id), eq(projectMedia.type, "screenshot"))
    );

  // Insert new screenshot as primary
  await db.insert(projectMedia).values({
    projectId: existing.id,
    type: "screenshot",
    url,
    source: "user_upload",
    isPrimary: true,
  });

  return c.json({ url });
});

// Get project revision history (author only)
projectRoutes.get("/:slug/revisions", requireAuth(), async (c) => {
  const session = c.get("session");
  const slug = c.req.param("slug");

  // Find project
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug));

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  // Check ownership (or admin)
  if (project.authorUserId !== session.user.id && session.user.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Get revisions with moderation reasons
  const revisions = await db
    .select({
      id: projectRevisions.id,
      projectId: projectRevisions.projectId,
      status: projectRevisions.status,
      title: projectRevisions.title,
      tagline: projectRevisions.tagline,
      description: projectRevisions.description,
      mainUrl: projectRevisions.mainUrl,
      repoUrl: projectRevisions.repoUrl,
      vibeMode: projectRevisions.vibeMode,
      vibePercent: projectRevisions.vibePercent,
      vibeDetailsJson: projectRevisions.vibeDetailsJson,
      changedFields: projectRevisions.changedFields,
      submittedAt: projectRevisions.submittedAt,
      reviewedAt: projectRevisions.reviewedAt,
      reason: moderationEvents.reason,
    })
    .from(projectRevisions)
    .leftJoin(
      moderationEvents,
      and(
        eq(moderationEvents.targetType, "revision"),
        eq(moderationEvents.targetId, projectRevisions.id)
      )
    )
    .where(eq(projectRevisions.projectId, project.id))
    .orderBy(desc(projectRevisions.submittedAt));

  return c.json({ revisions });
});

export { projectRoutes };
