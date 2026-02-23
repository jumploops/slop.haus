import { pgTable, text, bigint, timestamp } from "drizzle-orm/pg-core";

export const siteCounters = pgTable("site_counters", {
  key: text("key").primaryKey(),
  value: bigint("value", { mode: "number" }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
