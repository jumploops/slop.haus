import { Hono } from "hono";
import { db } from "@slop/db";
import {
  user,
  projects,
  projectRevisions,
  comments,
  flags,
  moderationEvents,
} from "@slop/db/schema";
import { eq, and, or, desc, sql, inArray } from "drizzle-orm";
import { requireAdmin, requireMod } from "../middleware/auth";

const adminRoutes = new Hono();

// Verify a developer (admin only)
// TODO: In production, implement GitHub-based verification (check repos, contributions, etc.)
adminRoutes.post("/verify-dev/:userId", requireAdmin(), async (c) => {
  const targetUserId = c.req.param("userId");

  // Find user
  const [targetUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, targetUserId));

  if (!targetUser) {
    return c.json({ error: "User not found" }, 404);
  }

  if (targetUser.devVerified) {
    return c.json({ success: true, message: "User already verified" });
  }

  // Verify user
  await db
    .update(user)
    .set({ devVerified: true, updatedAt: new Date() })
    .where(eq(user.id, targetUserId));

  return c.json({ success: true, message: "User verified as developer" });
});

// Unverify a developer (admin only)
adminRoutes.delete("/verify-dev/:userId", requireAdmin(), async (c) => {
  const targetUserId = c.req.param("userId");

  // Find user
  const [targetUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, targetUserId));

  if (!targetUser) {
    return c.json({ error: "User not found" }, 404);
  }

  if (!targetUser.devVerified) {
    return c.json({ success: true, message: "User not verified" });
  }

  // Remove verification
  await db
    .update(user)
    .set({ devVerified: false, updatedAt: new Date() })
    .where(eq(user.id, targetUserId));

  return c.json({ success: true, message: "Developer verification removed" });
});

// List all verified developers (admin only)
adminRoutes.get("/verified-devs", requireAdmin(), async (c) => {
  const devs = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.devVerified, true));

  return c.json({ developers: devs });
});

// ============ MOD QUEUE ============

// Get mod queue (admin/mod only)
adminRoutes.get("/mod-queue", requireMod(), async (c) => {
  const type = c.req.query("type"); // "project" | "comment" | undefined (all)

  // Get hidden projects with flag counts
  const hiddenProjects =
    !type || type === "project"
      ? await db
          .select({
            id: projects.id,
            slug: projects.slug,
            title: projects.title,
            tagline: projects.tagline,
            status: projects.status,
            createdAt: projects.createdAt,
            author: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
          })
          .from(projects)
          .leftJoin(user, eq(projects.authorUserId, user.id))
          .where(eq(projects.status, "hidden"))
          .orderBy(desc(projects.createdAt))
          .limit(50)
      : [];

  // Get hidden comments
  const hiddenComments =
    !type || type === "comment"
      ? await db
          .select({
            id: comments.id,
            projectId: comments.projectId,
            body: comments.body,
            status: comments.status,
            createdAt: comments.createdAt,
            author: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
          })
          .from(comments)
          .leftJoin(user, eq(comments.authorUserId, user.id))
          .where(eq(comments.status, "hidden"))
          .orderBy(desc(comments.createdAt))
          .limit(50)
      : [];

  // Get flag counts for each item
  const projectIds = hiddenProjects.map((p) => p.id);
  const commentIds = hiddenComments.map((c) => c.id);

  const projectFlags =
    projectIds.length > 0
      ? await db
          .select({
            targetId: flags.targetId,
            count: sql<number>`count(*)::int`,
            reasons: sql<string[]>`array_agg(distinct ${flags.reason})`,
          })
          .from(flags)
          .where(
            and(
              eq(flags.targetType, "project"),
              inArray(flags.targetId, projectIds)
            )
          )
          .groupBy(flags.targetId)
      : [];

  const commentFlags =
    commentIds.length > 0
      ? await db
          .select({
            targetId: flags.targetId,
            count: sql<number>`count(*)::int`,
            reasons: sql<string[]>`array_agg(distinct ${flags.reason})`,
          })
          .from(flags)
          .where(
            and(
              eq(flags.targetType, "comment"),
              inArray(flags.targetId, commentIds)
            )
          )
          .groupBy(flags.targetId)
      : [];

  // Get moderation events
  const projectModEvents =
    projectIds.length > 0
      ? await db
          .select()
          .from(moderationEvents)
          .where(
            and(
              eq(moderationEvents.targetType, "project"),
              inArray(moderationEvents.targetId, projectIds)
            )
          )
          .orderBy(desc(moderationEvents.createdAt))
      : [];

  // Build response
  const flagsByProject = new Map(projectFlags.map((f) => [f.targetId, f]));
  const flagsByComment = new Map(commentFlags.map((f) => [f.targetId, f]));
  const modEventsByProject = new Map<string, typeof projectModEvents>();
  for (const event of projectModEvents) {
    const existing = modEventsByProject.get(event.targetId) || [];
    existing.push(event);
    modEventsByProject.set(event.targetId, existing);
  }

  const queue = [
    ...hiddenProjects.map((p) => ({
      type: "project" as const,
      item: p,
      flags: flagsByProject.get(p.id) || { count: 0, reasons: [] },
      moderationEvents: modEventsByProject.get(p.id) || [],
    })),
    ...hiddenComments.map((c) => ({
      type: "comment" as const,
      item: c,
      flags: flagsByComment.get(c.id) || { count: 0, reasons: [] },
      moderationEvents: [],
    })),
  ];

  return c.json({ queue });
});

