import { db } from "@slop/db";
import { moderationEvents } from "@slop/db/schema";
import {
  evaluateModerationResult,
  type ModerationResult,
  type ModerationLLMResponse,
  type ModerationTargetType,
  type LabelWithConfidence,
  type ConfidenceLevel,
  MODERATION_LABELS,
  CONFIDENCE_LEVELS,
} from "@slop/shared";

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
export async function moderateText(content: string): Promise<ModerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set, skipping moderation");
    return {
      approved: true,
      decision: "approved",
      labels: [],
      highestConfidence: "none",
      reason: "Moderation skipped - no API key",
    };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
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
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Moderation API error:", error);
      // Fail open - approve if API errors
      return {
        approved: true,
        decision: "approved",
        labels: [],
        highestConfidence: "none",
        reason: "API error - failing open",
      };
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || "{}";

    // Parse and evaluate the response
    const llmResponse = parseModerationResponse(text);
    return evaluateModerationResult(llmResponse);
  } catch (error) {
    console.error("Moderation error:", error);
    // Fail open
    return {
      approved: true,
      decision: "approved",
      labels: [],
      highestConfidence: "none",
      reason: "Parse error - failing open",
    };
  }
}

/**
 * Moderate a URL to check for known bad domains
 */
export async function moderateUrl(url: string): Promise<ModerationResult> {
  // Known bad domain patterns (expand as needed)
  const badPatterns = [
    /bit\.ly/i,
    /tinyurl\.com/i,
    // Add known malware/phishing domains
  ];

  for (const pattern of badPatterns) {
    if (pattern.test(url)) {
      return {
        approved: false,
        decision: "hidden",
        labels: [{ label: "spam", confidence: "high" }],
        highestConfidence: "high",
        reason: `URL matches suspicious pattern: ${pattern}`,
      };
    }
  }

  return {
    approved: true,
    decision: "approved",
    labels: [],
    highestConfidence: "none",
    reason: "URL check passed",
  };
}

/**
 * Log moderation event to database
 */
export async function logModerationEvent(
  targetType: ModerationTargetType,
  targetId: string,
  result: ModerationResult
): Promise<void> {
  await db.insert(moderationEvents).values({
    targetType,
    targetId,
    model: MODERATION_MODEL,
    labels: result.labels,
    confidenceLevel: result.highestConfidence as ConfidenceLevel | "none",
    decision: result.decision,
    reason: result.reason,
  });
}

/**
 * Run full moderation on project content
 */
export async function moderateProject(project: {
  id: string;
  title: string;
  tagline: string;
  description?: string | null;
  mainUrl?: string | null;
  repoUrl?: string | null;
}): Promise<ModerationResult> {
  // Combine text content
  const textContent = [project.title, project.tagline, project.description]
    .filter(Boolean)
    .join("\n\n");

  // Moderate text
  const textResult = await moderateText(textContent);

  if (!textResult.approved) {
    await logModerationEvent("project", project.id, textResult);
    return textResult;
  }

  // Moderate URLs if present
  const urls = [project.mainUrl, project.repoUrl].filter(Boolean) as string[];
  for (const url of urls) {
    const urlResult = await moderateUrl(url);
    if (!urlResult.approved) {
      await logModerationEvent("project", project.id, urlResult);
      return urlResult;
    }
  }

  // All approved
  await logModerationEvent("project", project.id, textResult);
  return textResult;
}

/**
 * Moderate comment content
 */
export async function moderateComment(comment: {
  id: string;
  body: string;
}): Promise<ModerationResult> {
  const result = await moderateText(comment.body);
  await logModerationEvent("comment", comment.id, result);
  return result;
}

// Re-export types for convenience
export type { ModerationResult, ModerationTargetType };
