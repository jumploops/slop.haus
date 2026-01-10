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
    <div className="settings-page">
      <h1>Profile</h1>

      <div className="settings-section">
        <div className="profile-header">
          <Avatar src={user.image} alt={user.name} size="lg" />
          <div className="profile-info">
            <h2>{user.name}</h2>
            <p className="profile-email">{user.email}</p>
            <div className="profile-badges">
              {user.devVerified && <Badge variant="dev">Verified Dev</Badge>}
              {user.role === "admin" && <Badge variant="admin">Admin</Badge>}
              {user.role === "mod" && <Badge variant="mod">Moderator</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Display Name</h3>
        <p className="settings-description">
          This is the name displayed on your comments and submissions.
        </p>

        {isEditing ? (
          <div className="profile-edit-form">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
              maxLength={100}
            />
            <div className="profile-edit-actions">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="profile-display">
            <span className="profile-name-display">{user.name}</span>
            <Button variant="secondary" onClick={handleEdit}>
              Edit
            </Button>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3>Avatar</h3>
        <p className="settings-description">
          Your avatar is imported from your OAuth provider (GitHub or Google).
          To change it, update your profile picture on the connected service.
        </p>
      </div>
    </div>
  );
}
