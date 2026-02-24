import { Hono } from "hono";
import { db } from "@slop/db";
import { tools } from "@slop/db/schema";
import { like, asc, and, eq, or } from "drizzle-orm";

const toolRoutes = new Hono();

// List tools (with optional search)
toolRoutes.get("/", async (c) => {
  const search = c.req.query("q");

  if (search) {
    const toolList = await db
      .select({
        id: tools.id,
        name: tools.name,
        slug: tools.slug,
      })
      .from(tools)
      .where(
        and(
          eq(tools.status, "active"),
          or(
            like(tools.name, `%${search}%`),
            like(tools.slug, `%${search}%`)
          )
        )
      )
      .orderBy(asc(tools.name))
      .limit(50);

    return c.json({ tools: toolList });
  }

  const toolList = await db
    .select({
      id: tools.id,
      name: tools.name,
      slug: tools.slug,
    })
    .from(tools)
    .where(eq(tools.status, "active"))
    .orderBy(asc(tools.name))
    .limit(50);

  return c.json({ tools: toolList });
});

export { toolRoutes };
