import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  plugins: [
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
