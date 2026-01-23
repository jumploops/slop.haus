"use client";

import { useState } from "react";
import useSWR from "swr";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { fetchCurrentUser } from "@/lib/api/auth";
import { useToast } from "@/components/ui/Toast";
import { apiPatch } from "@/lib/api";

export default function ProfilePage() {
  const { data: user, mutate } = useSWR("/auth/me", fetchCurrentUser);
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setName(user?.name || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName("");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }

    setIsSaving(true);
    try {
      await apiPatch("/users/me", { name: name.trim() });
      showToast("Profile updated", "success");
      mutate();
      setIsEditing(false);
    } catch (error) {
      showToast("Failed to update profile", "error");
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
          <Avatar src={user.image} alt={user.name} size="lg" />
          <div>
            <h2 className="font-mono text-lg font-bold text-foreground">{user.name}</h2>
            <p className="text-muted-foreground text-xs">{user.email}</p>
            <div className="flex gap-2 mt-2">
              {user.devVerified && <Badge variant="dev">Verified Dev</Badge>}
              {user.role === "admin" && <Badge variant="admin">Admin</Badge>}
              {user.role === "mod" && <Badge variant="mod">Moderator</Badge>}
            </div>
          </div>
        </div>
      </section>

      {/* Display Name Section */}
      <section className="border-2 border-border bg-card p-4 space-y-3">
          <h3 className="font-mono text-sm font-bold text-foreground">Display Name</h3>
          <p className="text-xs text-muted-foreground">
            This is the name displayed on your comments and submissions.
          </p>

          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
                maxLength={100}
              />
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
                {user.name}
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
