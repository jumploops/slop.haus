import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./lib/auth";
import { authRoutes } from "./routes/auth";
import { projectRoutes } from "./routes/projects";
import { toolRoutes } from "./routes/tools";
import { voteRoutes } from "./routes/votes";
import { commentRoutes } from "./routes/comments";
import type { AuthSession } from "./middleware/auth";

// Extend Hono context with session
declare module "hono" {
  interface ContextVariableMap {
    session: AuthSession;
  }
}

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Better Auth handler - handles all /api/auth/* routes
// This handles: sign in, sign out, callbacks, account linking, etc.
app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// API v1 routes
app.route("/api/v1/auth", authRoutes);
app.route("/api/v1/projects", projectRoutes);
app.route("/api/v1/projects", voteRoutes); // Vote routes under projects
app.route("/api/v1/projects", commentRoutes); // Comment routes under projects
app.route("/api/v1/comments", commentRoutes); // Also mount for edit/delete by ID
app.route("/api/v1/tools", toolRoutes);

// API info
app.get("/api/v1", (c) => {
  return c.json({ message: "slop.haus API v1" });
});

const port = parseInt(process.env.PORT || "3001", 10);

console.log(`Server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
export { auth };
