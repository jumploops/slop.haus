import { pgTable, uuid, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { user } from "./users";
import { projects } from "./projects";

export const favorites = pgTable(
  "favorites",
  {
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.projectId] })]
);
