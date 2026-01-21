"use client";

import useSWR from "swr";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchVerifiedDevs, unverifyDev, type VerifiedDev } from "@/lib/api/admin";
import { useToast } from "@/components/ui/Toast";
import { useState } from "react";

export default function UsersPage() {
  const { showToast } = useToast();
  const { data: users, error, isLoading, mutate } = useSWR(
    "/admin/verified-devs",
    fetchVerifiedDevs
  );
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleUnverify = async (user: VerifiedDev) => {
    if (!confirm(`Remove verified dev status from ${user.name}?`)) return;

    setProcessingId(user.id);
    try {
      await unverifyDev(user.id);
      showToast(`${user.name} is no longer a verified dev`, "success");
      mutate();
    } catch (error) {
      showToast("Failed to update user", "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3">
        <h1 className="text-xl font-bold text-slop-blue">★ VERIFIED DEVELOPERS ★</h1>
        <p className="text-xs text-muted mt-1">
          Users with verified developer status can vote in the dev channel.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton variant="avatar" />
                <Skeleton variant="text" className="w-32" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-6 text-center">
          <p className="text-sm text-danger">Failed to load users</p>
        </div>
      )}

      {!isLoading && !error && users?.length === 0 && (
        <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-6 text-center">
          <p className="text-sm text-muted">No verified developers yet.</p>
        </div>
      )}

      {!isLoading && !error && users && users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1"
            >
              <div className="bg-bg border-2 border-[color:var(--border)] p-3 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Avatar src={user.image} alt={user.name} size="md" />
                  <div>
                    <h3 className="text-sm font-bold">{user.name}</h3>
                    <p className="text-xs text-muted">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="dev">Verified</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnverify(user)}
                    disabled={processingId === user.id}
                  >
                    {processingId === user.id ? "Processing..." : "Remove"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
