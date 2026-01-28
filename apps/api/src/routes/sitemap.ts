import { Hono } from "hono";
import { db } from "@slop/db";
import { projects } from "@slop/db/schema";
import { desc, eq } from "drizzle-orm";

const sitemapRoutes = new Hono();

const SITEMAP_LIMIT = 50_000;

// GET /api/v1/sitemap/projects - list published project slugs for sitemap
sitemapRoutes.get("/projects", async (c) => {
  const items = await db
    .select({
      slug: projects.slug,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(eq(projects.status, "published"))
    .orderBy(desc(projects.updatedAt))
    .limit(SITEMAP_LIMIT);

  return c.json({ projects: items });
});

export { sitemapRoutes };
