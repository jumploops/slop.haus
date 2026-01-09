import { Hono } from "hono";
import { db } from "@slop/db";
import { favorites, projects, user } from "@slop/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const favoriteRoutes = new Hono();

// Add project to favorites
favoriteRoutes.post("/:slug/favorite", requireAuth(), async (c) => {
  const session = c.get("session");
  const slug = c.req.param("slug");

  // Get project
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, slug));

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  // Check if already favorited
  const [existing] = await db
    .select()
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, session.user.id),
        eq(favorites.projectId, project.id)
      )
    );

  if (existing) {
    return c.json({ success: true, message: "Already favorited" });
  }

  // Add to favorites
  await db.insert(favorites).values({
    userId: session.user.id,
    projectId: project.id,
  });

  return c.json({ success: true, message: "Added to favorites" }, 201);
});

// Remove project from favorites
favoriteRoutes.delete("/:slug/favorite", requireAuth(), async (c) => {
  const session = c.get("session");
  const slug = c.req.param("slug");

  // Get project
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, slug));

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  // Remove from favorites
  await db
    .delete(favorites)
    .where(
      and(
        eq(favorites.userId, session.user.id),
        eq(favorites.projectId, project.id)
      )
    );

  return c.json({ success: true, message: "Removed from favorites" });
});

// Check if project is favorited
favoriteRoutes.get("/:slug/favorite", requireAuth(), async (c) => {
  const session = c.get("session");
  const slug = c.req.param("slug");

  // Get project
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, slug));

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  // Check if favorited
  const [existing] = await db
    .select()
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, session.user.id),
        eq(favorites.projectId, project.id)
      )
    );

  return c.json({ isFavorited: !!existing });
});

export { favoriteRoutes };
