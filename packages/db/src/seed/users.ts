import { inArray } from "drizzle-orm";
import { user } from "../schema";
import { insertInChunks, uuidFromSeed } from "./utils";

export type UserRow = typeof user.$inferInsert;

const seedUserRows: Array<{
  email: string;
  name: string;
  role: "admin" | "mod" | "user";
  devVerified?: boolean;
}> = [
  { email: "admin@slop.haus", name: "Slop Admin", role: "admin", devVerified: true },
  { email: "mod@slop.haus", name: "Slop Moderator", role: "mod" },
  { email: "dev@slop.haus", name: "Vibe Dev", role: "user", devVerified: true },
  { email: "dev2@slop.haus", name: "Ship Dev", role: "user", devVerified: true },
  { email: "viewer@slop.haus", name: "Curious Viewer", role: "user" },
  { email: "lurker@slop.haus", name: "Quiet Lurker", role: "user" },
  { email: "builder@slop.haus", name: "Prototype Builder", role: "user" },
  { email: "maker@slop.haus", name: "Weekend Maker", role: "user" },
];

export async function seedUsers(db: any): Promise<Map<string, string>> {
  const rows: UserRow[] = seedUserRows.map((seed) => ({
    id: uuidFromSeed(`user:${seed.email}`),
    name: seed.name,
    email: seed.email,
    emailVerified: true,
    role: seed.role,
    devVerified: seed.devVerified ?? false,
  }));

  await insertInChunks(db, user, rows);

  const emails = seedUserRows.map((seed) => seed.email);
  const found = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(inArray(user.email, emails));

  return new Map(found.map((entry) => [entry.email, entry.id]));
}

export const seedUserEmails = seedUserRows.map((seed) => seed.email);
