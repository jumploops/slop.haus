import { Hono } from "hono";
import { db } from "@slop/db";
import { projects, projectLikes } from "@slop/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { likeSchema } from "@slop/shared";
import {
  getOrCreatePublicRater,
  getPublicRater,
  getDevRater,
} from "../lib/rater";
import { checkRateLimit, LIKE_RATE_LIMITS } from "../lib/rateLimit";
import { getSession } from "../middleware/auth";

const likeRoutes = new Hono();

// Like a project
likeRoutes.post("/:slug/like", async (c) => {
  const slug = c.req.param("slug");
  const body = await c.req.json();

  const parsed = likeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", details: parsed.error.issues },
      400
    );
  }

  const { value } = parsed.data;

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, slug));

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  const session = await getSession(c);
  const registeredUserId = session?.user.isAnonymous
    ? null
    : session?.user.id ?? null;
  const raterKeyHash = getOrCreatePublicRater(c);
  const raterType = session?.user.devVerified || getDevRater(c) ? "dev" : "public";

  const raterLimit = await checkRateLimit(
    `like:rater:${raterKeyHash}`,
    LIKE_RATE_LIMITS.perRater
  );
  if (!raterLimit.allowed) {
    return c.json(
      {
        error: "Too many likes. Please slow down.",
        code: "RATE_LIMITED",
        retryAfter: Math.ceil((raterLimit.resetAt - Date.now()) / 1000),
      },
      429
    );
  }

  const projectRaterLimit = await checkRateLimit(
    `like:project:${project.id}:${raterKeyHash}`,
    LIKE_RATE_LIMITS.perProjectRater
  );
  if (!projectRaterLimit.allowed) {
    return c.json(
      {
        error: "Too many like changes on this project. Please wait.",
        code: "RATE_LIMITED",
        retryAfter: Math.ceil((projectRaterLimit.resetAt - Date.now()) / 1000),
      },
      429
    );
  }

  await db.transaction(async (tx) => {
    const [existingLike] = await tx
      .select()
      .from(projectLikes)
      .where(
        and(
          eq(projectLikes.projectId, project.id),
          eq(projectLikes.raterKeyHash, raterKeyHash)
        )
      );

    if (value === 0) {
      if (existingLike) {
        await tx
          .delete(projectLikes)
          .where(eq(projectLikes.id, existingLike.id));

        await tx
          .update(projects)
          .set({ likeCount: sql`${projects.likeCount} - 1` })
          .where(eq(projects.id, project.id));
      }
      return;
    }

    if (!existingLike) {
      await tx.insert(projectLikes).values({
        projectId: project.id,
        userId: registeredUserId,
        raterType,
        raterKeyHash,
      });

      await tx
        .update(projects)
        .set({ likeCount: sql`${projects.likeCount} + 1` })
        .where(eq(projects.id, project.id));
    } else {
      const updates: Record<string, unknown> = {};
      if (existingLike.raterType !== raterType) {
        updates.raterType = raterType;
      }
      if (!existingLike.userId && registeredUserId) {
        updates.userId = registeredUserId;
      }
      if (Object.keys(updates).length > 0) {
        await tx
          .update(projectLikes)
          .set(updates)
          .where(eq(projectLikes.id, existingLike.id));
      }
    }
  });

  const [updated] = await db
    .select({ likeCount: projects.likeCount })
    .from(projects)
    .where(eq(projects.id, project.id));

  return c.json({
    success: true,
    likeCount: updated?.likeCount ?? 0,
  });
});

// Get like state for a project
likeRoutes.get("/:slug/like-state", async (c) => {
  const slug = c.req.param("slug");

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, slug));

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  const raterKeyHash = getPublicRater(c);
  if (!raterKeyHash) {
    return c.json({ liked: false });
  }

  const [existing] = await db
    .select({ id: projectLikes.id })
    .from(projectLikes)
    .where(
      and(
        eq(projectLikes.projectId, project.id),
        eq(projectLikes.raterKeyHash, raterKeyHash)
      )
    );

  return c.json({ liked: !!existing });
});

export { likeRoutes };
