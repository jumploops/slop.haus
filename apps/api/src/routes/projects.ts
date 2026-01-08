import { Hono } from "hono";
import { db } from "@slop/db";
import {
  projects,
  projectMedia,
  projectTools,
  tools,
  user,
} from "@slop/db/schema";
import { eq, desc, and, gte, sql, inArray, like } from "drizzle-orm";
import { requireAuth, requireGitHub, getSession } from "../middleware/auth";
import {
  createProjectSchema,
  updateProjectSchema,
  feedQuerySchema,
} from "@slop/shared";
import { slugify, generateUniqueSlug } from "@slop/shared";

const projectRoutes = new Hono();

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
  const { sort, channel, window, page, limit } = query;

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
    orderBy =
      channel === "dev" ? desc(projects.devScore) : desc(projects.normalScore);
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
      normalUp: projects.normalUp,
      normalDown: projects.normalDown,
      normalScore: projects.normalScore,
      devUp: projects.devUp,
      devDown: projects.devDown,
      devScore: projects.devScore,
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
    .limit(sort === "hot" ? 200 : limit) // Fetch more for hot sorting
    .offset(sort === "hot" ? 0 : offset);

  let result = projectList;

  // For hot sort, compute scores and re-sort
  if (sort === "hot") {
    const scored = projectList.map((p) => ({
      ...p,
      hotScore: computeHotScore(
        channel === "dev" ? p.devScore : p.normalScore,
        p.createdAt
      ),
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
      normalUp: projects.normalUp,
      normalDown: projects.normalDown,
      normalScore: projects.normalScore,
      devUp: projects.devUp,
      devDown: projects.devDown,
      devScore: projects.devScore,
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

  return c.json({ project }, 201);
});

// Update project
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

  // Build update object
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

  // Update project
  const [updated] = await db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, existing.id))
    .returning();

  // Update tools if provided
  if (data.tools !== undefined) {
    // Remove existing
    await db.delete(projectTools).where(eq(projectTools.projectId, existing.id));

    // Add new
    if (data.tools.length > 0) {
      const toolRecords = await db
        .select()
        .from(tools)
        .where(inArray(tools.slug, data.tools));

      if (toolRecords.length > 0) {
        await db.insert(projectTools).values(
          toolRecords.map((t) => ({
            projectId: existing.id,
            toolId: t.id,
          }))
        );
      }
    }
  }

  return c.json({ project: updated });
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

export { projectRoutes };
