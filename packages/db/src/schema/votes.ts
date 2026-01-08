import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const raterTypeEnum = pgEnum("rater_type", ["public", "dev"]);

export const projectVotes = pgTable(
  "project_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    raterType: raterTypeEnum("rater_type").notNull(),
    raterKeyHash: varchar("rater_key_hash", { length: 255 }).notNull(),
    value: integer("value").notNull(), // -1 or +1
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("project_votes_unique").on(
      table.projectId,
      table.raterType,
      table.raterKeyHash
    ),
  ]
);
