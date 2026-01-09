import { db } from "@slop/db";
import { projects, moderationEvents } from "@slop/db/schema";
import { eq } from "drizzle-orm";

export interface ModerateAsyncPayload {
  projectId: string;
  content?: string; // Optional additional content to moderate (e.g., README)
}

const MODERATION_MODEL = "claude-3-haiku-20240307";

interface ModerationResult {
  approved: boolean;
  labels: string[];
  confidence: number;
  reason?: string;
}

async function moderateText(content: string): Promise<ModerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set, skipping async moderation");
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
      console.error("Moderation API error:", await response.text());
      return { approved: true, labels: [], confidence: 0, reason: "API error" };
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || "{}";
    const parsed = JSON.parse(text);

    const labels: string[] = parsed.labels || [];
    const rejectLabels = ["nsfw", "illegal", "malware"];
    const hasRejectLabel = labels.some((l) => rejectLabels.includes(l));

    return {
      approved: !hasRejectLabel && labels.length === 0,
      labels,
      confidence: parsed.confidence || 0,
      reason: parsed.reason,
    };
  } catch (error) {
    console.error("Moderation error:", error);
    return { approved: true, labels: [], confidence: 0, reason: "Parse error" };
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
  const decision = result.approved
    ? "approved"
    : result.labels.some((l) => ["nsfw", "illegal", "malware"].includes(l))
    ? "rejected"
    : "flagged";

  await db.insert(moderationEvents).values({
    targetType: "project",
    targetId: projectId,
    model: MODERATION_MODEL,
    labels: result.labels,
    decision,
    reason: result.reason,
  });

  // If flagged, hide the project
  if (!result.approved) {
    await db
      .update(projects)
      .set({ status: "hidden", updatedAt: new Date() })
      .where(eq(projects.id, projectId));

    console.log(`Project ${project.slug} hidden by async moderation: ${result.reason}`);
  } else {
    console.log(`Project ${project.slug} passed async moderation`);
  }
}
