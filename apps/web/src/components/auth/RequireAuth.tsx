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
      <div className="auth-loading">
        <Skeleton className="skeleton-text" style={{ width: "200px", height: "24px" }} />
        <Skeleton className="skeleton-text" style={{ width: "100%", height: "200px", marginTop: "1rem" }} />
      </div>
    );
  }

  if (!session?.user) {
    return fallback || (
      <div className="empty-state">
        <p>Please sign in to continue</p>
      </div>
    );
  }

  return <>{children}</>;
}
