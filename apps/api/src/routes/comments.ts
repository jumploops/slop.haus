import { Hono } from "hono";
import { db } from "@slop/db";
import { comments, commentVotes, projects } from "@slop/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { commentVoteSchema, updateCommentSchema } from "@slop/shared";
import { checkRateLimit, COMMENT_VOTE_RATE_LIMITS } from "../lib/rateLimit";
import { computeHotScoreExpr } from "../lib/hotScore";

const commentRoutes = new Hono();

// Edit comment
commentRoutes.patch("/:id", requireAuth(), async (c) => {
  const session = c.get("session");
  const id = c.req.param("id");
  const body = await c.req.json();

  // Validate
  const parsed = updateCommentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  // Find comment
  const [existing] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, id));

  if (!existing) {
    return c.json({ error: "Comment not found" }, 404);
  }

  // Check ownership
  if (existing.authorUserId !== session.user.id && session.user.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Update
  const [updated] = await db
    .update(comments)
    .set({ body: parsed.data.body, updatedAt: new Date() })
    .where(eq(comments.id, id))
    .returning();

  return c.json({ comment: updated });
});

// Delete comment (soft delete)
commentRoutes.delete("/:id", requireAuth(), async (c) => {
  const session = c.get("session");
  const id = c.req.param("id");

  // Find comment
  const [existing] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, id));

  if (!existing) {
    return c.json({ error: "Comment not found" }, 404);
  }

  // Check ownership
  if (
    existing.authorUserId !== session.user.id &&
    session.user.role !== "admin" &&
    session.user.role !== "mod"
  ) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const isVisible = existing.status === "visible";
  const isReview =
    existing.parentCommentId === null && existing.reviewScore !== null;

  // Soft delete and decrement count
  await db.transaction(async (tx) => {
    await tx
      .update(comments)
      .set({ status: "removed", updatedAt: new Date() })
      .where(eq(comments.id, id));

    if (isVisible) {
      const updates: Record<string, unknown> = {
        commentCount: sql`${projects.commentCount} - 1`,
      };

      if (isReview) {
        updates.reviewCount = sql`${projects.reviewCount} - 1`;
        updates.reviewScoreTotal = sql`${projects.reviewScoreTotal} - ${existing.reviewScore}`;
        const newSlopScore = sql`CASE WHEN (${projects.reviewCount} - 1) <= 0 THEN 0 ELSE ((${projects.reviewScoreTotal} - ${existing.reviewScore})::numeric / (${projects.reviewCount} - 1)) END`;
        updates.slopScore = newSlopScore;
        updates.hotScore = computeHotScoreExpr(newSlopScore);
      }

      await tx.update(projects).set(updates).where(eq(projects.id, existing.projectId));
    }
  });

  return c.json({ success: true });
});

// Upvote comment (authenticated)
commentRoutes.post("/:id/vote", requireAuth(), async (c) => {
  const session = c.get("session");
  const id = c.req.param("id");
  const body = await c.req.json();

  const parsed = commentVoteSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const { value } = parsed.data;

  const [comment] = await db
    .select({ id: comments.id, status: comments.status })
    .from(comments)
    .where(eq(comments.id, id));

  if (!comment || comment.status !== "visible") {
    return c.json({ error: "Comment not found" }, 404);
  }

  const userLimit = await checkRateLimit(
    `comment-vote:user:${session.user.id}`,
    COMMENT_VOTE_RATE_LIMITS.perUser
  );
  if (!userLimit.allowed) {
    return c.json(
      {
        error: "Too many votes. Please slow down.",
        code: "RATE_LIMITED",
        retryAfter: Math.ceil((userLimit.resetAt - Date.now()) / 1000),
      },
      429
    );
  }

  const commentUserLimit = await checkRateLimit(
    `comment-vote:comment:${id}:${session.user.id}`,
    COMMENT_VOTE_RATE_LIMITS.perCommentUser
  );
  if (!commentUserLimit.allowed) {
    return c.json(
      {
        error: "Too many vote changes on this comment. Please wait.",
        code: "RATE_LIMITED",
        retryAfter: Math.ceil((commentUserLimit.resetAt - Date.now()) / 1000),
      },
      429
    );
  }

  await db.transaction(async (tx) => {
    const [existingVote] = await tx
      .select()
      .from(commentVotes)
      .where(
        and(
          eq(commentVotes.commentId, id),
          eq(commentVotes.userId, session.user.id)
        )
      );

    if (value === 0) {
      if (existingVote) {
        await tx
          .delete(commentVotes)
          .where(eq(commentVotes.id, existingVote.id));
        await tx
          .update(comments)
          .set({ upvoteCount: sql`${comments.upvoteCount} - 1` })
          .where(eq(comments.id, id));
      }
      return;
    }

    if (!existingVote) {
      await tx.insert(commentVotes).values({
        commentId: id,
        userId: session.user.id,
      });
      await tx
        .update(comments)
        .set({ upvoteCount: sql`${comments.upvoteCount} + 1` })
        .where(eq(comments.id, id));
    }
  });

  const [updated] = await db
    .select({ upvoteCount: comments.upvoteCount })
    .from(comments)
    .where(eq(comments.id, id));

  return c.json({
    success: true,
    upvoteCount: updated?.upvoteCount ?? 0,
  });
});

export { commentRoutes };
