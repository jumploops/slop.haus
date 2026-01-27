import { db } from "@slop/db";
import { projects, moderationEvents } from "@slop/db/schema";
import { eq } from "drizzle-orm";
import {
  evaluateModerationResult,
  type ModerationResult,
  type ModerationLLMResponse,
  type LabelWithConfidence,
  type ConfidenceLevel,
  MODERATION_LABELS,
  CONFIDENCE_LEVELS,
} from "@slop/shared";
import { fetchWithTimeout, HttpError } from "../lib/firecrawl";

export interface ModerateAsyncPayload {
  projectId: string;
  content?: string; // Optional additional content to moderate (e.g., README)
}

const MODERATION_MODEL = "claude-3-haiku-20240307";

// Build the moderation prompt with chain-of-thought ordering
function buildModerationPrompt(content: string): string {
  return `You are a content moderation system for a developer project showcase site.

Analyze the following content for policy violations. Be calibrated in your assessments - only flag content that genuinely violates policies, not content that merely touches on sensitive topics.

IMPORTANT CONTEXT:
- This is a site for developers to share coding projects built with AI assistance
- Historical events, educational content, and technical discussions are generally acceptable
- A stock market "crash" is not violence - it's a financial term
- Security tools and research are not malware unless explicitly malicious
- Discussions about AI, automation, or technology disruption are acceptable

Content to analyze:
"""
${content}
"""

Respond with a JSON object. The key order is important - reason MUST come first to ensure you think before labeling:

{
  "reason": "Your analysis of the content, explaining your reasoning before applying any labels",
  "labels": [
    { "label": "<label>", "confidence": "<level>" }
  ]
}

Available labels: ${MODERATION_LABELS.join(", ")}

Confidence levels (be conservative - when in doubt, use lower confidence):
- "low": Edge case, ambiguous, probably acceptable, tangential reference
- "medium": Some concern but not clear-cut, could be interpreted multiple ways
- "high": Strong signal of violation, clear intent
- "absolute": Definite, unambiguous, explicit violation

If the content is acceptable (which most developer projects are), return an empty labels array:
{ "reason": "Content appears to be a legitimate developer project", "labels": [] }

Respond ONLY with valid JSON, no other text.`;
}

/**
 * Parse the LLM response into a structured format
 */
function parseModerationResponse(text: string): ModerationLLMResponse {
  try {
    const parsed = JSON.parse(text);

    // Validate and normalize the response
    const reason = typeof parsed.reason === "string" ? parsed.reason : "";
    const labels: LabelWithConfidence[] = [];

    if (Array.isArray(parsed.labels)) {
      for (const item of parsed.labels) {
        if (
          typeof item === "object" &&
          MODERATION_LABELS.includes(item.label) &&
          CONFIDENCE_LEVELS.includes(item.confidence)
        ) {
          labels.push({
            label: item.label,
            confidence: item.confidence,
          });
        }
      }
    }

    return { reason, labels };
  } catch {
    return { reason: "Failed to parse moderation response", labels: [] };
  }
}

/**
 * Moderate text content using Claude API with confidence scoring
 */
async function moderateText(content: string): Promise<ModerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set, skipping async moderation");
    return {
      approved: true,
      decision: "approved",
      labels: [],
      highestConfidence: "none",
      reason: "Moderation skipped - no API key",
    };
  }

  try {
    const response = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODERATION_MODEL,
        max_tokens: 512,
        messages: [{ role: "user", content: buildModerationPrompt(content) }],
      }),
    }, 30000);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Moderation API error:", errorText);
      const error = new HttpError(
        response.status,
        `Moderation API error: ${response.status} ${errorText}`
      );
      throw error;
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || "{}";

    // Parse and evaluate the response
    const llmResponse = parseModerationResponse(text);
    return evaluateModerationResult(llmResponse);
  } catch (error) {
    console.error("Moderation error:", error);
    return {
      approved: true,
      decision: "approved",
      labels: [],
      highestConfidence: "none",
      reason: "API error - failing open",
    };
  }
}

export async function handleModerateAsync(payload: unknown): Promise<void> {
  const { projectId, content } = payload as ModerateAsyncPayload;

  // Get project
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  // Build content to moderate
  const textToModerate = content || project.description || "";

  if (!textToModerate) {
    console.log(`No content to moderate for project ${project.slug}`);
    return;
  }

  console.log(`Running async moderation for project ${project.slug}`);

  const result = await moderateText(textToModerate);

  // Log moderation event
  await db.insert(moderationEvents).values({
    targetType: "project",
    targetId: projectId,
    model: MODERATION_MODEL,
    labels: result.labels,
    confidenceLevel: result.highestConfidence as ConfidenceLevel | "none",
    decision: result.decision,
    reason: result.reason,
  });

  // Handle based on decision
  if (result.decision === "rejected" || result.decision === "hidden") {
    await db
      .update(projects)
      .set({ status: "hidden", updatedAt: new Date() })
      .where(eq(projects.id, projectId));

    console.log(
      `Project ${project.slug} hidden by async moderation (${result.decision}): ${result.reason}`
    );
  } else if (result.decision === "flagged") {
    // Project stays published but is flagged for review
    console.log(
      `Project ${project.slug} flagged for review: ${result.reason}`
    );
  } else {
    console.log(`Project ${project.slug} passed async moderation`);
  }
}
