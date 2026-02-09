import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@slop/db";
import * as schema from "@slop/db/schema";
import {
  normalizeUsername,
  validateUsername,
} from "@slop/shared";
import {
  ensureUniqueUsername,
  generateRandomUsernameCandidate,
  isUsernameAvailable,
  parseUsernameSource,
  usernameCandidateFromEmail,
} from "./username";

function resolveCreateUsernameCandidate(userData: Record<string, unknown>): string {
  if (typeof userData.username === "string" && userData.username.trim().length > 0) {
    return userData.username;
  }

  if (typeof userData.name === "string" && userData.name.trim().length > 0) {
    return userData.name;
  }

  if (typeof userData.email === "string" && userData.email.trim().length > 0) {
    return usernameCandidateFromEmail(userData.email);
  }

  return generateRandomUsernameCandidate();
}

export const auth = betterAuth({
  baseURL: process.env.API_URL || "http://localhost:3001",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      mapProfileToUser: () => {
        const username = generateRandomUsernameCandidate();
        return {
          username,
          usernameSource: "google_random",
          // Better Auth requires `name`; mirror username internally.
          name: username,
        };
      },
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      mapProfileToUser: (profile) => {
        const login =
          typeof profile.login === "string" && profile.login.trim().length > 0
            ? profile.login
            : "user";
        const username = normalizeUsername(login);
        return {
          username,
          usernameSource: "github",
          name: username || "user",
        };
      },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      // No trustedProviders - requires explicit linking via linkSocial()
      // This prevents auto-merging accounts by email on sign-in
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
      },
      usernameSource: {
        type: "string",
        required: false,
        defaultValue: "manual",
        input: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // Cannot be set by client
      },
      devVerified: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (userData) => {
          const source = parseUsernameSource(userData.usernameSource);
          const candidate = resolveCreateUsernameCandidate(userData);
          const username = await ensureUniqueUsername(candidate);

          return {
            data: {
              ...userData,
              username,
              usernameSource: source,
              // Keep Better Auth `name` aligned with username.
              name: username,
            },
          };
        },
      },
      update: {
        before: async (userData, context) => {
          const usernameInput =
            typeof userData.username === "string"
              ? userData.username
              : typeof userData.name === "string"
                ? userData.name
                : null;

          if (!usernameInput) {
            return {
              data: userData,
            };
          }

          const normalized = normalizeUsername(usernameInput);
          const validation = validateUsername(normalized);
          if (!validation.valid) {
            throw new Error(validation.reason || "Invalid username");
          }

          const targetUserId =
            typeof userData.id === "string"
              ? userData.id
              : context?.context.session?.user.id;

          const available = await isUsernameAvailable(normalized, {
            excludeUserId: targetUserId,
          });

          if (!available) {
            throw new Error("Username is already taken");
          }

          return {
            data: {
              ...userData,
              username: normalized,
              usernameSource: "manual",
              // Keep Better Auth `name` aligned with username.
              name: normalized,
            },
          };
        },
      },
    },
  },
  trustedOrigins: [process.env.APP_URL || "http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
