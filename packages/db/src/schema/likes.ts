import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { comments } from "./comments";
import { user } from "./users";

export const raterTypeEnum = pgEnum("rater_type", ["public", "dev"]);

export const projectLikes = pgTable(
  "project_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id").references(() => user.id),
    raterType: raterTypeEnum("rater_type").notNull(),
    raterKeyHash: varchar("rater_key_hash", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("project_likes_unique").on(
      table.projectId,
      table.raterKeyHash
    ),
    index("project_likes_project_id_idx").on(table.projectId),
    index("project_likes_user_id_idx").on(table.userId),
  ]
);

export const commentVotes = pgTable(
  "comment_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    commentId: uuid("comment_id")
      .references(() => comments.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => user.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("comment_votes_unique").on(table.commentId, table.userId),
    index("comment_votes_comment_id_idx").on(table.commentId),
    index("comment_votes_user_id_idx").on(table.userId),
  ]
);
