import { Hono } from "hono";
import { db } from "@slop/db";
import { flags, projects, comments } from "@slop/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const flagRoutes = new Hono();

const FLAG_THRESHOLD = 3; // Auto-hide after this many flags

// Flag content
flagRoutes.post("/", requireAuth(), async (c) => {
  const session = c.get("session");
  const body = await c.req.json();

  const { targetType, targetId, reason } = body;

  // Validate input
  if (!["project", "comment"].includes(targetType)) {
    return c.json({ error: "Invalid target type" }, 400);
  }

  if (!targetId || typeof targetId !== "string") {
    return c.json({ error: "Invalid target ID" }, 400);
  }

  const validReasons = ["nsfw", "spam", "harassment", "illegal", "other"];
  if (!validReasons.includes(reason)) {
    return c.json({ error: "Invalid reason" }, 400);
  }

  // Check target exists
  if (targetType === "project") {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, targetId));
    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }
  } else {
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, targetId));
    if (!comment) {
      return c.json({ error: "Comment not found" }, 404);
    }
  }

  // Check if already flagged by this user
  const [existing] = await db
    .select()
    .from(flags)
    .where(
      and(
        eq(flags.targetType, targetType),
        eq(flags.targetId, targetId),
        eq(flags.userId, session.user.id)
      )
    );

  if (existing) {
    return c.json({ error: "Already flagged" }, 409);
  }

  // Create flag
  const [flag] = await db
    .insert(flags)
    .values({
      targetType,
      targetId,
      userId: session.user.id,
      reason,
    })
    .returning();

  // Count total flags for this target
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(flags)
    .where(
      and(eq(flags.targetType, targetType), eq(flags.targetId, targetId))
    );

  // Auto-hide if threshold reached
  if (count >= FLAG_THRESHOLD) {
    if (targetType === "project") {
      await db
        .update(projects)
        .set({ status: "hidden", updatedAt: new Date() })
        .where(eq(projects.id, targetId));
    } else {
      await db
        .update(comments)
        .set({ status: "hidden", updatedAt: new Date() })
        .where(eq(comments.id, targetId));
    }
  }

  return c.json({
    flag,
    autoHidden: count >= FLAG_THRESHOLD,
    flagCount: count,
  });
});

export { flagRoutes };