// ============ PROJECT MOD ACTIONS ============

// Approve project (publish)
adminRoutes.post("/projects/:id/approve", requireMod(), async (c) => {
  const projectId = c.req.param("id");

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  await db
    .update(projects)
    .set({ status: "published", updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  // Clear flags
  await db
    .delete(flags)
    .where(and(eq(flags.targetType, "project"), eq(flags.targetId, projectId)));

  return c.json({ success: true, message: "Project approved" });
});

// Hide project
adminRoutes.post("/projects/:id/hide", requireMod(), async (c) => {
  const projectId = c.req.param("id");

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  await db
    .update(projects)
    .set({ status: "hidden", updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  return c.json({ success: true, message: "Project hidden" });
});

// Remove project (permanent)
adminRoutes.post("/projects/:id/remove", requireAdmin(), async (c) => {
  const projectId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const reason = body.reason || "Removed by admin";

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  await db
    .update(projects)
    .set({ status: "removed", updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  // Log removal
  await db.insert(moderationEvents).values({
    targetType: "project",
    targetId: projectId,
    model: "manual",
    decision: "rejected",
    reason,
  });

  return c.json({ success: true, message: "Project removed" });
});

// ============ COMMENT MOD ACTIONS ============

// Approve comment
adminRoutes.post("/comments/:id/approve", requireMod(), async (c) => {
  const commentId = c.req.param("id");

  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId));

  if (!comment) {
    return c.json({ error: "Comment not found" }, 404);
  }

  await db
    .update(comments)
    .set({ status: "visible", updatedAt: new Date() })
    .where(eq(comments.id, commentId));

  // Clear flags
  await db
    .delete(flags)
    .where(and(eq(flags.targetType, "comment"), eq(flags.targetId, commentId)));

  return c.json({ success: true, message: "Comment approved" });
});

// Remove comment
adminRoutes.post("/comments/:id/remove", requireMod(), async (c) => {
  const commentId = c.req.param("id");

  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId));

  if (!comment) {
    return c.json({ error: "Comment not found" }, 404);
  }

  await db
    .update(comments)
    .set({ status: "removed", updatedAt: new Date() })
    .where(eq(comments.id, commentId));

  return c.json({ success: true, message: "Comment removed" });
});

// ============ REVISION REVIEW ============

// List pending revisions
adminRoutes.get("/revisions", requireMod(), async (c) => {
  const status = c.req.query("status") || "pending";

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
      submittedAt: projectRevisions.submittedAt,
      project: {
        id: projects.id,
        slug: projects.slug,
        title: projects.title,
        tagline: projects.tagline,
      },
      author: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
    .from(projectRevisions)
    .innerJoin(projects, eq(projectRevisions.projectId, projects.id))
    .leftJoin(user, eq(projects.authorUserId, user.id))
    .where(eq(projectRevisions.status, status as any))
    .orderBy(desc(projectRevisions.submittedAt))
    .limit(50);

  return c.json({ revisions });
});

// Approve revision
adminRoutes.post("/revisions/:id/approve", requireMod(), async (c) => {
  const session = c.get("session");
  const revisionId = c.req.param("id");

  const [revision] = await db
    .select()
    .from(projectRevisions)
    .where(eq(projectRevisions.id, revisionId));

  if (!revision) {
    return c.json({ error: "Revision not found" }, 404);
  }

  if (revision.status !== "pending") {
    return c.json({ error: "Revision already reviewed" }, 400);
  }

  // Apply changes to project
  const updates: Record<string, any> = {
    updatedAt: new Date(),
    lastEditedAt: new Date(),
  };

  if (revision.title) updates.title = revision.title;
  if (revision.tagline) updates.tagline = revision.tagline;
  if (revision.description !== null) updates.description = revision.description;
  if (revision.mainUrl !== null) updates.mainUrl = revision.mainUrl;
  if (revision.repoUrl !== null) updates.repoUrl = revision.repoUrl;
  if (revision.vibeMode) updates.vibeMode = revision.vibeMode;
  if (revision.vibePercent !== null) updates.vibePercent = revision.vibePercent;
  if (revision.vibeDetailsJson) updates.vibeDetailsJson = revision.vibeDetailsJson;

  await db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, revision.projectId));

  // Mark revision as approved
  await db
    .update(projectRevisions)
    .set({
      status: "approved",
      reviewedAt: new Date(),
      reviewerUserId: session.user.id,
    })
    .where(eq(projectRevisions.id, revisionId));

  return c.json({ success: true, message: "Revision approved and applied" });
});

// Reject revision
adminRoutes.post("/revisions/:id/reject", requireMod(), async (c) => {
  const session = c.get("session");
  const revisionId = c.req.param("id");

  const [revision] = await db
    .select()
    .from(projectRevisions)
    .where(eq(projectRevisions.id, revisionId));

  if (!revision) {
    return c.json({ error: "Revision not found" }, 404);
  }

  if (revision.status !== "pending") {
    return c.json({ error: "Revision already reviewed" }, 400);
  }

  // Mark revision as rejected
  await db
    .update(projectRevisions)
    .set({
      status: "rejected",
      reviewedAt: new Date(),
      reviewerUserId: session.user.id,
    })
    .where(eq(projectRevisions.id, revisionId));

  return c.json({ success: true, message: "Revision rejected" });
});

export { adminRoutes };
