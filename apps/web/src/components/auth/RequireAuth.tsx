"use client";

import { useSession } from "@/lib/auth-client";
import { useLoginModal } from "@/hooks/useLoginModal";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { data: session, isPending } = useSession();
  const { openLoginModal } = useLoginModal();

  useEffect(() => {
    if (!isPending && !session?.user) {
      openLoginModal();
    }
  }, [isPending, session, openLoginModal]);

  if (isPending) {
    return (
      <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-4 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!session?.user) {
    return fallback || (
      <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-6 text-center">
        <p className="text-sm text-muted">Please sign in to continue</p>
      </div>
    );
  }

  return <>{children}</>;
}
