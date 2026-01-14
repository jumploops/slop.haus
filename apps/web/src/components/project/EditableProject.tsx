"use client";

import { useState } from "react";
import Link from "next/link";
import { InlineEditText } from "@/components/submit/InlineEditText";
import { InlineEditTextarea } from "@/components/submit/InlineEditTextarea";
import { TagEditor } from "@/components/submit/TagEditor";
import { VibeInput } from "@/components/form/VibeInput";
import { VibeMeter } from "@/components/project/VibeMeter";
import { ScreenshotEditor } from "@/components/project/ScreenshotEditor";
import { UrlChangeModal } from "@/components/project/UrlChangeModal";
import { RevisionStatusBanner } from "@/components/project/RevisionStatusBanner";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import { refreshProject, type ProjectDetail, type ProjectRevision } from "@/lib/api/projects";

interface EditableProjectProps {
  project: ProjectDetail;
  onFieldChange: (field: string, value: unknown) => Promise<void>;
  onScreenshotChange: (url: string) => void;
  onDelete: () => void;
  onDone: () => void;
  error: string | null;
  pendingRevision?: ProjectRevision;
  onRevisionDismiss?: () => void;
}

export function EditableProject({
  project,
  onFieldChange,
  onScreenshotChange,
  onDelete,
  onDone,
  error,
  pendingRevision,
  onRevisionDismiss,
}: EditableProjectProps) {
  // Local state for fields
  const [title, setTitle] = useState(project.title);
  const [tagline, setTagline] = useState(project.tagline);
  const [description, setDescription] = useState(project.description || "");
  const [mainUrl, setMainUrl] = useState(project.mainUrl || "");
  const [repoUrl, setRepoUrl] = useState(project.repoUrl || "");
  const [tools, setTools] = useState<string[]>(project.tools.map((t) => t.slug));
  const [vibeMode, setVibeMode] = useState<"overview" | "detailed">(project.vibeMode);
  const [vibePercent, setVibePercent] = useState(project.vibePercent);
  const [vibeDetails, setVibeDetails] = useState<Record<string, number>>(
    project.vibeDetailsJson || {
      idea: 50,
      design: 50,
      code: 50,
      prompts: 50,
      vibe: 50,
    }
  );
  const [saving, setSaving] = useState<string | null>(null);

  // Screenshot state
  const primaryMedia = project.media.find((m) => m.isPrimary) || project.media[0];
  const [screenshotUrl, setScreenshotUrl] = useState(primaryMedia?.url || null);

  // URL change modal state
  const [urlChangeModal, setUrlChangeModal] = useState<{
    isOpen: boolean;
    urlType: "mainUrl" | "repoUrl";
    newValue: string;
  }>({
    isOpen: false,
    urlType: "mainUrl",
    newValue: "",
  });
  const [isUrlSaving, setIsUrlSaving] = useState(false);

  // Field save handlers
  const handleTitleSave = async (value: string) => {
    setTitle(value);
    setSaving("title");
    try {
      await onFieldChange("title", value);
    } finally {
      setSaving(null);
    }
  };

  const handleTaglineSave = async (value: string) => {
    setTagline(value);
    setSaving("tagline");
    try {
      await onFieldChange("tagline", value);
    } finally {
      setSaving(null);
    }
  };

  const handleDescriptionSave = async (value: string) => {
    setDescription(value);
    setSaving("description");
    try {
      await onFieldChange("description", value);
    } finally {
      setSaving(null);
    }
  };

  const handleToolsChange = async (newTools: string[]) => {
    setTools(newTools);
    setSaving("tools");
    try {
      await onFieldChange("tools", newTools);
    } finally {
      setSaving(null);
    }
  };

  const handleMainUrlBlur = () => {
    if (mainUrl !== (project.mainUrl || "")) {
      // URL changed - show confirmation modal
      setUrlChangeModal({
        isOpen: true,
        urlType: "mainUrl",
        newValue: mainUrl,
      });
    }
  };

  const handleRepoUrlBlur = () => {
    if (repoUrl !== (project.repoUrl || "")) {
      // URL changed - show confirmation modal
      setUrlChangeModal({
        isOpen: true,
        urlType: "repoUrl",
        newValue: repoUrl,
      });
    }
  };

  const handleUrlSaveOnly = async () => {
    setIsUrlSaving(true);
    try {
      await onFieldChange(urlChangeModal.urlType, urlChangeModal.newValue || null);
      setUrlChangeModal({ ...urlChangeModal, isOpen: false });
    } finally {
      setIsUrlSaving(false);
    }
  };

  const handleUrlSaveAndRescrape = async () => {
    setIsUrlSaving(true);
    try {
      // First save the URL
      await onFieldChange(urlChangeModal.urlType, urlChangeModal.newValue || null);
      // Then trigger a refresh
      await refreshProject(project.slug);
      setUrlChangeModal({ ...urlChangeModal, isOpen: false });
    } catch (err) {
      // URL saved but refresh failed - still close modal
      setUrlChangeModal({ ...urlChangeModal, isOpen: false });
    } finally {
      setIsUrlSaving(false);
    }
  };

  const handleUrlModalClose = () => {
    // Revert the URL input to original value
    if (urlChangeModal.urlType === "mainUrl") {
      setMainUrl(project.mainUrl || "");
    } else {
      setRepoUrl(project.repoUrl || "");
    }
    setUrlChangeModal({ ...urlChangeModal, isOpen: false });
  };

  const handleScreenshotUpload = (url: string) => {
    setScreenshotUrl(url);
    onScreenshotChange(url);
  };

  const handleScreenshotRefresh = () => {
    // Screenshot will be updated async - the user can refresh the page
    // or we could poll for updates, but for now just notify
  };

  const handleVibePercentChange = async (value: number) => {
    setVibePercent(value);
  };

  const handleVibeModeChange = async (mode: "overview" | "detailed") => {
    setVibeMode(mode);
    await onFieldChange("vibeMode", mode);
  };

  const handleVibeBlur = async () => {
    if (vibePercent !== project.vibePercent) {
      setSaving("vibePercent");
      try {
        await onFieldChange("vibePercent", vibePercent);
      } finally {
        setSaving(null);
      }
    }
  };

  const handleVibeDetailsChange = async (details: Record<string, number>) => {
    setVibeDetails(details);
    await onFieldChange("vibeDetails", details);
  };

  return (
    <div className="project-preview-container">
      {/* Edit mode header */}
      <div className="edit-project-header">
        <Link href={`/p/${project.slug}`} className="back-link">
          <ArrowLeftIcon /> Back to project
        </Link>
        <div className="edit-project-actions">
          <Button variant="ghost" onClick={onDelete} className="btn-danger-ghost">
            Delete
          </Button>
          <Button variant="primary" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>

      {/* Revision status banner */}
      {pendingRevision && (
        <RevisionStatusBanner
          revision={pendingRevision}
          onDismiss={onRevisionDismiss}
        />
      )}

      {/* Error display */}
      {error && (
        <div className="preview-error">
          <p className="error-message">{error}</p>
        </div>
      )}

      {/* Project preview - mirrors ProjectDetails structure */}
      <div className="project-details preview-mode">
        <div className="project-details-header">
          {/* Media section - editable screenshot */}
          <div className="project-details-media">
            <ScreenshotEditor
              slug={project.slug}
              currentUrl={screenshotUrl}
              projectTitle={title}
              mainUrl={mainUrl || null}
              onUploadSuccess={handleScreenshotUpload}
              onRefreshQueued={handleScreenshotRefresh}
            />
          </div>

          {/* Info section */}
          <div className="project-details-info">
            <InlineEditText
              value={title}
              onSave={handleTitleSave}
              placeholder="Project Title"
              maxLength={255}
              required
              as="h1"
            />

            <InlineEditText
              value={tagline}
              onSave={handleTaglineSave}
              placeholder="One-sentence description"
              maxLength={500}
              required
              className="project-details-tagline"
              as="p"
            />

            {/* Author info (read-only) */}
            <div className="project-details-author">
              <Avatar
                src={project.author.image}
                alt={project.author.name}
                size="md"
              />
              <span>{project.author.name}</span>
              {project.author.devVerified && <Badge variant="dev">Dev</Badge>}
            </div>

            {/* Meta info */}
            <div className="project-details-meta">
              <span>Submitted {formatRelativeTime(project.createdAt)}</span>
              {project.lastEditedAt && (
                <span>Last edited {formatRelativeTime(project.lastEditedAt)}</span>
              )}
            </div>

            {/* Links (read-only display, editable below) */}
            <div className="project-details-links">
              {mainUrl && (
                <a
                  href={mainUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <ExternalLinkIcon /> Visit Site
                </a>
              )}
              {repoUrl && (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  <GithubIcon /> View Repo
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="project-details-body">
          <div className="project-details-main">
            {/* Description section */}
            <div className="project-details-description">
              <h3>About</h3>
              <InlineEditTextarea
                value={description}
                onSave={handleDescriptionSave}
                placeholder="Add a description..."
                maxLength={10000}
              />
            </div>

            {/* Tools section */}
            <div className="project-details-tools">
              <h3>Built with</h3>
              <div className="tools-editor-inline">
                <TagEditor selected={tools} onChange={handleToolsChange} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="project-details-sidebar">
            <div className="score-widget preview-mode">
              {/* Vibe Score - editable */}
              <div className="score-widget-section">
                <h4>Vibe Score</h4>
                <div className="vibe-editor-preview">
                  <VibeMeter percent={vibePercent} showLabel />
                  <div className="vibe-editor-inline" onBlur={handleVibeBlur}>
                    <VibeInput
                      mode={vibeMode}
                      onModeChange={handleVibeModeChange}
                      vibePercent={vibePercent}
                      onVibePercentChange={handleVibePercentChange}
                      vibeDetails={vibeDetails}
                      onVibeDetailsChange={handleVibeDetailsChange}
                    />
                  </div>
                </div>
              </div>

              {/* Voting display (read-only) */}
              <div className="score-widget-section">
                <h4>Community Votes</h4>
                <div className="score-channels">
                  <div className="score-channel-row">
                    <span className="score-channel-label">People</span>
                    <span className="score-votes">
                      +{project.normalUp} / -{project.normalDown}
                    </span>
                  </div>
                  <div className="score-channel-row">
                    <span className="score-channel-label">Devs</span>
                    <span className="score-votes">
                      +{project.devUp} / -{project.devDown}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* URL editors */}
      <div className="preview-url-editors">
        <h3>Project Links</h3>
        <p className="text-muted text-small">At least one URL is required</p>
        <div className="form-field">
          <label htmlFor="mainUrl">Live URL</label>
          <input
            id="mainUrl"
            type="url"
            value={mainUrl}
            onChange={(e) => setMainUrl(e.target.value)}
            onBlur={handleMainUrlBlur}
            placeholder="https://your-app.com"
          />
        </div>
        <div className="form-field">
          <label htmlFor="repoUrl">Repository URL</label>
          <input
            id="repoUrl"
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onBlur={handleRepoUrlBlur}
            placeholder="https://github.com/user/repo"
          />
        </div>
      </div>

      {/* URL change confirmation modal */}
      <UrlChangeModal
        isOpen={urlChangeModal.isOpen}
        onClose={handleUrlModalClose}
        onSaveOnly={handleUrlSaveOnly}
        onSaveAndRescrape={handleUrlSaveAndRescrape}
        isSaving={isUrlSaving}
        urlType={urlChangeModal.urlType}
      />
    </div>
  );
}

// Icons
function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06z" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6.5 3.5v1h3.79L3.65 11.14l.71.71L11 5.21V9h1V3.5H6.5z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
