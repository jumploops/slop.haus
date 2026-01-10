"use client";

import useSWR from "swr";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchVerifiedDevs, verifyDev, unverifyDev, type VerifiedDev } from "@/lib/api/admin";
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
    <div className="admin-page">
      <h1>Verified Developers</h1>
      <p className="admin-page-description">
        Users with verified developer status can vote in the dev channel.
      </p>

      {isLoading && (
        <div className="users-list">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="user-list-item">
              <Skeleton className="skeleton-avatar" />
              <Skeleton className="skeleton-text" style={{ width: "150px" }} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="empty-state">
          <p>Failed to load users</p>
        </div>
      )}

      {!isLoading && !error && users?.length === 0 && (
        <div className="empty-state">
          <p>No verified developers yet.</p>
        </div>
      )}

      {!isLoading && !error && users && users.length > 0 && (
        <div className="users-list">
          {users.map((user) => (
            <div key={user.id} className="user-list-item">
              <div className="user-list-item-info">
                <Avatar src={user.image} alt={user.name} size="md" />
                <div>
                  <h3>{user.name}</h3>
                  <p className="user-email">{user.email}</p>
                </div>
              </div>
              <div className="user-list-item-actions">
                <Badge variant="dev">Verified</Badge>
                <Button
                  variant="ghost"
                  onClick={() => handleUnverify(user)}
                  disabled={processingId === user.id}
                >
                  {processingId === user.id ? "Processing..." : "Remove"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
