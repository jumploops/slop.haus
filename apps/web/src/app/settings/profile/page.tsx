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
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      {/* Profile Header */}
      <section className="mb-8 p-6 rounded-lg border border-border bg-bg-secondary">
        <div className="flex items-center gap-4">
          <Avatar src={user.image} alt={user.name} size="lg" />
          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-muted text-sm">{user.email}</p>
            <div className="flex gap-2 mt-2">
              {user.devVerified && <Badge variant="dev">Verified Dev</Badge>}
              {user.role === "admin" && <Badge variant="admin">Admin</Badge>}
              {user.role === "mod" && <Badge variant="mod">Moderator</Badge>}
            </div>
          </div>
        </div>
      </section>

      {/* Display Name Section */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Display Name</h3>
        <p className="text-sm text-muted mb-4">
          This is the name displayed on your comments and submissions.
        </p>

        {isEditing ? (
          <div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
              maxLength={100}
              className="mb-3"
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
            <span className="px-3 py-2 bg-bg-secondary border border-border rounded-md">
              {user.name}
            </span>
            <Button variant="secondary" onClick={handleEdit}>
              Edit
            </Button>
          </div>
        )}
      </section>

      {/* Avatar Section */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Avatar</h3>
        <p className="text-sm text-muted">
          Your avatar is imported from your OAuth provider (GitHub or Google).
          To change it, update your profile picture on the connected service.
        </p>
      </section>
    </div>
  );
}
