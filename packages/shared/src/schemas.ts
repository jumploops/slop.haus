import { z } from "zod";

// =============================================================================
// Vibe Configuration - Centralized vibe categories and defaults
// =============================================================================

/**
 * Vibe categories used for detailed vibe scoring.
 * Update this array if adding/removing/renaming categories.
 * Changes here will require updates to components using VIBE_CATEGORIES.
 */
export const VIBE_CATEGORIES = ["idea", "design", "code", "prompts", "vibe"] as const;

export type VibeCategory = (typeof VIBE_CATEGORIES)[number];

/**
 * Type for vibe details object - maps each category to a score (0-100)
 */
export type VibeDetails = Record<VibeCategory, number>;

/**
 * Default vibe score for each category (used when no score is set)
 */
export const DEFAULT_VIBE_SCORE = 50;

/**
 * Default vibe details object - all categories set to DEFAULT_VIBE_SCORE
 */
export const DEFAULT_VIBE_DETAILS: VibeDetails = VIBE_CATEGORIES.reduce(
  (acc, category) => ({ ...acc, [category]: DEFAULT_VIBE_SCORE }),
  {} as VibeDetails
);

/**
 * Get vibe details with defaults applied for any missing categories
 */
export function getVibeDetailsWithDefaults(
  details: Record<string, number> | null | undefined
): VibeDetails {
  if (!details) return { ...DEFAULT_VIBE_DETAILS };

  return VIBE_CATEGORIES.reduce(
    (acc, category) => ({
      ...acc,
      [category]: details[category] ?? DEFAULT_VIBE_SCORE,
    }),
    {} as VibeDetails
  );
}

/**
 * Compare two vibe details objects for equality (order-independent)
 * Handles null/undefined by using defaults
 */
export function isEqualVibeDetails(
  a: Record<string, number> | null | undefined,
  b: Record<string, number> | null | undefined
): boolean {
  const aNormalized = getVibeDetailsWithDefaults(a);
  const bNormalized = getVibeDetailsWithDefaults(b);

  for (const category of VIBE_CATEGORIES) {
    if (aNormalized[category] !== bNormalized[category]) return false;
  }

  return true;
}

// =============================================================================
// Project Schemas
// =============================================================================

export const createProjectSchema = z
  .object({
    title: z.string().min(1).max(255),
    tagline: z.string().min(1).max(500),
    description: z.string().max(10000).optional(),
    mainUrl: z.string().url().optional(),
    repoUrl: z.string().url().optional(),
    vibeMode: z.enum(["overview", "detailed"]),
    vibePercent: z.number().min(0).max(100).optional(),
    vibeDetails: z.record(z.number()).optional(),
    tools: z.array(z.string()).optional(),
  })
  .refine((data) => data.mainUrl || data.repoUrl, {
    message: "At least one of mainUrl or repoUrl is required",
  })
  .refine(
    (data) => {
      if (data.vibeMode === "overview") {
        return data.vibePercent !== undefined;
      }
      return true;
    },
    { message: "vibePercent is required when vibeMode is overview" }
  )
  .refine(
    (data) => {
      if (data.vibeMode === "detailed") {
        return data.vibeDetails !== undefined;
      }
      return true;
    },
    { message: "vibeDetails is required when vibeMode is detailed" }
  );

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  tagline: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional(),
  mainUrl: z.string().url().nullable().optional(),
  repoUrl: z.string().url().nullable().optional(),
  vibeMode: z.enum(["overview", "detailed"]).optional(),
  vibePercent: z.number().min(0).max(100).optional(),
  vibeDetails: z.record(z.number()).optional(),
  tools: z.array(z.string()).optional(),
});

export const voteSchema = z.object({
  channel: z.enum(["normal", "dev"]),
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

export const createCommentSchema = z.object({
  body: z.string().min(1).max(10000),
  parentCommentId: z.string().uuid().optional(),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1).max(10000),
});

export const createFlagSchema = z.object({
  targetType: z.enum(["project", "comment"]),
  targetId: z.string().uuid(),
  reason: z.string().min(1).max(255),
});

export const feedQuerySchema = z.object({
  sort: z.enum(["hot", "new", "top"]).default("hot"),
  channel: z.enum(["normal", "dev"]).default("normal"),
  window: z.enum(["24h", "7d", "30d", "all"]).default("all"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Draft schemas
export const analyzeUrlSchema = z.object({
  url: z.string().url(),
});

export const updateDraftSchema = z.object({
  title: z.string().max(255).optional(),
  tagline: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  tools: z.array(z.string()).max(10).optional(),
  vibePercent: z.number().min(0).max(100).optional(),
  mainUrl: z.string().url().optional().nullable(),
  repoUrl: z.string().url().optional().nullable(),
});

export const submitDraftSchema = z.object({
  vibeMode: z.enum(["overview", "detailed"]),
  vibeDetails: z.record(z.string(), z.number()).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CreateFlagInput = z.infer<typeof createFlagSchema>;
export type FeedQuery = z.infer<typeof feedQuerySchema>;
export type AnalyzeUrlInput = z.infer<typeof analyzeUrlSchema>;
export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;
export type SubmitDraftInput = z.infer<typeof submitDraftSchema>;
