import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./users";
import { projects } from "./projects";

export const commentStatusEnum = pgEnum("comment_status", [
  "visible",
  "hidden",
  "removed",
]);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    authorUserId: text("author_user_id")
      .references(() => user.id)
      .notNull(),
    parentCommentId: uuid("parent_comment_id").references((): any => comments.id),
    depth: integer("depth").default(0).notNull(),
    body: text("body").notNull(),
    status: commentStatusEnum("status").default("visible").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("comments_project_id_idx").on(table.projectId),
    index("comments_author_user_id_idx").on(table.authorUserId),
  ]
);
