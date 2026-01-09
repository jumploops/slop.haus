import { startWorker } from "./worker";
import { registerAllHandlers } from "./handlers";

console.log("Starting slop.haus worker...");

// Register all job handlers
registerAllHandlers();

// Start the worker
startWorker({
  pollIntervalMs: parseInt(process.env.WORKER_POLL_INTERVAL_MS || "5000", 10),
}).catch((error) => {
  console.error("Worker crashed:", error);
  process.exit(1);
});
