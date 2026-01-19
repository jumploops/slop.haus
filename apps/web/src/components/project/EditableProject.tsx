"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { DEFAULT_VIBE_DETAILS, isEqualVibeDetails } from "@slop/shared";
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
import { Button, buttonVariants } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import { refreshProject, type ProjectDetail, type ProjectRevision } from "@/lib/api/projects";

interface EditableProjectProps {
  project: ProjectDetail;
  onSubmit: (changes: Record<string, unknown>) => Promise<void>;
  onScreenshotChange: (url: string) => void;
  onDelete: () => void;
  onDone: () => void;
  error: string | null;
  pendingRevision?: ProjectRevision;
  onRevisionDismiss?: () => void;
}

export function EditableProject({
  project,
  onSubmit,
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
    project.vibeDetailsJson || DEFAULT_VIBE_DETAILS
  );
  const [isSaving, setIsSaving] = useState(false);

  // Screenshot state
  const primaryMedia = project.media.find((m) => m.isPrimary) || project.media[0];
  const [screenshotUrl, setScreenshotUrl] = useState(primaryMedia?.url || null);

  // URL change modal state - now triggered on submit, not blur
  const [urlChangeModal, setUrlChangeModal] = useState<{
    isOpen: boolean;
    changes: Record<string, unknown>;
  }>({
    isOpen: false,
    changes: {},
  });

  // Compute dirty state - compare current values to original project
  const isDirty = useMemo(() => {
    if (title !== project.title) return true;
    if (tagline !== project.tagline) return true;
    if (description !== (project.description || "")) return true;
    if (mainUrl !== (project.mainUrl || "")) return true;
    if (repoUrl !== (project.repoUrl || "")) return true;
    if (vibeMode !== project.vibeMode) return true;
    if (vibePercent !== project.vibePercent) return true;
    // Use order-independent comparison for vibeDetails (JSON key order can differ)
    if (!isEqualVibeDetails(vibeDetails, project.vibeDetailsJson)) return true;

    // Tools comparison (order-independent)
    const originalTools = new Set(project.tools.map((t) => t.slug));
    const currentTools = new Set(tools);
    if (originalTools.size !== currentTools.size) return true;
    for (const tool of currentTools) {
      if (!originalTools.has(tool)) return true;
    }

    return false;
  }, [title, tagline, description, mainUrl, repoUrl, vibeMode, vibePercent, vibeDetails, tools, project]);

  // Get changed fields for submit payload
  const getChangedFields = (): Record<string, unknown> => {
    const changes: Record<string, unknown> = {};

    if (title !== project.title) changes.title = title;
    if (tagline !== project.tagline) changes.tagline = tagline;
    if (description !== (project.description || "")) changes.description = description;
    if (mainUrl !== (project.mainUrl || "")) changes.mainUrl = mainUrl || null;
    if (repoUrl !== (project.repoUrl || "")) changes.repoUrl = repoUrl || null;
    if (vibeMode !== project.vibeMode) changes.vibeMode = vibeMode;
    if (vibePercent !== project.vibePercent) changes.vibePercent = vibePercent;
    if (!isEqualVibeDetails(vibeDetails, project.vibeDetailsJson)) {
      changes.vibeDetails = vibeDetails;
    }

    // Tools comparison
    const originalTools = new Set(project.tools.map((t) => t.slug));
    const currentTools = new Set(tools);
    const toolsChanged =
      originalTools.size !== currentTools.size ||
      [...currentTools].some((t) => !originalTools.has(t)) ||
      [...originalTools].some((t) => !currentTools.has(t));
    if (toolsChanged) changes.tools = tools;

    return changes;
  };

  // Navigation warning when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Submit all changes
  const handleSubmit = async () => {
    const changes = getChangedFields();
    if (Object.keys(changes).length === 0) return;

    // If mainUrl changed, show confirmation modal for screenshot refresh
    if (changes.mainUrl !== undefined && changes.mainUrl !== project.mainUrl) {
      setUrlChangeModal({ isOpen: true, changes });
      return;
    }

    await submitChanges(changes);
  };

  const submitChanges = async (changes: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      await onSubmit(changes);
    } finally {
      setIsSaving(false);
    }
  };

  // Discard all changes
  const handleDiscard = () => {
    setTitle(project.title);
    setTagline(project.tagline);
    setDescription(project.description || "");
    setMainUrl(project.mainUrl || "");
    setRepoUrl(project.repoUrl || "");
    setTools(project.tools.map((t) => t.slug));
    setVibeMode(project.vibeMode);
    setVibePercent(project.vibePercent);
    setVibeDetails(project.vibeDetailsJson || DEFAULT_VIBE_DETAILS);
  };

  // Handle "Done" with dirty check
  const handleDone = () => {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Discard and leave?")) {
        return;
      }
    }
    onDone();
  };

  // Field change handlers - only update local state, no API calls
  const handleTitleChange = (value: string) => {
    setTitle(value);
  };

  const handleTaglineChange = (value: string) => {
    setTagline(value);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
  };

  const handleToolsChange = (newTools: string[]) => {
    setTools(newTools);
  };

  const handleVibePercentChange = (value: number) => {
    setVibePercent(value);
  };

  const handleVibeModeChange = (mode: "overview" | "detailed") => {
    setVibeMode(mode);
  };

  const handleVibeDetailsChange = (details: Record<string, number>) => {
    setVibeDetails(details);
  };

  // URL modal handlers
  const handleUrlSaveOnly = async () => {
    setUrlChangeModal({ ...urlChangeModal, isOpen: false });
    await submitChanges(urlChangeModal.changes);
  };

  const handleUrlSaveAndRescrape = async () => {
    setUrlChangeModal({ ...urlChangeModal, isOpen: false });
    await submitChanges(urlChangeModal.changes);
    // Trigger screenshot refresh after save
    try {
      await refreshProject(project.slug);
    } catch {
      // Refresh failed but changes were saved - that's ok
    }
  };

  const handleUrlModalClose = () => {
    setUrlChangeModal({ isOpen: false, changes: {} });
  };

  // Screenshot handlers (these remain immediate - not part of batch save)
  const handleScreenshotUpload = (url: string) => {
    setScreenshotUrl(url);
    onScreenshotChange(url);
  };

  const handleScreenshotRefresh = () => {
    // Screenshot will be updated async - the user can refresh the page
  };

  return (
    <div className="project-preview-container">
      {/* Edit mode header */}
      <div className="edit-project-header">
        <div className="edit-header-left">
          <Link href={`/p/${project.slug}`} className="back-link" onClick={(e) => {
            if (isDirty && !window.confirm("You have unsaved changes. Discard and leave?")) {
              e.preventDefault();
            }
          }}>
            <ArrowLeftIcon /> Back to project
          </Link>
        </div>
        <div className="edit-header-right">
          <Button variant="ghost" onClick={onDelete} className="text-danger hover:bg-danger/10">
            Delete
          </Button>
          {isDirty && (
            <Button variant="ghost" onClick={handleDiscard}>
              Discard
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
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
              onSave={handleTitleChange}
              placeholder="Project Title"
              maxLength={255}
              required
              as="h1"
            />

            <InlineEditTextarea
              value={tagline}
              onSave={handleTaglineChange}
              placeholder="One-sentence description"
              maxLength={500}
              className="project-details-tagline"
              minRows={2}
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
                  className={buttonVariants({ variant: "primary" })}
                >
                  <ExternalLinkIcon /> Visit Site
                </a>
              )}
              {repoUrl && (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "secondary" })}
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
                onSave={handleDescriptionChange}
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
                  <div className="vibe-editor-inline">
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
            placeholder="https://github.com/user/repo"
          />
        </div>
      </div>

      {/* URL change confirmation modal - triggered on submit when mainUrl changed */}
      <UrlChangeModal
        isOpen={urlChangeModal.isOpen}
        onClose={handleUrlModalClose}
        onSaveOnly={handleUrlSaveOnly}
        onSaveAndRescrape={handleUrlSaveAndRescrape}
        isSaving={isSaving}
        urlType="mainUrl"
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
