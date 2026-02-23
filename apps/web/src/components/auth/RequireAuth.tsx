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
  const isRegisteredUser = Boolean(session?.user && !session.user.isAnonymous);

  useEffect(() => {
    if (!isPending && !isRegisteredUser) {
      openLoginModal();
    }
  }, [isPending, isRegisteredUser, openLoginModal]);

  if (isPending) {
    return (
      <div className="border-2 border-dashed border-border bg-card p-4 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isRegisteredUser) {
    return fallback || (
      <div className="border-2 border-dashed border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground font-mono">Please sign in to continue</p>
      </div>
    );
  }

  return <>{children}</>;
}
