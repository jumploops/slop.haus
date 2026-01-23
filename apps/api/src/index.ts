import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "./lib/auth";
import { authRoutes } from "./routes/auth";
import { projectRoutes } from "./routes/projects";
import { toolRoutes } from "./routes/tools";
import { likeRoutes } from "./routes/likes";
import { commentRoutes } from "./routes/comments";
import { projectCommentRoutes } from "./routes/projectComments";
import { favoriteRoutes } from "./routes/favorites";
import { userRoutes } from "./routes/users";
import { adminRoutes } from "./routes/admin";
import { flagRoutes } from "./routes/flags";
import { draftRoutes } from "./routes/drafts";
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

// Security headers for API routes only (not static uploads)
app.use("/api/*", secureHeaders());

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Static file serving for uploads (MVP - local storage)
app.use(
  "/uploads/*",
  serveStatic({
    root: process.env.STORAGE_LOCAL_PATH || "./uploads",
    rewriteRequestPath: (path) => path.replace(/^\/uploads/, ""),
  })
);

// Better Auth handler - handles all /api/auth/* routes
// This handles: sign in, sign out, callbacks, account linking, etc.
app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// API v1 routes
app.route("/api/v1/auth", authRoutes);
app.route("/api/v1/projects", projectRoutes);
app.route("/api/v1/projects", likeRoutes); // Like routes under projects
app.route("/api/v1/projects", projectCommentRoutes); // Comment list/create under projects
app.route("/api/v1/projects", favoriteRoutes); // Favorite routes under projects
app.route("/api/v1/comments", commentRoutes); // Comment edit/delete by ID
app.route("/api/v1/users", userRoutes); // User routes
app.route("/api/v1/admin", adminRoutes); // Admin routes
app.route("/api/v1/flags", flagRoutes); // Flagging routes
app.route("/api/v1/tools", toolRoutes);
app.route("/api/v1/drafts", draftRoutes); // Draft submission routes

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
