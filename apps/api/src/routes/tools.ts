import { Hono } from "hono";
import { db } from "@slop/db";
import { tools } from "@slop/db/schema";
import { like, asc } from "drizzle-orm";

const toolRoutes = new Hono();

// List tools (with optional search)
toolRoutes.get("/", async (c) => {
  const search = c.req.query("q");

  let query = db.select().from(tools).orderBy(asc(tools.name));

  if (search) {
    query = query.where(like(tools.name, `%${search}%`)) as typeof query;
  }

  const toolList = await query.limit(50);

  return c.json({ tools: toolList });
});

export { toolRoutes };
