import { db } from "@slop/db";
import { enrichmentDrafts } from "@slop/db/schema";
import { lt, and, inArray, isNull } from "drizzle-orm";

export async function handleCleanupDrafts(): Promise<void> {
  const now = new Date();

  // 1. Soft-delete expired drafts (past expiresAt and not already deleted)
  const expiredResult = await db
    .update(enrichmentDrafts)
    .set({
      deletedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        lt(enrichmentDrafts.expiresAt, now),
        isNull(enrichmentDrafts.deletedAt)
      )
    )
    .returning({ id: enrichmentDrafts.id });

  if (expiredResult.length > 0) {
    console.log(`Soft-deleted ${expiredResult.length} expired drafts`);
  }

  // 2. Mark stale drafts as failed (stuck in scraping/analyzing for > 5 min)
  // These are NOT soft-deleted - user can still see and retry
  const staleThreshold = new Date(now.getTime() - 5 * 60 * 1000);

  const staleResult = await db
    .update(enrichmentDrafts)
    .set({
      status: "failed",
      error: "Analysis timed out. Please try again.",
      updatedAt: now,
    })
    .where(
      and(
        lt(enrichmentDrafts.updatedAt, staleThreshold),
        inArray(enrichmentDrafts.status, ["pending", "scraping", "analyzing"]),
        isNull(enrichmentDrafts.deletedAt)
      )
    )
    .returning({ id: enrichmentDrafts.id });

  if (staleResult.length > 0) {
    console.log(`Marked ${staleResult.length} stale drafts as failed`);
  }
}
