import { Hono } from "hono";
import { db } from "@slop/db";
import { comments, projects } from "@slop/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { updateCommentSchema } from "@slop/shared";

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

  // Soft delete and decrement count
  await db.transaction(async (tx) => {
    await tx
      .update(comments)
      .set({ status: "removed", updatedAt: new Date() })
      .where(eq(comments.id, id));

    if (existing.status === "visible") {
      await tx
        .update(projects)
        .set({ commentCount: sql`${projects.commentCount} - 1` })
        .where(eq(projects.id, existing.projectId));
    }
  });

  return c.json({ success: true });
});

export { commentRoutes };
