import { Hono } from "hono";
import {
  getSession,
  getLinkedProviders,
  requireAuth,
} from "../middleware/auth";
import { issueDevCredential, hasDevCredential } from "../lib/rater";

const authRoutes = new Hono();

// Get current user info
authRoutes.get("/me", async (c) => {
  const session = await getSession(c);

  if (!session) {
    return c.json({ user: null });
  }

  // Get linked accounts
  const providers = await getLinkedProviders(session.user.id);
  const providerNames = providers.map((p) => p.provider);

  return c.json({
    user: {
      ...session.user,
      providers: providerNames,
      hasGitHub: providerNames.includes("github"),
      hasGoogle: providerNames.includes("google"),
    },
  });
});

// Get linked accounts
authRoutes.get("/accounts", requireAuth(), async (c) => {
  const session = c.get("session");
  const providers = await getLinkedProviders(session.user.id);

  return c.json({
    accounts: providers.map((p) => ({
      provider: p.provider,
      accountId: p.accountId,
    })),
  });
});

// Issue dev credential for anonymous dev voting
authRoutes.post("/dev-credential", requireAuth(), async (c) => {
  const session = c.get("session");

  // Must be a verified dev
  if (!session.user.devVerified) {
    return c.json(
      { error: "Dev verification required", code: "NOT_VERIFIED_DEV" },
      403
    );
  }

  // Check if already has credential
  if (hasDevCredential(c)) {
    return c.json({ success: true, message: "Dev credential already exists" });
  }

  // Issue new credential
  issueDevCredential(c);

  return c.json({ success: true, message: "Dev credential issued" });
});

// Check dev credential status
authRoutes.get("/dev-credential", async (c) => {
  return c.json({
    hasCredential: hasDevCredential(c),
  });
});

export { authRoutes };
