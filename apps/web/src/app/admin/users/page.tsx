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
    if (!confirm(`Remove verified dev status from ${user.username}?`)) return;

    setProcessingId(user.id);
    try {
      await unverifyDev(user.id);
      showToast(`${user.username} is no longer a verified dev`, "success");
      mutate();
    } catch (error) {
      showToast("Failed to update user", "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-border bg-card p-4">
        <h1 className="font-mono text-xl font-black text-foreground">Verified Developers</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Verified status is kept for future review weighting and badges.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="border-2 border-border bg-card p-3"
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
        <div className="border-2 border-destructive bg-card p-6 text-center">
          <p className="text-sm text-destructive">Failed to load users</p>
        </div>
      )}

      {!isLoading && !error && users?.length === 0 && (
        <div className="border-2 border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">No verified developers yet.</p>
        </div>
      )}

      {!isLoading && !error && users && users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="border-2 border-border bg-card p-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Avatar src={user.image} alt={user.username} size="md" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{user.username}</h3>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
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
