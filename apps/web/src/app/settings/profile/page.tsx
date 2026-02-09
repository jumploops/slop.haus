"use client";

import { useState } from "react";
import useSWR from "swr";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { fetchCurrentUser } from "@/lib/api/auth";
import { useToast } from "@/components/ui/Toast";
import { updateUser } from "@/lib/auth-client";
import {
  USERNAME_MAX_LENGTH,
  normalizeUsername,
  validateUsername,
} from "@slop/shared";

export default function ProfilePage() {
  const { data: user, mutate } = useSWR("/auth/me", fetchCurrentUser);
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setUsername(user?.username || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setUsername("");
  };

  const handleSave = async () => {
    const normalized = normalizeUsername(username);
    const validation = validateUsername(normalized);

    if (!validation.valid) {
      showToast(validation.reason || "Invalid username", "error");
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateUser({ username: normalized });
      if (result.error) {
        showToast(result.error.message || "Failed to update username", "error");
        return;
      }

      showToast("Username updated", "success");
      mutate();
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-border bg-card p-4">
        <h1 className="font-mono text-xl font-black text-foreground">Profile</h1>
      </div>

      {/* Profile Header */}
      <section className="border-2 border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <Avatar src={user.image} alt={user.username} size="lg" />
          <div>
            <h2 className="font-mono text-lg font-bold text-foreground">{user.username}</h2>
            <p className="text-muted-foreground text-xs">{user.email}</p>
            <div className="flex gap-2 mt-2">
              {user.devVerified && <Badge variant="dev">Verified Dev</Badge>}
              {user.role === "admin" && <Badge variant="admin">Admin</Badge>}
              {user.role === "mod" && <Badge variant="mod">Moderator</Badge>}
            </div>
          </div>
        </div>
      </section>

      {/* Username Section */}
      <section className="border-2 border-border bg-card p-4 space-y-3">
          <h3 className="font-mono text-sm font-bold text-foreground">Username</h3>
          <p className="text-xs text-muted-foreground">
            This is displayed on your comments and submissions.
          </p>
          {user.usernameSource === "google_random" && !isEditing && (
            <p className="text-xs text-muted-foreground">
              This username was auto-generated from your Google sign-in. You can change it any time.
            </p>
          )}

          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                maxLength={USERNAME_MAX_LENGTH}
              />
              {normalizeUsername(username) !== username.trim() && (
                <p className="text-xs text-muted-foreground">
                  Will save as: <span className="font-mono">{normalizeUsername(username)}</span>
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving}
                  loading={isSaving}
                >
                  Save
                </Button>
                <Button variant="ghost" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className="px-2 py-1 text-sm border-2 border-border bg-muted font-mono">
                {user.username}
              </span>
              <Button variant="secondary" onClick={handleEdit}>
                Edit
              </Button>
            </div>
          )}
      </section>

      {/* Avatar Section */}
      <section className="border-2 border-border bg-card p-4 space-y-2">
          <h3 className="font-mono text-sm font-bold text-foreground">Avatar</h3>
          <p className="text-xs text-muted-foreground">
            Your avatar is imported from your OAuth provider (GitHub or Google).
            To change it, update your profile picture on the connected service.
          </p>
      </section>
    </div>
  );
}
