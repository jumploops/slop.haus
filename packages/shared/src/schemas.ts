import { z } from "zod";

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

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CreateFlagInput = z.infer<typeof createFlagSchema>;
export type FeedQuery = z.infer<typeof feedQuerySchema>;
