"use client";

import { useEffect, useRef } from "react";
import { mutate } from "swr";
import { signIn, useSession } from "@/lib/auth-client";

export function EnsureAnonymous() {
  const hasAttempted = useRef(false);
  const { data: session, isPending, refetch } = useSession();

  useEffect(() => {
    if (hasAttempted.current || isPending) {
      return;
    }

    if (session) {
      hasAttempted.current = true;
      return;
    }

    hasAttempted.current = true;

    void signIn
      .anonymous()
      .then(async (result) => {
        if (result?.error) {
          console.warn("[auth] anonymous sign-in failed", result.error);
          return;
        }

        await refetch();
        void mutate("visitor-count");
      })
      .catch((error) => {
        console.warn("[auth] anonymous sign-in failed", error);
      });
  }, [session, isPending, refetch]);

  return null;
}
