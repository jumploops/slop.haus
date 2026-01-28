import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  pgEnum,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./users";

export const draftStatusEnum = pgEnum("draft_status", [
  "pending",
  "scraping",
  "analyzing",
  "ready",
  "submitted",
  "failed",
  "expired",
]);

export const urlTypeEnum = pgEnum("url_type", [
  "github",
  "gitlab",
  "npm",
  "pypi",
  "chrome_webstore",
  "steam",
  "live_site",
]);

export const draftScreenshotSourceEnum = pgEnum("draft_screenshot_source", [
  "firecrawl",
  "readme_image",
  "github_og",
]);

export const enrichmentDrafts = pgTable(
  "enrichment_drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Input
    inputUrl: text("input_url").notNull(),
    detectedUrlType: urlTypeEnum("detected_url_type").notNull(),

    // Scraped Data (raw from Firecrawl)
    scrapedContent: jsonb("scraped_content"),
    scrapedMetadata: jsonb("scraped_metadata"),
    screenshotUrl: text("screenshot_url"),
    screenshotSource: draftScreenshotSourceEnum("screenshot_source"),

    // LLM Extracted Fields (suggested values)
    suggestedTitle: varchar("suggested_title", { length: 255 }),
    suggestedTagline: varchar("suggested_tagline", { length: 500 }),
    suggestedDescription: text("suggested_description"),
    suggestedTools: jsonb("suggested_tools").$type<string[]>(),
    suggestedVibePercent: integer("suggested_vibe_percent"),
    suggestedMainUrl: text("suggested_main_url"),
    suggestedRepoUrl: text("suggested_repo_url"),

    // User Edits (final values before submit, null = use suggested)
    finalTitle: varchar("final_title", { length: 255 }),
    finalTagline: varchar("final_tagline", { length: 500 }),
    finalDescription: text("final_description"),
    finalTools: jsonb("final_tools").$type<string[]>(),
    finalVibePercent: integer("final_vibe_percent"),
    finalMainUrl: text("final_main_url"),
    finalRepoUrl: text("final_repo_url"),

    // Status & Error
    status: draftStatusEnum("status").default("pending").notNull(),
    error: text("error"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("enrichment_drafts_user_id_idx").on(table.userId),
    index("enrichment_drafts_status_idx").on(table.status),
    index("enrichment_drafts_expires_at_idx").on(table.expiresAt),
    index("enrichment_drafts_deleted_at_idx").on(table.deletedAt),
  ]
);
