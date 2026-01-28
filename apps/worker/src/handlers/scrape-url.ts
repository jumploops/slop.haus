import { db } from "@slop/db";
import { enrichmentDrafts, jobs } from "@slop/db/schema";
import { eq } from "drizzle-orm";
import { scrape, fetchWithTimeout, isRetryableError } from "../lib/firecrawl";
import { getScrapeConfig } from "../lib/scrape-configs";
import { getStorage, generateStorageKey } from "../lib/storage";
import type { UrlType } from "@slop/shared";

export interface ScrapeUrlPayload {
  draftId: string;
  url: string;
  urlType: UrlType;
}

export async function handleScrapeUrl(payload: unknown): Promise<void> {
  const { draftId, url, urlType } = payload as ScrapeUrlPayload;

  console.log(`Scraping URL for draft ${draftId}: ${url} (type: ${urlType})`);

  // Get draft
  const [draft] = await db
    .select()
    .from(enrichmentDrafts)
    .where(eq(enrichmentDrafts.id, draftId));

  if (!draft) {
    throw new Error(`Draft not found: ${draftId}`);
  }

  // Check if draft is in valid state
  if (draft.status !== "pending" && draft.status !== "scraping") {
    console.log(`Draft ${draftId} not in scraping state (${draft.status}), skipping`);
    return;
  }

  // Update status to scraping
  await db
    .update(enrichmentDrafts)
    .set({
      status: "scraping",
      updatedAt: new Date(),
    })
    .where(eq(enrichmentDrafts.id, draftId));

  try {
    // Get scrape config for URL type
    const config = getScrapeConfig(urlType);

    // Call Firecrawl
    const result = await scrape({
      url,
      formats: config.formats,
      onlyMainContent: config.onlyMainContent,
      timeout: config.timeout,
      waitFor: config.waitFor,
      maxAge: 0, // Always fetch fresh
    });

    if (!result.success) {
      throw new Error(result.error || "Scrape failed");
    }

    // Handle screenshot if present
    let screenshotUrl: string | null = null;
    if (result.data?.screenshot) {
      try {
        // Firecrawl v2 returns URL, not base64
        // Add 30s timeout to prevent hanging on slow/unresponsive URLs
        const imageResponse = await fetchWithTimeout(
          result.data.screenshot,
          {},
          30000
        );

        if (imageResponse.ok) {
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          const storage = getStorage();
          const key = generateStorageKey("screenshots", "png");
          screenshotUrl = await storage.upload(key, imageBuffer, "image/png");
          console.log(`Screenshot saved for draft ${draftId}: ${screenshotUrl}`);
        }
      } catch (screenshotError) {
        // Don't fail the whole job for screenshot errors
        if (screenshotError instanceof Error && screenshotError.name === "AbortError") {
          console.warn(`Screenshot fetch timed out for draft ${draftId}`);
        } else {
          console.warn(`Failed to save screenshot for draft ${draftId}:`, screenshotError);
        }
      }
    }

    // Extract scraped content
    const scrapedContent = {
      markdown: result.data?.markdown || null,
      links: result.data?.links || [],
    };

    const scrapedMetadata = result.data?.metadata || {};

    // Update draft with scraped data
    await db
      .update(enrichmentDrafts)
      .set({
        status: "analyzing",
        scrapedContent,
        scrapedMetadata,
        screenshotUrl,
        screenshotSource: screenshotUrl ? "firecrawl" : draft.screenshotSource,
        updatedAt: new Date(),
      })
      .where(eq(enrichmentDrafts.id, draftId));

    // Queue analyze_content job
    await db.insert(jobs).values({
      type: "analyze_content",
      payload: { draftId },
    });

    console.log(`Scrape complete for draft ${draftId}, queued analyze_content job`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const lowerMessage = errorMessage.toLowerCase();

    // Determine if error is retryable
    const isRetryable = isRetryableError(error) ||
      lowerMessage.includes("rate limit") ||
      lowerMessage.includes("429") ||
      lowerMessage.includes("503") ||
      lowerMessage.includes("502");

    // Non-retryable errors (permanent failures)
    const isPermanent =
      lowerMessage.includes("blocked") ||
      lowerMessage.includes("forbidden") ||
      lowerMessage.includes("403") ||
      lowerMessage.includes("not found") ||
      lowerMessage.includes("404") ||
      lowerMessage.includes("invalid url");

    // Only re-throw for retryable errors; keep status in scraping for retries
    if (isRetryable && !isPermanent) {
      throw error;
    }

    // Permanent failure: mark as failed
    await db
      .update(enrichmentDrafts)
      .set({
        status: "failed",
        error: `Scrape failed: ${errorMessage}`,
        updatedAt: new Date(),
      })
      .where(eq(enrichmentDrafts.id, draftId));

    console.log(`Permanent scrape failure for draft ${draftId}: ${errorMessage}`);
  }
}
