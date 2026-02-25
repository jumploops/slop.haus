import { db } from "@slop/db";
import { tools } from "@slop/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import {
  TOOL_MAX_PER_PROJECT,
  canonicalizeToolInput,
  normalizeToolName,
} from "@slop/shared";
import { checkRateLimit } from "./rateLimit";

type ToolSource = "seed" | "user" | "llm" | "admin";
const NEW_TOOL_DAILY_LIMIT = 100;
const NEW_TOOL_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

function logToolEvent(event: string, payload: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      event,
      scope: "tools",
      at: new Date().toISOString(),
      ...payload,
    })
  );
}

export interface ResolvedTool {
  id: string;
  name: string;
  slug: string;
}

export class ToolRateLimitError extends Error {
  readonly resetAt: number;

  constructor(resetAt: number) {
    super("Daily new tag limit reached");
    this.name = "ToolRateLimitError";
    this.resetAt = resetAt;
  }
}

export class ToolBlockedError extends Error {
  readonly blockedTools: string[];

  constructor(blockedTools: string[]) {
    super("One or more tags are blocked");
    this.name = "ToolBlockedError";
    this.blockedTools = blockedTools;
  }
}

interface ResolveAndUpsertToolsOptions {
  rawTools?: string[] | null;
  source: ToolSource;
  createdByUserId?: string | null;
  maxNewTools?: number;
}

export async function resolveAndUpsertTools(
  options: ResolveAndUpsertToolsOptions
): Promise<ResolvedTool[]> {
  const rawTools = options.rawTools ?? [];
  if (rawTools.length === 0) return [];

  // Normalize + dedupe by slug while preserving first-seen casing.
  const requestedBySlug = new Map<string, { name: string; slug: string }>();
  for (const raw of rawTools) {
    const canonical = canonicalizeToolInput(raw);
    if (!canonical) continue;
    if (!requestedBySlug.has(canonical.slug)) {
      requestedBySlug.set(canonical.slug, {
        name: normalizeToolName(canonical.name),
        slug: canonical.slug,
      });
    }
  }

  if (requestedBySlug.size === 0) return [];

  const requested = [...requestedBySlug.values()].slice(0, TOOL_MAX_PER_PROJECT);
  const requestedSlugs = requested.map((item) => item.slug);

  const existingTools = await db
    .select({
      id: tools.id,
      name: tools.name,
      slug: tools.slug,
      status: tools.status,
    })
    .from(tools);

  const existingActiveTools = existingTools.filter((tool) => tool.status === "active");
  const existingBlockedTools = existingTools.filter((tool) => tool.status === "blocked");

  const existingBySlug = new Map(existingActiveTools.map((tool) => [tool.slug, tool]));
  const existingByName = new Map(
    existingActiveTools.map((tool) => [tool.name.toLowerCase(), tool])
  );
  const blockedBySlug = new Map(existingBlockedTools.map((tool) => [tool.slug, tool]));
  const blockedByName = new Map(
    existingBlockedTools.map((tool) => [tool.name.toLowerCase(), tool])
  );

  const toCreate: { name: string; slug: string }[] = [];
  const matchedExistingByRequestedSlug = new Map<string, ResolvedTool>();
  const blockedMatches: string[] = [];

  for (const candidate of requested) {
    const blockedBySlugMatch = blockedBySlug.get(candidate.slug);
    const blockedByNameMatch = blockedByName.get(candidate.name.toLowerCase());
    if (blockedBySlugMatch || blockedByNameMatch) {
      blockedMatches.push((blockedBySlugMatch || blockedByNameMatch)!.name);
      continue;
    }

    const bySlug = existingBySlug.get(candidate.slug);
    if (bySlug) {
      matchedExistingByRequestedSlug.set(candidate.slug, bySlug);
      continue;
    }

    const byName = existingByName.get(candidate.name.toLowerCase());
    if (byName) {
      matchedExistingByRequestedSlug.set(candidate.slug, byName);
      continue;
    }

    toCreate.push(candidate);
  }

  if (blockedMatches.length > 0) {
    const blockedTools = [...new Set(blockedMatches)];
    logToolEvent("blocked_submission", {
      source: options.source,
      userId: options.createdByUserId ?? null,
      blockedTools,
    });
    throw new ToolBlockedError(blockedTools);
  }

  const maxNewTools = options.maxNewTools ?? TOOL_MAX_PER_PROJECT;
  const toolsToInsert = toCreate.slice(0, maxNewTools);

  if (toolsToInsert.length > 0) {
    if (options.createdByUserId) {
      const rateLimit = await checkRateLimit(
        `tools-new:user:${options.createdByUserId}`,
        {
          windowMs: NEW_TOOL_DAILY_WINDOW_MS,
          maxRequests: NEW_TOOL_DAILY_LIMIT,
        },
        toolsToInsert.length
      );

      if (!rateLimit.allowed) {
        logToolEvent("rate_limited", {
          source: options.source,
          userId: options.createdByUserId,
          attemptedNewToolCount: toolsToInsert.length,
          limit: NEW_TOOL_DAILY_LIMIT,
          resetAt: new Date(rateLimit.resetAt).toISOString(),
        });
        throw new ToolRateLimitError(rateLimit.resetAt);
      }
    }

    const inserted = await db
      .insert(tools)
      .values(
        toolsToInsert.map((tool) => ({
          name: tool.name,
          slug: tool.slug,
          status: "active" as const,
          source: options.source,
          createdByUserId: options.createdByUserId ?? null,
        }))
      )
      .onConflictDoNothing()
      .returning({ slug: tools.slug });

    if (inserted.length > 0) {
      logToolEvent("created", {
        source: options.source,
        userId: options.createdByUserId ?? null,
        createdCount: inserted.length,
        createdSlugs: inserted.map((tool) => tool.slug),
      });
    }
  }

  const resolved = await db
    .select({
      id: tools.id,
      name: tools.name,
      slug: tools.slug,
    })
    .from(tools)
    .where(
      and(
        eq(tools.status, "active"),
        inArray(tools.slug, requestedSlugs)
      )
    );

  const resolvedBySlug = new Map(
    resolved.map((tool) => [tool.slug, tool])
  );

  return requested
    .map(
      (candidate) =>
        matchedExistingByRequestedSlug.get(candidate.slug) ??
        resolvedBySlug.get(candidate.slug)
    )
    .filter((tool): tool is ResolvedTool => Boolean(tool));
}
