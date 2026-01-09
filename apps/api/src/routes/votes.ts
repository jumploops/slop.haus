import { Hono } from "hono";
import { db } from "@slop/db";
import { projects, projectVotes } from "@slop/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { voteSchema } from "@slop/shared";
import {
  getOrCreatePublicRater,
  getPublicRater,
  getDevRater,
} from "../lib/rater";
import { checkRateLimit, VOTE_RATE_LIMITS } from "../lib/rateLimit";

const voteRoutes = new Hono();

// Vote on a project
voteRoutes.post("/:slug/vote", async (c) => {
  const slug = c.req.param("slug");
  const body = await c.req.json();

  // Validate input
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", details: parsed.error.issues },
      400
    );
  }

  const { channel, value } = parsed.data;

  // Get the project
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, slug));

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  // Get rater key based on channel
  let raterKeyHash: string;

  if (channel === "normal") {
    raterKeyHash = getOrCreatePublicRater(c);
  } else {
    // Dev channel requires dev credential
    const devRater = getDevRater(c);
    if (!devRater) {
      return c.json(
        {
          error: "Dev credential required",
          code: "DEV_CREDENTIAL_REQUIRED",
        },
        403
      );
    }
    raterKeyHash = devRater;
  }

  // Rate limiting: max 30 votes/minute per rater
  const raterLimit = checkRateLimit(
    `vote:rater:${raterKeyHash}`,
    VOTE_RATE_LIMITS.perRater
  );
  if (!raterLimit.allowed) {
    return c.json(
      {
        error: "Too many votes. Please slow down.",
        code: "RATE_LIMITED",
        retryAfter: Math.ceil((raterLimit.resetAt - Date.now()) / 1000),
      },
      429
    );
  }

  // Rate limiting: max 10 vote changes/hour per project+rater
  const projectRaterLimit = checkRateLimit(
    `vote:project:${project.id}:${raterKeyHash}`,
    VOTE_RATE_LIMITS.perProjectRater
  );
  if (!projectRaterLimit.allowed) {
    return c.json(
      {
        error: "Too many vote changes on this project. Please wait.",
        code: "RATE_LIMITED",
        retryAfter: Math.ceil((projectRaterLimit.resetAt - Date.now()) / 1000),
      },
      429
    );
  }

  // Handle the vote in a transaction
  await db.transaction(async (tx) => {
    // Find existing vote
    const [existingVote] = await tx
      .select()
      .from(projectVotes)
      .where(
        and(
          eq(projectVotes.projectId, project.id),
          eq(projectVotes.raterType, channel === "normal" ? "public" : "dev"),
          eq(projectVotes.raterKeyHash, raterKeyHash)
        )
      );

    const raterType = channel === "normal" ? "public" : "dev";
    const scoreField = channel === "normal" ? "normalScore" : "devScore";
    const upField = channel === "normal" ? "normalUp" : "devUp";
    const downField = channel === "normal" ? "normalDown" : "devDown";

    if (value === 0) {
      // Remove vote
      if (existingVote) {
        await tx
          .delete(projectVotes)
          .where(eq(projectVotes.id, existingVote.id));

        // Update counts
        if (existingVote.value === 1) {
          await tx
            .update(projects)
            .set({
              [upField]: sql`${projects[upField]} - 1`,
              [scoreField]: sql`${projects[scoreField]} - 1`,
            })
            .where(eq(projects.id, project.id));
        } else if (existingVote.value === -1) {
          await tx
            .update(projects)
            .set({
              [downField]: sql`${projects[downField]} - 1`,
              [scoreField]: sql`${projects[scoreField]} + 1`,
            })
            .where(eq(projects.id, project.id));
        }
      }
    } else if (existingVote) {
      // Update existing vote
      if (existingVote.value !== value) {
        await tx
          .update(projectVotes)
          .set({ value })
          .where(eq(projectVotes.id, existingVote.id));

        // Update counts based on vote change
        if (existingVote.value === 1 && value === -1) {
          // Changed from up to down
          await tx
            .update(projects)
            .set({
              [upField]: sql`${projects[upField]} - 1`,
              [downField]: sql`${projects[downField]} + 1`,
              [scoreField]: sql`${projects[scoreField]} - 2`,
            })
            .where(eq(projects.id, project.id));
        } else if (existingVote.value === -1 && value === 1) {
          // Changed from down to up
          await tx
            .update(projects)
            .set({
              [upField]: sql`${projects[upField]} + 1`,
              [downField]: sql`${projects[downField]} - 1`,
              [scoreField]: sql`${projects[scoreField]} + 2`,
            })
            .where(eq(projects.id, project.id));
        }
      }
    } else {
      // Insert new vote
      await tx.insert(projectVotes).values({
        projectId: project.id,
        raterType,
        raterKeyHash,
        value,
      });

      // Update counts
      if (value === 1) {
        await tx
          .update(projects)
          .set({
            [upField]: sql`${projects[upField]} + 1`,
            [scoreField]: sql`${projects[scoreField]} + 1`,
          })
          .where(eq(projects.id, project.id));
      } else if (value === -1) {
        await tx
          .update(projects)
          .set({
            [downField]: sql`${projects[downField]} + 1`,
            [scoreField]: sql`${projects[scoreField]} - 1`,
          })
          .where(eq(projects.id, project.id));
      }
    }
  });

  // Get updated project scores
  const [updated] = await db
    .select({
      normalUp: projects.normalUp,
      normalDown: projects.normalDown,
      normalScore: projects.normalScore,
      devUp: projects.devUp,
      devDown: projects.devDown,
      devScore: projects.devScore,
    })
    .from(projects)
    .where(eq(projects.id, project.id));

  return c.json({
    success: true,
    scores: updated,
  });
});

// Get vote state for a project
voteRoutes.get("/:slug/vote-state", async (c) => {
  const slug = c.req.param("slug");

  // Get the project
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, slug));

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  // Get rater keys
  const publicRater = getPublicRater(c);
  const devRater = getDevRater(c);

  let normalVote: number | null = null;
  let devVote: number | null = null;

  // Check public vote
  if (publicRater) {
    const [vote] = await db
      .select({ value: projectVotes.value })
      .from(projectVotes)
      .where(
        and(
          eq(projectVotes.projectId, project.id),
          eq(projectVotes.raterType, "public"),
          eq(projectVotes.raterKeyHash, publicRater)
        )
      );
    normalVote = vote?.value ?? null;
  }

  // Check dev vote
  if (devRater) {
    const [vote] = await db
      .select({ value: projectVotes.value })
      .from(projectVotes)
      .where(
        and(
          eq(projectVotes.projectId, project.id),
          eq(projectVotes.raterType, "dev"),
          eq(projectVotes.raterKeyHash, devRater)
        )
      );
    devVote = vote?.value ?? null;
  }

  return c.json({
    normal: normalVote,
    dev: devVote,
    hasDevCredential: !!devRater,
  });
});

export { voteRoutes };
