import { createAuthClient } from "better-auth/react";
import { anonymousClient, inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  plugins: [
    anonymousClient(),
    inferAdditionalFields({
      user: {
        username: {
          type: "string",
        },
        usernameSource: {
          type: "string",
        },
        role: {
          type: "string",
        },
        devVerified: {
          type: "boolean",
        },
        isAnonymous: {
          type: "boolean",
        },
      },
    }),
  ],
});

export const {
  signIn,
  signOut,
  useSession,
  linkSocial,
  unlinkAccount,
  updateUser,
} = authClient;
