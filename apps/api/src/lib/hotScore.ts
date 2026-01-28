import { sql } from "drizzle-orm";
import { projects } from "@slop/db/schema";
import type { SQL } from "drizzle-orm";

const HOT_GRAVITY = 1.8;

export function computeHotScoreExpr(slopScoreExpr: SQL) {
  return sql`(${slopScoreExpr}) / power(((extract(epoch from (now() - ${projects.createdAt})) / 3600) + 2), ${HOT_GRAVITY})`;
}
