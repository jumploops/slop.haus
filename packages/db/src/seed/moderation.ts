import { flags, moderationEvents } from "../schema";
import { createRng, insertInChunks, pick, uuidFromSeed } from "./utils";

export type ModerationEventRow = typeof moderationEvents.$inferInsert;
export type FlagRow = typeof flags.$inferInsert;

const moderationLabels = [
  { label: "spam", confidence: 0.72 },
  { label: "self-harm", confidence: 0.12 },
  { label: "violence", confidence: 0.08 },
  { label: "hate", confidence: 0.05 },
  { label: "sexual", confidence: 0.03 },
];

const flagReasons = [
  "Spam or fake project",
  "Low effort content",
  "Inappropriate content",
  "Broken link",
  "Duplicate entry",
];

export function buildModerationEvents(options: {
  seed: string;
  projectIds: string[];
  commentIds: string[];
}): ModerationEventRow[] {
  const rng = createRng(options.seed);
  const rows: ModerationEventRow[] = [];

  const targets = [
    ...options.projectIds.slice(0, 6).map((id) => ({ targetType: "project" as const, targetId: id })),
    ...options.commentIds.slice(0, 6).map((id) => ({ targetType: "comment" as const, targetId: id })),
  ];
  for (const target of targets) {
    const decisionRoll = rng();
    const decision = decisionRoll < 0.7 ? "approved" : decisionRoll < 0.9 ? "flagged" : "rejected";
    const confidenceLevel = decision === "approved" ? "low" : decision === "flagged" ? "medium" : "high";

    rows.push({
      id: uuidFromSeed(`moderation:${target.targetType}:${target.targetId}`),
      targetType: target.targetType,
      targetId: target.targetId,
      model: "claude-3.5-sonnet",
      labels: moderationLabels,
      confidenceLevel,
      decision,
      reason: decision === "approved" ? "Passed automated checks" : "Potential policy issue",
    });
  }

  return rows;
}

export function buildFlags(options: {
  seed: string;
  projectIds: string[];
  commentIds: string[];
  userIds: string[];
}): FlagRow[] {
  const rng = createRng(options.seed);
  const rows: FlagRow[] = [];

  const targetPool = [
    ...options.projectIds.slice(0, 8).map((id) => ({ targetType: "project" as const, targetId: id })),
    ...options.commentIds.slice(0, 8).map((id) => ({ targetType: "comment" as const, targetId: id })),
  ];

  for (const target of targetPool) {
    rows.push({
      id: uuidFromSeed(`flag:${target.targetType}:${target.targetId}`),
      targetType: target.targetType,
      targetId: target.targetId,
      userId: pick(rng, options.userIds),
      reason: pick(rng, flagReasons),
    });
  }

  return rows;
}

export async function seedModerationEvents(db: any, rows: ModerationEventRow[]): Promise<void> {
  await insertInChunks(db, moderationEvents, rows);
}

export async function seedFlags(db: any, rows: FlagRow[]): Promise<void> {
  await insertInChunks(db, flags, rows);
}
