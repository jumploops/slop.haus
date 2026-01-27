import { startWorker } from "./worker";
import { registerAllHandlers } from "./handlers";
import { handleCleanupDrafts } from "./handlers/cleanup-drafts";
import { acquireLock } from "./lib/locks";
import { randomUUID } from "crypto";

console.log("Starting slop.haus worker...");

// Register all job handlers
registerAllHandlers();

const WORKER_ID = process.env.WORKER_ID || randomUUID();

// Schedule draft cleanup every hour
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_LOCK_TTL_MS = 55 * 60 * 1000; // 55 minutes

setInterval(async () => {
  try {
    const acquired = await acquireLock(
      "cleanup_drafts",
      WORKER_ID,
      CLEANUP_LOCK_TTL_MS
    );
    if (!acquired) {
      return;
    }

    console.log("Running scheduled draft cleanup...");
    await handleCleanupDrafts();
  } catch (error) {
    console.error("Cleanup job failed:", error);
  }
}, CLEANUP_INTERVAL_MS);

// Run cleanup on startup (after a short delay to let DB connect)
setTimeout(() => {
  acquireLock("cleanup_drafts", WORKER_ID, CLEANUP_LOCK_TTL_MS)
    .then((acquired) => {
      if (!acquired) return;
      return handleCleanupDrafts();
    })
    .catch((error) => {
      console.error("Initial cleanup failed:", error);
    });
}, 5000);

// Start the worker
startWorker({
  pollIntervalMs: parseInt(process.env.WORKER_POLL_INTERVAL_MS || "5000", 10),
}).catch((error) => {
  console.error("Worker crashed:", error);
  process.exit(1);
});
