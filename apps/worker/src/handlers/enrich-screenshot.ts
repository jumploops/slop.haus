import { db } from "@slop/db";
import { projects, projectMedia, jobs } from "@slop/db/schema";
import { eq } from "drizzle-orm";
import { scrape, fetchWithTimeout } from "../lib/firecrawl";
import { getStorage, generateStorageKey } from "../lib/storage";

export interface EnrichScreenshotPayload {
  projectId: string;
}

export async function handleEnrichScreenshot(payload: unknown): Promise<void> {
  const { projectId } = payload as EnrichScreenshotPayload;

  // Get project
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  if (!project.mainUrl) {
    throw new Error(`Project ${projectId} has no main URL`);
  }

  console.log(`Enriching screenshot for project ${project.slug} (${project.mainUrl})`);

  // Call Firecrawl v2
  const result = await scrape({
    url: project.mainUrl,
    formats: [
      {
        type: "screenshot",
        fullPage: false,
        viewport: {
          width: 1280,
          height: 800,
        },
      },
    ],
    maxAge: 0, // Always fetch fresh for new projects
    timeout: 60000, // 60 seconds for complex pages
  });

  // Firecrawl v2 returns screenshot as a URL in data.screenshot
  const screenshotUrl = result.data?.screenshot;

  if (!result.success || !screenshotUrl) {
    throw new Error(`Failed to capture screenshot: ${result.error || "No screenshot returned"}`);
  }

  console.log(`Firecrawl returned screenshot URL: ${screenshotUrl}`);

  // Fetch the screenshot image from the URL
  const imageResponse = await fetchWithTimeout(screenshotUrl, {}, 30000);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch screenshot image: ${imageResponse.status}`);
  }

  const screenshotBuffer = Buffer.from(await imageResponse.arrayBuffer());

  // Upload to storage
  const storage = getStorage();
  const key = generateStorageKey("screenshots", "png");
  const url = await storage.upload(key, screenshotBuffer, "image/png");

  // Check if project already has a primary screenshot from firecrawl
  const [existingMedia] = await db
    .select()
    .from(projectMedia)
    .where(eq(projectMedia.projectId, projectId));

  const hasPrimaryScreenshot = existingMedia && existingMedia.isPrimary;

  // Save media record
  await db.insert(projectMedia).values({
    projectId,
    type: "screenshot",
    url,
    source: "firecrawl",
    isPrimary: !hasPrimaryScreenshot, // Only set as primary if no existing primary
  });

  // Update enrichment status
  await db
    .update(projects)
    .set({
      enrichmentStatus: "completed",
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  // Queue async moderation job
  await db.insert(jobs).values({
    type: "moderate_async",
    payload: { projectId },
  });

  console.log(`Screenshot saved for project ${project.slug}: ${url}`);
}
