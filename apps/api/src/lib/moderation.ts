import { db } from "@slop/db";
import { moderationEvents } from "@slop/db/schema";

export interface ModerationResult {
  approved: boolean;
  labels: string[];
  confidence: number;
  reason?: string;
}

export type TargetType = "project" | "comment" | "revision";

const MODERATION_MODEL = "claude-3-haiku-20240307";

// Content policy labels
const LABELS = {
  NSFW: "nsfw",
  SPAM: "spam",
  VIOLENCE: "violence",
  HARASSMENT: "harassment",
  ILLEGAL: "illegal",
  COPYRIGHT: "copyright",
  MALWARE: "malware",
} as const;

// Labels that trigger immediate rejection
const REJECT_LABELS = [LABELS.NSFW, LABELS.ILLEGAL, LABELS.MALWARE];

/**
 * Moderate text content using Claude API
 */
export async function moderateText(content: string): Promise<ModerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set, skipping moderation");
    return { approved: true, labels: [], confidence: 0 };
  }

  const prompt = `You are a content moderation system. Analyze the following content and determine if it violates any content policies.

Content to analyze:
"""
${content}
"""

Respond with a JSON object containing:
- "labels": array of applicable labels from: nsfw, spam, violence, harassment, illegal, copyright, malware
- "confidence": number from 0 to 1 indicating confidence in the assessment
- "reason": brief explanation if any labels apply

If the content is acceptable, return an empty labels array.

Respond ONLY with valid JSON, no other text.`;

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
        max_tokens: 256,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Moderation API error:", error);
      // Fail open - approve if API errors
      return { approved: true, labels: [], confidence: 0, reason: "API error" };
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || "{}";

    // Parse JSON response
    const parsed = JSON.parse(text);
    const labels: string[] = parsed.labels || [];
    const confidence: number = parsed.confidence || 0;
    const reason: string | undefined = parsed.reason;

    // Check if any reject labels are present
    const hasRejectLabel = labels.some((label) =>
      REJECT_LABELS.includes(label as any)
    );

    return {
      approved: !hasRejectLabel && labels.length === 0,
      labels,
      confidence,
      reason,
    };
  } catch (error) {
    console.error("Moderation error:", error);
    // Fail open
    return { approved: true, labels: [], confidence: 0, reason: "Parse error" };
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
        labels: ["suspicious_url"],
        confidence: 0.9,
        reason: `URL matches suspicious pattern: ${pattern}`,
      };
    }
  }

  return { approved: true, labels: [], confidence: 1 };
}

/**
 * Log moderation event to database
 */
export async function logModerationEvent(
  targetType: TargetType,
  targetId: string,
  result: ModerationResult
): Promise<void> {
  const decision = result.approved
    ? "approved"
    : result.labels.some((l) => REJECT_LABELS.includes(l as any))
    ? "rejected"
    : "flagged";

  await db.insert(moderationEvents).values({
    targetType,
    targetId,
    model: MODERATION_MODEL,
    labels: result.labels,
    decision,
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
  const textContent = [
    project.title,
    project.tagline,
    project.description,
  ]
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
