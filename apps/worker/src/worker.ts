import { db } from "@slop/db";
import { jobs } from "@slop/db/schema";
import { eq, and, lte, sql, isNull, or } from "drizzle-orm";

export type JobHandler = (payload: unknown) => Promise<void>;

const handlers = new Map<string, JobHandler>();

export function registerHandler(type: string, handler: JobHandler) {
  handlers.set(type, handler);
}

// Claim a job by atomically setting status to 'processing'
async function claimJob() {
  const now = new Date();

  // Find and claim a job in one transaction
  const [claimed] = await db
    .update(jobs)
    .set({
      status: "processing",
      startedAt: now,
    })
    .where(
      and(
        eq(jobs.status, "pending"),
        lte(jobs.runAt, now)
      )
    )
    .returning();

  return claimed || null;
}

// Process a single job
async function processJob(job: typeof jobs.$inferSelect) {
  const handler = handlers.get(job.type);

  if (!handler) {
    console.error(`No handler registered for job type: ${job.type}`);
    await db
      .update(jobs)
      .set({
        status: "failed",
        error: `No handler for job type: ${job.type}`,
        completedAt: new Date(),
      })
      .where(eq(jobs.id, job.id));
    return;
  }

  try {
    await handler(job.payload);

    // Mark as completed
    await db
      .update(jobs)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(jobs.id, job.id));

    console.log(`Job ${job.id} (${job.type}) completed successfully`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const attempts = job.attempts + 1;

    if (attempts >= job.maxAttempts) {
      // Max attempts reached, mark as failed
      await db
        .update(jobs)
        .set({
          status: "failed",
          attempts,
          error: errorMessage,
          completedAt: new Date(),
        })
        .where(eq(jobs.id, job.id));

      console.error(`Job ${job.id} (${job.type}) failed after ${attempts} attempts: ${errorMessage}`);
    } else {
      // Reschedule with exponential backoff
      const backoffMs = Math.min(1000 * Math.pow(2, attempts), 30 * 60 * 1000); // Max 30 min
      const runAt = new Date(Date.now() + backoffMs);

      await db
        .update(jobs)
        .set({
          status: "pending",
          attempts,
          error: errorMessage,
          runAt,
          startedAt: null,
        })
        .where(eq(jobs.id, job.id));

      console.warn(`Job ${job.id} (${job.type}) failed, retry ${attempts}/${job.maxAttempts} scheduled for ${runAt.toISOString()}`);
    }
  }
}

// Main worker loop
export async function startWorker(options: { pollIntervalMs?: number } = {}) {
  const pollIntervalMs = options.pollIntervalMs ?? 5000;

  console.log(`Worker started, polling every ${pollIntervalMs}ms`);

  // Reset any stale 'processing' jobs (from crashed workers)
  const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
  const staleReset = await db
    .update(jobs)
    .set({
      status: "pending",
      startedAt: null,
    })
    .where(
      and(
        eq(jobs.status, "processing"),
        lte(jobs.startedAt, staleThreshold)
      )
    )
    .returning();

  if (staleReset.length > 0) {
    console.log(`Reset ${staleReset.length} stale jobs`);
  }

  while (true) {
    try {
      const job = await claimJob();

      if (job) {
        await processJob(job);
      } else {
        // No jobs available, wait before polling again
        await sleep(pollIntervalMs);
      }
    } catch (error) {
      console.error("Worker error:", error);
      await sleep(pollIntervalMs);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
