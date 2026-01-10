import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./users";

export const moderationTargetTypeEnum = pgEnum("moderation_target_type", [
  "project",
  "comment",
  "revision",
]);

export const moderationDecisionEnum = pgEnum("moderation_decision", [
  "approved",
  "flagged",
  "hidden",
  "rejected",
]);

export const confidenceLevelEnum = pgEnum("confidence_level", [
  "none",
  "low",
  "medium",
  "high",
  "absolute",
]);

export const flagTargetTypeEnum = pgEnum("flag_target_type", [
  "project",
  "comment",
]);

export const moderationEvents = pgTable("moderation_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  targetType: moderationTargetTypeEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  labels: jsonb("labels").notNull(), // Array of { label, confidence }
  confidenceLevel: confidenceLevelEnum("confidence_level").default("none").notNull(),
  decision: moderationDecisionEnum("decision").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const flags = pgTable(
  "flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    targetType: flagTargetTypeEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    userId: text("user_id")
      .references(() => user.id)
      .notNull(),
    reason: varchar("reason", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("flags_unique").on(table.targetType, table.targetId, table.userId),
  ]
);
