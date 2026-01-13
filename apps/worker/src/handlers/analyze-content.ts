import { db } from "@slop/db";
import { enrichmentDrafts, jobs } from "@slop/db/schema";
import { eq } from "drizzle-orm";
import { buildExtractionPrompt } from "../lib/extraction-prompt";
import { matchToolsToDatabase } from "../lib/tool-matching";

const ANALYSIS_MODEL = "claude-3-5-haiku-latest";

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
    const response = await fetch("https://api.anthropic.com/v1/messages", {
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    const responseText = result.content?.[0]?.text || "";

    // 4. Parse response
    let extraction: ExtractionResult;
    try {
      // Try to extract JSON from response (handle potential markdown wrapping)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      extraction = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse LLM response:", responseText);
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

    await db
      .update(enrichmentDrafts)
      .set({
        status: "failed",
        error: `Analysis failed: ${errorMessage}`,
        updatedAt: new Date(),
      })
      .where(eq(enrichmentDrafts.id, draftId));

    throw error;
  }
}
