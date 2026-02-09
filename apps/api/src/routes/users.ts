import { Hono } from "hono";
import { db } from "@slop/db";
import { favorites, projects, user, projectMedia } from "@slop/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const userRoutes = new Hono();

// Get current user's favorites
userRoutes.get("/me/favorites", requireAuth(), async (c) => {
  const session = c.get("session");

  // Get user's favorited projects
  const userFavorites = await db
    .select({
      projectId: favorites.projectId,
      favoritedAt: favorites.createdAt,
    })
    .from(favorites)
    .where(eq(favorites.userId, session.user.id))
    .orderBy(desc(favorites.createdAt));

  if (userFavorites.length === 0) {
    return c.json({ favorites: [] });
  }

  const projectIds = userFavorites.map((f) => f.projectId);

  // Get project details
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
        username: user.username,
        image: user.image,
        devVerified: user.devVerified,
      },
    })
    .from(projects)
    .leftJoin(user, eq(projects.authorUserId, user.id))
    .where(
      and(
        inArray(projects.id, projectIds),
        eq(projects.status, "published")
      )
    );

  // Get primary media
  const media = await db
    .select()
    .from(projectMedia)
    .where(
      and(
        inArray(projectMedia.projectId, projectIds),
        eq(projectMedia.isPrimary, true)
      )
    );

  const mediaByProject = new Map(media.map((m) => [m.projectId, m]));

  // Combine with favorite metadata and maintain order
  const favoriteMap = new Map(
    userFavorites.map((f) => [f.projectId, f.favoritedAt])
  );

  const result = projectList
    .map((p) => ({
      ...p,
      primaryMedia: mediaByProject.get(p.id) || null,
      favoritedAt: favoriteMap.get(p.id),
    }))
    .sort((a, b) => {
      const aTime = a.favoritedAt?.getTime() || 0;
      const bTime = b.favoritedAt?.getTime() || 0;
      return bTime - aTime;
    });

  return c.json({ favorites: result });
});

// Get current user's projects
userRoutes.get("/me/projects", requireAuth(), async (c) => {
  const session = c.get("session");

  // Get user's projects (all statuses)
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
      status: projects.status,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      lastEditedAt: projects.lastEditedAt,
      author: {
        id: user.id,
        username: user.username,
        image: user.image,
        devVerified: user.devVerified,
      },
    })
    .from(projects)
    .leftJoin(user, eq(projects.authorUserId, user.id))
    .where(eq(projects.authorUserId, session.user.id))
    .orderBy(desc(projects.createdAt));

  if (projectList.length === 0) {
    return c.json({ projects: [] });
  }

  const projectIds = projectList.map((p) => p.id);

  // Get primary media
  const media = await db
    .select()
    .from(projectMedia)
    .where(
      and(
        inArray(projectMedia.projectId, projectIds),
        eq(projectMedia.isPrimary, true)
      )
    );

  const mediaByProject = new Map(media.map((m) => [m.projectId, m]));

  const result = projectList.map((p) => ({
    ...p,
    primaryMedia: mediaByProject.get(p.id) || null,
  }));

  return c.json({ projects: result });
});

export { userRoutes };
