import { inArray } from "drizzle-orm";
import { user } from "../schema";
import { insertInChunks, uuidFromSeed } from "./utils";

export type UserRow = typeof user.$inferInsert;

const seedUserRows: Array<{
  email: string;
  username: string;
  role: "admin" | "mod" | "user";
  devVerified?: boolean;
}> = [
  { email: "admin@slop.haus", username: "slop_admin", role: "admin", devVerified: true },
  { email: "mod@slop.haus", username: "slop_mod", role: "mod" },
  { email: "dev@slop.haus", username: "vibe_dev", role: "user", devVerified: true },
  { email: "dev2@slop.haus", username: "ship_dev", role: "user", devVerified: true },
  { email: "viewer@slop.haus", username: "curious_viewer", role: "user" },
  { email: "lurker@slop.haus", username: "quiet_lurker", role: "user" },
  { email: "builder@slop.haus", username: "prototype_builder", role: "user" },
  { email: "maker@slop.haus", username: "weekend_maker", role: "user" },
];

export async function seedUsers(db: any): Promise<Map<string, string>> {
  const rows: UserRow[] = seedUserRows.map((seed) => ({
    id: uuidFromSeed(`user:${seed.email}`),
    name: seed.username,
    username: seed.username,
    usernameSource: "seed",
    email: seed.email,
    emailVerified: true,
    role: seed.role,
    devVerified: seed.devVerified ?? false,
  }));

  await insertInChunks(db, user, rows);

  const emails = seedUserRows.map((seed) => seed.email);
  const found: Array<{ id: string; email: string }> = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(inArray(user.email, emails));

  return new Map(found.map((entry) => [entry.email, entry.id]));
}

export const seedUserEmails = seedUserRows.map((seed) => seed.email);
