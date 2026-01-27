import { Hono } from "hono";
import { db } from "@slop/db";
import { comments, projects, user } from "@slop/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { createCommentSchema } from "@slop/shared";
import { computeHotScoreExpr } from "../lib/hotScore";

const MAX_DEPTH = 10;

const projectCommentRoutes = new Hono();

// List comments for a project
projectCommentRoutes.get("/:slug/comments", async (c) => {
  const slug = c.req.param("slug");

  // Get project
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, slug));

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  // Get all comments with authors
  const commentList = await db
    .select({
      id: comments.id,
      body: comments.body,
      parentCommentId: comments.parentCommentId,
      depth: comments.depth,
      reviewScore: comments.reviewScore,
      upvoteCount: comments.upvoteCount,
      status: comments.status,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      author: {
        id: user.id,
        name: user.name,
        image: user.image,
        devVerified: user.devVerified,
      },
    })
    .from(comments)
    .leftJoin(user, eq(comments.authorUserId, user.id))
    .where(eq(comments.projectId, project.id))
    .orderBy(comments.depth, comments.createdAt);

  // Filter out removed comments body but keep structure
  const result = commentList.map((comment) => ({
    ...comment,
    body: comment.status === "removed" ? "[removed]" : comment.body,
  }));

  return c.json({ comments: result });
});

// Create comment
projectCommentRoutes.post("/:slug/comments", requireAuth(), async (c) => {
  const session = c.get("session");
  const slug = c.req.param("slug");
  const body = await c.req.json();

  // Validate
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const { body: commentBody, parentCommentId, reviewScore } = parsed.data;

  // Get project
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, slug));

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  let depth = 0;

  // If replying to a parent, validate it
  if (parentCommentId) {
    const [parent] = await db
      .select({ id: comments.id, depth: comments.depth, projectId: comments.projectId })
      .from(comments)
      .where(eq(comments.id, parentCommentId));

    if (!parent) {
      return c.json({ error: "Parent comment not found" }, 404);
    }

    if (parent.projectId !== project.id) {
      return c.json({ error: "Parent comment belongs to different project" }, 400);
    }

    depth = parent.depth + 1;

    if (depth > MAX_DEPTH) {
      return c.json({ error: `Maximum comment depth (${MAX_DEPTH}) exceeded` }, 400);
    }
  }

  // Create comment and update count in transaction
  const [comment] = await db.transaction(async (tx) => {
    const [newComment] = await tx
      .insert(comments)
      .values({
        projectId: project.id,
        authorUserId: session.user.id,
        parentCommentId: parentCommentId || null,
        depth,
        body: commentBody,
        reviewScore: reviewScore ?? null,
      })
      .returning();

    const updates: Record<string, unknown> = {
      commentCount: sql`${projects.commentCount} + 1`,
    };

    if (!parentCommentId && reviewScore !== undefined) {
      updates.reviewCount = sql`${projects.reviewCount} + 1`;
      updates.reviewScoreTotal = sql`${projects.reviewScoreTotal} + ${reviewScore}`;
      const newSlopScore = sql`CASE WHEN (${projects.reviewCount} + 1) = 0 THEN 0 ELSE ((${projects.reviewScoreTotal} + ${reviewScore})::numeric / (${projects.reviewCount} + 1)) END`;
      updates.slopScore = newSlopScore;
      updates.hotScore = computeHotScoreExpr(newSlopScore);
    }

    await tx.update(projects).set(updates).where(eq(projects.id, project.id));

    return [newComment];
  });

  return c.json({
    comment: {
      ...comment,
      author: {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image,
        devVerified: session.user.devVerified,
      },
    },
  }, 201);
});

export { projectCommentRoutes };
