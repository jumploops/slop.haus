import { db } from "@slop/db";
import { locks } from "@slop/db/schema";
import { sql } from "drizzle-orm";

export async function acquireLock(
  key: string,
  holder: string,
  ttlMs: number
): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  // Best-effort cleanup of expired locks (1% chance)
  if (Math.random() < 0.01) {
    await db.delete(locks).where(sql`${locks.expiresAt} < ${now}`);
  }

  const [row] = await db
    .insert(locks)
    .values({
      key,
      holder,
      expiresAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: locks.key,
      set: {
        holder,
        expiresAt,
        updatedAt: now,
      },
      where: sql`${locks.expiresAt} < ${now}`,
    })
    .returning({ key: locks.key, holder: locks.holder, expiresAt: locks.expiresAt });

  return !!row && row.holder === holder && row.expiresAt.getTime() === expiresAt.getTime();
}
