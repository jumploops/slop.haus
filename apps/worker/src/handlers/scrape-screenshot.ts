import { db } from "@slop/db";
import { enrichmentDrafts } from "@slop/db/schema";
import { eq } from "drizzle-orm";
import { scrape, fetchWithTimeout } from "../lib/firecrawl";
import { getStorage, generateStorageKey } from "../lib/storage";

export interface ScrapeScreenshotPayload {
  draftId: string;
  url: string;
}

/**
 * Lightweight handler that only captures a screenshot from a URL.
 * Used when we've scraped a repo (GitHub/GitLab) for content but need
 * to capture a screenshot from the project's live site (mainUrl).
 */
export async function handleScrapeScreenshot(payload: unknown): Promise<void> {
  const { draftId, url } = payload as ScrapeScreenshotPayload;

  console.log(`Capturing screenshot for draft ${draftId} from ${url}`);

  // Get draft
  const [draft] = await db
    .select()
    .from(enrichmentDrafts)
    .where(eq(enrichmentDrafts.id, draftId));

  if (!draft) {
    throw new Error(`Draft not found: ${draftId}`);
  }

  // Only proceed if draft is still in analyzing state
  if (draft.status !== "analyzing") {
    console.log(`Draft ${draftId} not in analyzing state (${draft.status}), skipping screenshot`);
    return;
  }

  try {
    // Call Firecrawl with screenshot-only config
    const result = await scrape({
      url,
      formats: [
        {
          type: "screenshot",
          fullPage: false,
          viewport: { width: 1280, height: 800 },
        },
      ],
      onlyMainContent: true,
      timeout: 45000, // 45 seconds
      maxAge: 0, // Always fetch fresh
    });

    let screenshotUrl: string | null = null;

    if (result.success && result.data?.screenshot) {
      try {
        // Firecrawl v2 returns screenshot as a URL
        const imageResponse = await fetchWithTimeout(result.data.screenshot, {}, 30000);
        if (imageResponse.ok) {
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          const storage = getStorage();
          const key = generateStorageKey("screenshots", "png");
          screenshotUrl = await storage.upload(key, imageBuffer, "image/png");
          console.log(`Screenshot saved for draft ${draftId}: ${screenshotUrl}`);
        }
      } catch (uploadError) {
        console.warn(`Failed to save screenshot for draft ${draftId}:`, uploadError);
      }
    } else {
      console.warn(`Failed to capture screenshot for draft ${draftId}: ${result.error || "No screenshot returned"}`);
    }

    // Update draft with screenshot (even if null) and mark as ready
    await db
      .update(enrichmentDrafts)
      .set({
        screenshotUrl: screenshotUrl || draft.screenshotUrl, // Keep existing if new one failed
        status: "ready",
        updatedAt: new Date(),
      })
      .where(eq(enrichmentDrafts.id, draftId));

    console.log(`Draft ${draftId} marked as ready (screenshot: ${screenshotUrl ? "captured" : "skipped"})`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.warn(`Screenshot capture failed for draft ${draftId}: ${errorMessage}`);

    // Don't fail the draft - just mark as ready without screenshot
    // The screenshot is nice-to-have, not required
    await db
      .update(enrichmentDrafts)
      .set({
        status: "ready",
        updatedAt: new Date(),
      })
      .where(eq(enrichmentDrafts.id, draftId));

    console.log(`Draft ${draftId} marked as ready (screenshot capture failed, continuing without)`);
  }
}
