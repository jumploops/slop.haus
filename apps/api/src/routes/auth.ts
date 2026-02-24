import { Hono } from "hono";
import { db } from "@slop/db";
import { account } from "@slop/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "../lib/auth";
import {
  getSession,
  getLinkedProviders,
  requireAuth,
} from "../middleware/auth";
import { issueDevCredential, hasDevCredential } from "../lib/rater";

const authRoutes = new Hono();

interface GitHubRepoApiItem {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  archived: boolean;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
}

function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;

  const next = linkHeader
    .split(",")
    .map((part) => part.trim())
    .find((part) => part.endsWith('rel="next"'));

  if (!next) return null;

  const match = next.match(/<([^>]+)>/);
  return match?.[1] || null;
}

async function fetchAllGitHubPublicRepos(accessToken: string) {
  const repos: GitHubRepoApiItem[] = [];

  const initialUrl = new URL("https://api.github.com/user/repos");
  initialUrl.searchParams.set("visibility", "public");
  initialUrl.searchParams.set(
    "affiliation",
    "owner,collaborator,organization_member"
  );
  initialUrl.searchParams.set("sort", "updated");
  initialUrl.searchParams.set("direction", "desc");
  initialUrl.searchParams.set("per_page", "100");
  initialUrl.searchParams.set("page", "1");

  let nextUrl: string | null = initialUrl.toString();

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "slop.haus",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(
        `GitHub API request failed (${response.status}): ${bodyText.slice(0, 200)}`
      );
    }

    const pageData = (await response.json()) as GitHubRepoApiItem[];
    repos.push(...pageData);
    nextUrl = parseNextLink(response.headers.get("link"));
  }

  return repos.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    description: repo.description,
    isPrivate: repo.private,
    isFork: repo.fork,
    isArchived: repo.archived,
    language: repo.language,
    stargazersCount: repo.stargazers_count,
    updatedAt: repo.updated_at,
  }));
}

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

// Get authenticated user's public GitHub repos
authRoutes.get("/github/repos", requireAuth(), async (c) => {
  const session = c.get("session");
  const providers = await getLinkedProviders(session.user.id);
  const hasGitHub = providers.some((p) => p.provider === "github");

  if (!hasGitHub) {
    return c.json({
      githubLinked: false,
      repos: [],
    });
  }

  let tokenResult: {
    accessToken: string;
    accessTokenExpiresAt: Date | undefined;
    scopes: string[];
    idToken: string | undefined;
  };

  try {
    tokenResult = await auth.api.getAccessToken({
      body: { providerId: "github" },
      headers: c.req.raw.headers,
    });
  } catch (error) {
    console.error("[auth] failed to get GitHub access token", error);
    return c.json(
      {
        error: "Failed to retrieve GitHub access token",
        code: "GITHUB_TOKEN_ERROR",
      },
      502
    );
  }

  if (!tokenResult.accessToken) {
    return c.json(
      {
        error: "GitHub access token unavailable",
        code: "GITHUB_TOKEN_MISSING",
      },
      502
    );
  }

  try {
    const repos = await fetchAllGitHubPublicRepos(tokenResult.accessToken);
    return c.json({
      githubLinked: true,
      repos,
    });
  } catch (error) {
    console.error("[auth] failed to fetch GitHub repos", error);
    return c.json(
      {
        error: "Failed to fetch GitHub repositories",
        code: "GITHUB_REPOS_FETCH_FAILED",
      },
      502
    );
  }
});

// Unlink a provider account
authRoutes.delete("/unlink/:provider", requireAuth(), async (c) => {
  const session = c.get("session");
  const provider = c.req.param("provider");

  // Validate provider
  if (!["google", "github"].includes(provider)) {
    return c.json({ error: "Invalid provider" }, 400);
  }

  // Get user's linked accounts
  const accounts = await db
    .select()
    .from(account)
    .where(eq(account.userId, session.user.id));

  // Can't unlink if only one account
  if (accounts.length <= 1) {
    return c.json(
      { error: "Cannot unlink your only authentication method", code: "LAST_ACCOUNT" },
      400
    );
  }

  // Find the account to unlink
  const accountToUnlink = accounts.find((a) => a.providerId === provider);
  if (!accountToUnlink) {
    return c.json({ error: "Provider not linked", code: "NOT_LINKED" }, 404);
  }

  // Delete the account
  await db
    .delete(account)
    .where(
      and(
        eq(account.userId, session.user.id),
        eq(account.providerId, provider)
      )
    );

  return c.json({ success: true, message: `${provider} account unlinked` });
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
