import { Context, Next } from "hono";
import { auth } from "../lib/auth";
import { db } from "@slop/db";
import { account } from "@slop/db/schema";
import { eq } from "drizzle-orm";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  image: string | null;
  role: "user" | "mod" | "admin";
  devVerified: boolean;
  isAnonymous: boolean;
  usernameSource: "github" | "google_random" | "manual" | "seed";
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

// Better Auth user type with our custom fields
interface BetterAuthUserWithCustomFields {
  id: string;
  name: string;
  username?: string;
  usernameSource?: "github" | "google_random" | "manual" | "seed";
  email: string;
  image: string | null;
  role?: "user" | "mod" | "admin";
  devVerified?: boolean;
  isAnonymous?: boolean;
}

// Get session from request (returns null if not authenticated)
export async function getSession(c: Context): Promise<AuthSession | null> {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) return null;

  // Cast to our extended type for custom fields
  const user = session.user as BetterAuthUserWithCustomFields;

  return {
    user: {
      id: user.id,
      username: user.username || user.name,
      email: user.email,
      image: user.image ?? null,
      role: user.role || "user",
      devVerified: user.devVerified || false,
      isAnonymous: user.isAnonymous || false,
      usernameSource: user.usernameSource || "manual",
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

    if (!session || session.user.isAnonymous) {
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

    if (!session || session.user.isAnonymous) {
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

    if (!session || session.user.isAnonymous) {
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

    if (!session || session.user.isAnonymous) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (session.user.role !== "admin") {
      return c.json({ error: "Forbidden" }, 403);
    }

    c.set("session", session);
    await next();
  };
}
