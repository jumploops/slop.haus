import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  pgEnum,
  jsonb,
  boolean,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./users";

export const projectStatusEnum = pgEnum("project_status", [
  "published",
  "hidden",
  "removed",
]);

export const vibeModeEnum = pgEnum("vibe_mode", ["overview", "detailed"]);

export const revisionStatusEnum = pgEnum("revision_status", [
  "pending",
  "approved",
  "rejected",
]);

export const mediaTypeEnum = pgEnum("media_type", ["screenshot", "video"]);

export const mediaSourceEnum = pgEnum("media_source", [
  "firecrawl",
  "user_upload",
  "readme_image",
  "github_og",
]);

export const enrichmentStatusEnum = pgEnum("enrichment_status", [
  "pending",
  "completed",
  "failed",
]);

export const toolStatusEnum = pgEnum("tool_status", ["active", "blocked"]);

export const toolSourceEnum = pgEnum("tool_source", [
  "seed",
  "user",
  "llm",
  "admin",
]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 255 }).unique().notNull(),
    authorUserId: text("author_user_id")
      .references(() => user.id)
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    tagline: varchar("tagline", { length: 500 }).notNull(),
    description: text("description"),
    mainUrl: text("main_url"),
    repoUrl: text("repo_url"),
    vibeMode: vibeModeEnum("vibe_mode").notNull(),
    vibePercent: integer("vibe_percent").notNull(),
    vibeDetailsJson: jsonb("vibe_details_json"),
    likeCount: integer("like_count").default(0).notNull(),
    reviewCount: integer("review_count").default(0).notNull(),
    reviewScoreTotal: integer("review_score_total").default(0).notNull(),
    slopScore: numeric("slop_score", { precision: 4, scale: 2 })
      .default("0")
      .notNull(),
    hotScore: numeric("hot_score", { precision: 10, scale: 4 })
      .default("0")
      .notNull(),
    commentCount: integer("comment_count").default(0).notNull(),
    status: projectStatusEnum("status").default("published").notNull(),
    enrichmentStatus: enrichmentStatusEnum("enrichment_status")
      .default("pending")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastEditedAt: timestamp("last_edited_at"),
  },
  (table) => [
    index("projects_author_user_id_idx").on(table.authorUserId),
    index("projects_status_idx").on(table.status),
    index("projects_created_at_idx").on(table.createdAt),
    index("projects_hot_score_idx").on(table.hotScore),
  ]
);

export const projectRevisions = pgTable("project_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  status: revisionStatusEnum("status").default("pending").notNull(),
  title: varchar("title", { length: 255 }),
  tagline: varchar("tagline", { length: 500 }),
  description: text("description"),
  mainUrl: text("main_url"),
  repoUrl: text("repo_url"),
  vibeMode: vibeModeEnum("vibe_mode"),
  vibePercent: integer("vibe_percent"),
  vibeDetailsJson: jsonb("vibe_details_json"),
  // Explicit list of which fields were changed in this revision
  // Solves NULL ambiguity: we can distinguish "not changed" from "set to null"
  changedFields: text("changed_fields").array().default([]).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewerUserId: text("reviewer_user_id").references(() => user.id),
});

export const projectMedia = pgTable("project_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  type: mediaTypeEnum("type").notNull(),
  url: text("url").notNull(),
  source: mediaSourceEnum("source").notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tools = pgTable(
  "tools",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).unique().notNull(),
    slug: varchar("slug", { length: 100 }).unique().notNull(),
    status: toolStatusEnum("status").default("active").notNull(),
    source: toolSourceEnum("source").default("seed").notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    usageCount: integer("usage_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("tools_status_idx").on(table.status)]
);

export const projectTools = pgTable(
  "project_tools",
  {
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    toolId: uuid("tool_id")
      .references(() => tools.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.toolId] })]
);
