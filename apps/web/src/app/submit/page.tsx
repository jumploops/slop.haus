"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { fetchCurrentUser } from "@/lib/api/auth";

export default function SubmitPage() {
  return (
    <RequireAuth>
      <SubmitDefaultRedirect />
    </RequireAuth>
  );
}

function SubmitDefaultRedirect() {
  const router = useRouter();
  const { data: user, isLoading } = useSWR("/auth/me", fetchCurrentUser);

  useEffect(() => {
    if (isLoading) return;
    router.replace(user?.hasGitHub ? "/submit/repo" : "/submit/url");
  }, [isLoading, router, user?.hasGitHub]);

  return (
    <div className="-mx-4 md:mx-0">
      <div className="mx-auto max-w-2xl">
        <div className="border-y-2 border-dashed border-border bg-card p-6 text-center md:border-2">
          <p className="text-sm text-muted-foreground">Loading submission flow...</p>
        </div>
      </div>
    </div>
  );
}
