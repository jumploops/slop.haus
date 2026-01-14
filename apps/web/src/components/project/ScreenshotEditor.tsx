"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { uploadScreenshot, refreshProject } from "@/lib/api/projects";
import { getPlaceholderImage } from "@/lib/utils";

interface ScreenshotEditorProps {
  slug: string;
  currentUrl: string | null;
  projectTitle: string;
  mainUrl: string | null;
  onUploadSuccess: (url: string) => void;
  onRefreshQueued: () => void;
}

export function ScreenshotEditor({
  slug,
  currentUrl,
  projectTitle,
  mainUrl,
  onUploadSuccess,
  onRefreshQueued,
}: ScreenshotEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageUrl = currentUrl || getPlaceholderImage(projectTitle);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const url = await uploadScreenshot(slug, file);
      onUploadSuccess(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload screenshot");
    } finally {
      setIsUploading(false);
      // Reset file input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRefresh = async () => {
    setError(null);
    setIsRefreshing(true);

    try {
      await refreshProject(slug);
      onRefreshQueued();
    } catch (err) {
      if (err instanceof Error && err.message.includes("wait")) {
        setError("Screenshot refresh is on cooldown. Please wait an hour between refreshes.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to refresh screenshot");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="screenshot-editor">
      <div className="screenshot-editor-preview">
        <img
          src={imageUrl}
          alt={projectTitle}
          className="screenshot-editor-image"
        />
      </div>

      <div className="screenshot-editor-actions">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png,image/jpeg,image/webp"
          style={{ display: "none" }}
        />

        <Button
          variant="secondary"
          onClick={handleUploadClick}
          disabled={isUploading || isRefreshing}
        >
          <UploadIcon />
          {isUploading ? "Uploading..." : "Upload New"}
        </Button>

        {mainUrl && (
          <Button
            variant="ghost"
            onClick={handleRefresh}
            disabled={isUploading || isRefreshing}
            title="Capture a fresh screenshot from the live URL"
          >
            <RefreshIcon />
            {isRefreshing ? "Queuing..." : "Refresh"}
          </Button>
        )}
      </div>

      {error && (
        <p className="screenshot-editor-error">{error}</p>
      )}

      <p className="screenshot-editor-hint">
        Upload PNG, JPEG, or WebP (max 5MB)
      </p>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M7.5 1.75a.75.75 0 0 1 1.5 0v7.44l2.22-2.22a.75.75 0 0 1 1.06 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 0 1 1.06-1.06L7.5 9.19V1.75z" />
      <path d="M1.5 10.75a.75.75 0 0 1 1.5 0v1.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 12.75 14h-9.5A1.75 1.75 0 0 1 1.5 12.25v-1.5z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.418A6 6 0 1 1 8 2v1z" />
      <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
    </svg>
  );
}
