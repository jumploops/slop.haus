import { db } from "@slop/db";
import { enrichmentDrafts, jobs } from "@slop/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { buildExtractionPrompt } from "../lib/extraction-prompt";
import { matchToolsToDatabase } from "../lib/tool-matching";
import { fetchWithTimeout, HttpError, isRetryableError } from "../lib/firecrawl";
import { extractReadmeImageCandidates, buildGithubOgUrl } from "../lib/readme-images";
import { getStorage, generateStorageKey } from "../lib/storage";

const ANALYSIS_MODEL = "claude-haiku-4-5";
const MAX_README_IMAGE_BYTES = 11 * 1024 * 1024;
const MIN_README_IMAGE_BYTES = 25 * 1024;
const MAX_README_IMAGE_ATTEMPTS = 4;
const IMAGE_FETCH_TIMEOUT_MS = 20000;

// Schema for LLM extraction response with defaults for robustness
const extractionSchema = z.object({
  title: z.string().max(255).default("Untitled"),
  tagline: z.string().max(500).default(""),
  description: z.string().max(10000).default(""),
  detectedTools: z.array(z.string()).default([]),
  suggestedVibePercent: z.number().min(0).max(100).default(50),
  linkedUrls: z.object({
    mainUrl: z.string().url().nullable().default(null),
    repoUrl: z.string().url().nullable().default(null),
  }).default({ mainUrl: null, repoUrl: null }),
});

export interface AnalyzeContentPayload {
  draftId: string;
}

interface ExtractionResult {
  title: string;
  tagline: string;
  description: string;
  detectedTools: string[];
  suggestedVibePercent: number;
  linkedUrls: {
    mainUrl: string | null;
    repoUrl: string | null;
  };
}

function getImageExtension(contentType: string | null, url: string): string {
  const normalized = contentType?.split(";")[0]?.trim().toLowerCase();
  const contentTypeMap: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  if (normalized && contentTypeMap[normalized]) {
    return contentTypeMap[normalized];
  }

  const pathExtension = url.split("?")[0]?.split("#")[0]?.split(".").pop()?.toLowerCase();
  if (pathExtension && ["png", "jpg", "jpeg", "webp", "gif"].includes(pathExtension)) {
    return pathExtension === "jpeg" ? "jpg" : pathExtension;
  }

  return "png";
}

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; contentType: string | null } | null> {
  try {
    const response = await fetchWithTimeout(url, {}, IMAGE_FETCH_TIMEOUT_MS);
    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.toLowerCase().startsWith("image/svg")) {
      return null;
    }
    if (contentType && !contentType.toLowerCase().startsWith("image/")) {
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < MIN_README_IMAGE_BYTES || buffer.length > MAX_README_IMAGE_BYTES) {
      return null;
    }

    return { buffer, contentType };
  } catch {
    return null;
  }
}

async function uploadImageBuffer(
  buffer: Buffer,
  contentType: string | null,
  url: string
): Promise<string> {
  const storage = getStorage();
  const extension = getImageExtension(contentType, url);
  const key = generateStorageKey("screenshots", extension);
  const uploadContentType = contentType?.split(";")[0]?.trim() || `image/${extension}`;
  return storage.upload(key, buffer, uploadContentType);
}

