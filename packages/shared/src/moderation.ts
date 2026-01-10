// Confidence levels for moderation labels
export const CONFIDENCE_LEVELS = ["low", "medium", "high", "absolute"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

// Available moderation labels
export const MODERATION_LABELS = [
  "nsfw",
  "spam",
  "violence",
  "harassment",
  "illegal",
  "copyright",
  "malware",
] as const;
export type ModerationLabel = (typeof MODERATION_LABELS)[number];

// Labels that trigger immediate rejection at high/absolute confidence
export const REJECT_LABELS: ModerationLabel[] = ["nsfw", "illegal", "malware"];

// A label with its confidence score
export interface LabelWithConfidence {
  label: ModerationLabel;
  confidence: ConfidenceLevel;
}

// Raw response from the LLM
export interface ModerationLLMResponse {
  reason: string;
  labels: LabelWithConfidence[];
}

// Moderation decisions
export type ModerationDecision = "approved" | "flagged" | "hidden" | "rejected";

// Evaluated moderation result
export interface ModerationResult {
  approved: boolean;
  decision: ModerationDecision;
  labels: LabelWithConfidence[];
  highestConfidence: ConfidenceLevel | "none";
  reason: string;
}

// Target types for moderation
export type ModerationTargetType = "project" | "comment" | "revision";

/**
 * Evaluate a moderation response and determine the appropriate action.
 *
 * Decision matrix:
 * - No labels → approved
 * - Low/medium confidence → approved (logged for analysis)
 * - High confidence + reject label → hidden
 * - High confidence + non-reject label → flagged (published but queued)
 * - Absolute confidence + reject label → rejected
 * - Absolute confidence + non-reject label → hidden
 */
export function evaluateModerationResult(
  response: ModerationLLMResponse
): ModerationResult {
  const { reason, labels } = response;

  // No labels = approved
  if (!labels || labels.length === 0) {
    return {
      approved: true,
      decision: "approved",
      labels: [],
      highestConfidence: "none",
      reason,
    };
  }

  // Find highest confidence level
  const confidenceOrder: ConfidenceLevel[] = ["low", "medium", "high", "absolute"];
  const highestConfidence = labels.reduce((highest, { confidence }) => {
    return confidenceOrder.indexOf(confidence) > confidenceOrder.indexOf(highest)
      ? confidence
      : highest;
  }, "low" as ConfidenceLevel);

  // Low/medium confidence = approve but log
  if (highestConfidence === "low" || highestConfidence === "medium") {
    return {
      approved: true,
      decision: "approved",
      labels,
      highestConfidence,
      reason,
    };
  }

  // Check for reject labels at high/absolute confidence
  const hasHighRejectLabel = labels.some(
    ({ label, confidence }) =>
      REJECT_LABELS.includes(label) &&
      (confidence === "high" || confidence === "absolute")
  );

  const hasAbsoluteRejectLabel = labels.some(
    ({ label, confidence }) =>
      REJECT_LABELS.includes(label) && confidence === "absolute"
  );

  const hasAbsoluteAnyLabel = labels.some(
    ({ confidence }) => confidence === "absolute"
  );

  // Absolute confidence + reject label = rejected
  if (hasAbsoluteRejectLabel) {
    return {
      approved: false,
      decision: "rejected",
      labels,
      highestConfidence,
      reason,
    };
  }

  // High confidence + reject label = hidden
  if (hasHighRejectLabel) {
    return {
      approved: false,
      decision: "hidden",
      labels,
      highestConfidence,
      reason,
    };
  }

  // Absolute confidence + non-reject label = hidden
  if (hasAbsoluteAnyLabel) {
    return {
      approved: false,
      decision: "hidden",
      labels,
      highestConfidence,
      reason,
    };
  }

  // High confidence on non-reject labels = flagged (still published)
  return {
    approved: true,
    decision: "flagged",
    labels,
    highestConfidence,
    reason,
  };
}
