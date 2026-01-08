import { Context, Next } from "hono";
import { auth } from "../lib/auth";
import { db } from "@slop/db";
import { account } from "@slop/db/schema";
import { eq } from "drizzle-orm";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "user" | "mod" | "admin";
  devVerified: boolean;
};

export type AuthSession = {
  user: AuthUser;
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
  };
};

// Get session from request (returns null if not authenticated)
export async function getSession(c: Context): Promise<AuthSession | null> {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) return null;

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image ?? null,
      role: (session.user as any).role || "user",
      devVerified: (session.user as any).devVerified || false,
    },
    session: {
      id: session.session.id,
      userId: session.session.userId,
      token: session.session.token,
      expiresAt: session.session.expiresAt,
    },
  };
}

// Check if user has GitHub account linked
export async function hasGitHubLinked(userId: string): Promise<boolean> {
  const accounts = await db
    .select()
    .from(account)
    .where(eq(account.userId, userId));

  return accounts.some((a) => a.providerId === "github");
}

// Get user's linked providers
export async function getLinkedProviders(
  userId: string
): Promise<{ provider: string; accountId: string }[]> {
  const accounts = await db
    .select({
      provider: account.providerId,
      accountId: account.accountId,
    })
    .from(account)
    .where(eq(account.userId, userId));

  return accounts;
}

// Middleware: require authentication
export function requireAuth() {
  return async (c: Context, next: Next) => {
    const session = await getSession(c);

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("session", session);
    await next();
  };
}

// Middleware: require GitHub linked (for project submission)
export function requireGitHub() {
  return async (c: Context, next: Next) => {
    const session = await getSession(c);

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const hasGitHub = await hasGitHubLinked(session.user.id);
    if (!hasGitHub) {
      return c.json(
        { error: "GitHub account required", code: "GITHUB_REQUIRED" },
        403
      );
    }

    c.set("session", session);
    await next();
  };
}

// Middleware: require mod or admin role
export function requireMod() {
  return async (c: Context, next: Next) => {
    const session = await getSession(c);

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (session.user.role !== "mod" && session.user.role !== "admin") {
      return c.json({ error: "Forbidden" }, 403);
    }

    c.set("session", session);
    await next();
  };
}

// Middleware: require admin role
export function requireAdmin() {
  return async (c: Context, next: Next) => {
    const session = await getSession(c);

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (session.user.role !== "admin") {
      return c.json({ error: "Forbidden" }, 403);
    }

    c.set("session", session);
    await next();
  };
}