export async function handleAnalyzeContent(payload: unknown): Promise<void> {
  const { draftId } = payload as AnalyzeContentPayload;

  console.log(`Analyzing content for draft ${draftId}`);

  // 1. Load draft
  const [draft] = await db
    .select()
    .from(enrichmentDrafts)
    .where(eq(enrichmentDrafts.id, draftId));

  if (!draft) {
    throw new Error(`Draft not found: ${draftId}`);
  }

  if (draft.status !== "analyzing") {
    console.log(`Draft ${draftId} not in analyzing state (${draft.status}), skipping`);
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    await db
      .update(enrichmentDrafts)
      .set({
        status: "failed",
        error: "ANTHROPIC_API_KEY not configured",
        updatedAt: new Date(),
      })
      .where(eq(enrichmentDrafts.id, draftId));
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  try {
    // 2. Build prompt
    const scrapedContent =
      (draft.scrapedContent as { markdown?: string; links?: string[] }) || {};
    const metadata = (draft.scrapedMetadata as Record<string, unknown>) || {};

    const prompt = buildExtractionPrompt(
      draft.inputUrl,
      draft.detectedUrlType,
      scrapedContent,
      metadata
    );

    // 3. Call Claude API
    const response = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANALYSIS_MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    }, 45000);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      throw new HttpError(
        response.status,
        `Claude API error: ${response.status} ${errorText}`
      );
    }

    const result = await response.json();
    const responseText = result.content?.[0]?.text || "";

    // 4. Parse response with zod validation
    let extraction: ExtractionResult;
    try {
      // Try to extract JSON from response (handle potential markdown wrapping)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate and apply defaults with zod schema
      extraction = extractionSchema.parse(parsed);
    } catch (parseError: unknown) {
      console.error("Failed to parse LLM response:", responseText);
      if (parseError instanceof z.ZodError) {
        console.error("Zod validation errors:", parseError.errors);
      }
      throw new Error("Failed to parse extraction response");
    }

    // 5. Match detected tools to database
    const matchedTools = await matchToolsToDatabase(
      extraction.detectedTools || []
    );

    // 6. Determine URLs
    let suggestedMainUrl = extraction.linkedUrls?.mainUrl || null;
    let suggestedRepoUrl = extraction.linkedUrls?.repoUrl || null;

    // If input URL is a repo, use it as repoUrl
    if (
      draft.detectedUrlType === "github" ||
      draft.detectedUrlType === "gitlab"
    ) {
      suggestedRepoUrl = suggestedRepoUrl || draft.inputUrl;
    } else {
      // If input URL is a live site, use it as mainUrl
      suggestedMainUrl = suggestedMainUrl || draft.inputUrl;
    }

    let derivedScreenshotUrl = draft.screenshotUrl;
    let derivedScreenshotSource = draft.screenshotSource;

    const isRepoOnly =
      (draft.detectedUrlType === "github" || draft.detectedUrlType === "gitlab") &&
      !suggestedMainUrl;

    if (!derivedScreenshotUrl && isRepoOnly) {
      const repoUrlForImages = suggestedRepoUrl || draft.inputUrl;
      const markdown = scrapedContent.markdown || "";
      const candidates = extractReadmeImageCandidates(markdown, repoUrlForImages).slice(
        0,
        MAX_README_IMAGE_ATTEMPTS
      );

      for (const candidate of candidates) {
        const imageResult = await fetchImageBuffer(candidate.url);
        if (!imageResult) {
          continue;
        }

        try {
          derivedScreenshotUrl = await uploadImageBuffer(
            imageResult.buffer,
            imageResult.contentType,
            candidate.url
          );
          derivedScreenshotSource = "readme_image";
          console.log(`README screenshot captured for draft ${draftId}`);
          break;
        } catch (uploadError) {
          console.warn(`Failed to upload README image for draft ${draftId}:`, uploadError);
        }
      }

      if (!derivedScreenshotUrl && draft.detectedUrlType === "github") {
        const ogUrl = buildGithubOgUrl(repoUrlForImages);
        if (ogUrl) {
          const ogResult = await fetchImageBuffer(ogUrl);
          if (ogResult) {
            try {
              derivedScreenshotUrl = await uploadImageBuffer(
                ogResult.buffer,
                ogResult.contentType,
                ogUrl
              );
              derivedScreenshotSource = "github_og";
              console.log(`GitHub OG screenshot captured for draft ${draftId}`);
            } catch (uploadError) {
              console.warn(`Failed to upload GitHub OG image for draft ${draftId}:`, uploadError);
            }
          }
        }
      }
    }

    // 7. Check if we need to capture a screenshot from the mainUrl
    // For GitHub/GitLab repos, we didn't capture a screenshot during scraping
    // If LLM found a mainUrl (live site), we should capture a screenshot from it
    const needsScreenshot =
      (draft.detectedUrlType === "github" || draft.detectedUrlType === "gitlab") &&
      suggestedMainUrl &&
      suggestedMainUrl !== draft.inputUrl &&
      !draft.screenshotUrl;

    // 8. Update draft with extracted data
    await db
      .update(enrichmentDrafts)
      .set({
        // Keep status as "analyzing" if we need to capture screenshot, otherwise "ready"
        status: needsScreenshot ? "analyzing" : "ready",
        suggestedTitle: extraction.title?.slice(0, 255) || null,
        suggestedTagline: extraction.tagline?.slice(0, 500) || null,
        suggestedDescription: extraction.description?.slice(0, 10000) || null,
        suggestedTools: matchedTools,
        suggestedVibePercent: Math.min(
          100,
          Math.max(0, extraction.suggestedVibePercent || 50)
        ),
        suggestedMainUrl,
        suggestedRepoUrl,
        screenshotUrl: derivedScreenshotUrl,
        screenshotSource: derivedScreenshotSource,
        updatedAt: new Date(),
      })
      .where(eq(enrichmentDrafts.id, draftId));

    // 9. Queue screenshot capture if needed
    if (needsScreenshot) {
      await db.insert(jobs).values({
        type: "scrape_screenshot",
        payload: {
          draftId,
          url: suggestedMainUrl,
        },
      });
      console.log(
        `Analysis complete for draft ${draftId}: "${extraction.title}" - queued screenshot capture from ${suggestedMainUrl}`
      );
    } else {
      console.log(
        `Analysis complete for draft ${draftId}: "${extraction.title}" with ${matchedTools.length} tools`
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const retryable = isRetryableError(error);

    if (!retryable) {
      await db
        .update(enrichmentDrafts)
        .set({
          status: "failed",
          error: `Analysis failed: ${errorMessage}`,
          updatedAt: new Date(),
        })
        .where(eq(enrichmentDrafts.id, draftId));
      return;
    }

    throw error;
  }
}
