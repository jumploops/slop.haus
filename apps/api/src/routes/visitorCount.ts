import { Hono } from "hono";
import { db } from "@slop/db";
import { siteCounters } from "@slop/db/schema";
import { eq } from "drizzle-orm";

const visitorCountRoutes = new Hono();
const VISITOR_COUNTER_BASELINE = 1;
const VISITOR_COUNTER_DISPLAY_OFFSET = 1;

visitorCountRoutes.get("/", async (c) => {
  const [counter] = await db
    .select({ value: siteCounters.value })
    .from(siteCounters)
    .where(eq(siteCounters.key, "unique_visitors"))
    .limit(1);

  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=600");

  // Display an extra +1 so users immediately see progression when validating in new browsers.
  const storedCount = counter?.value ?? VISITOR_COUNTER_BASELINE;

  return c.json({
    value: Math.max(
      VISITOR_COUNTER_BASELINE,
      Math.floor(storedCount + VISITOR_COUNTER_DISPLAY_OFFSET)
    ),
  });
});

export { visitorCountRoutes };
