"use client";

import { useState } from "react";
import { DEFAULT_VIBE_DETAILS } from "@slop/shared";
import { useSession } from "@/lib/auth-client";
import { InlineEditText } from "./InlineEditText";
import { InlineEditTextarea } from "./InlineEditTextarea";
import { TagEditor } from "./TagEditor";
import { VibeInput } from "@/components/form/VibeInput";
import { VibeMeter } from "@/components/project/VibeMeter";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, getPlaceholderImage } from "@/lib/utils";

interface DraftData {
  draftId: string;
  inputUrl: string;
  screenshot?: string;
  suggested: {
    title: string | null;
    tagline: string | null;
    description: string | null;
    tools: string[];
    vibePercent: number | null;
    mainUrl: string | null;
    repoUrl: string | null;
  };
  final: {
    title: string | null;
    tagline: string | null;
    description: string | null;
    tools: string[] | null;
    vibePercent: number | null;
    mainUrl: string | null;
    repoUrl: string | null;
  };
}

interface EditableProjectPreviewProps {
  draft: DraftData;
  onFieldChange: (field: string, value: unknown) => Promise<void>;
  onSubmit: (
    vibeMode: "overview" | "detailed",
    vibeDetails?: Record<string, number>
  ) => void;
  onStartOver: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export function EditableProjectPreview({
  draft,
  onFieldChange,
  onSubmit,
  onStartOver,
  isSubmitting,
  error,
}: EditableProjectPreviewProps) {
  const { data: session } = useSession();

  // Local state for vibe (persisted on submit, not on change)
  const [vibeMode, setVibeMode] = useState<"overview" | "detailed">("overview");
  const [vibePercent, setVibePercent] = useState(
    getValue("vibePercent") ?? 50
  );
  const [vibeDetails, setVibeDetails] = useState<Record<string, number>>(
    { ...DEFAULT_VIBE_DETAILS }
  );

  // Local state for fields (synced to parent on save)
  const [title, setTitle] = useState(getValue("title") || "");
  const [tagline, setTagline] = useState(getValue("tagline") || "");
  const [description, setDescription] = useState(getValue("description") || "");
  const [mainUrl, setMainUrl] = useState(getValue("mainUrl") || "");
  const [repoUrl, setRepoUrl] = useState(getValue("repoUrl") || "");
  const [tools, setTools] = useState<string[]>(getValue("tools") || []);

  // Helper to get value with fallback
  function getValue<K extends keyof DraftData["final"]>(
    field: K
  ): DraftData["final"][K] {
    const finalValue = draft.final[field];
    if (finalValue !== null && finalValue !== undefined) {
      return finalValue;
    }
    return draft.suggested[field] as DraftData["final"][K];
  }

  // Handlers for saving individual fields
  const handleTitleSave = async (value: string) => {
    setTitle(value);
    await onFieldChange("title", value);
  };

  const handleTaglineSave = async (value: string) => {
    setTagline(value);
    await onFieldChange("tagline", value);
  };

  const handleDescriptionSave = async (value: string) => {
    setDescription(value);
    await onFieldChange("description", value);
  };

  const handleToolsChange = async (newTools: string[]) => {
    setTools(newTools);
    await onFieldChange("tools", newTools);
  };

  const handleVibePercentChange = (value: number) => {
    setVibePercent(value);
    // Vibe is saved on submit, not on change
  };

  const handleSubmit = () => {
    onSubmit(vibeMode, vibeMode === "detailed" ? vibeDetails : undefined);
  };

  // Image URL with fallback
  const imageUrl = draft.screenshot || getPlaceholderImage(title || "Project");

  // User info for author section
  const userName = session?.user?.name || "You";
  const userImage = session?.user?.image || null;

  // Validation
  const hasRequiredFields =
    title.trim() && tagline.trim() && (mainUrl || repoUrl);

  return (
    <div className="project-preview-container">
      {/* Edit mode banner */}
      <div className="preview-banner">
        <p>Review your project. Click any highlighted area to edit.</p>
      </div>

      {/* Project preview - mirrors ProjectDetails structure */}
      <div className="project-details preview-mode">
        <div className="project-details-header">
          {/* Media section */}
          <div className="project-details-media">
            <img
              src={imageUrl}
              alt={title || "Project screenshot"}
              className="project-details-image"
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
              <Avatar src={userImage} alt={userName} size="md" />
              <span>{userName}</span>
            </div>

            {/* Meta info (preview) */}
            <div className="project-details-meta">
              <span>Submitted just now</span>
            </div>

            {/* Links - placeholder for Phase 2 */}
            <div className="project-details-links">
              {mainUrl && (
                <a
                  href={mainUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  onClick={(e) => e.preventDefault()}
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
                  onClick={(e) => e.preventDefault()}
                >
                  <GithubIcon /> View Repo
                </a>
              )}
              {!mainUrl && !repoUrl && (
                <span className="text-muted">Add a URL below</span>
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
              <div
                className="editable-field tools-list-editable"
                onClick={() => {}}
                tabIndex={0}
                role="button"
              >
                {tools.length > 0 ? (
                  <div className="tools-list">
                    {tools.map((tool) => (
                      <Badge key={tool} variant="default">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="empty">Add technologies...</span>
                )}
              </div>
              {/* Inline TagEditor for Phase 1 (simple version) */}
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
                      onModeChange={setVibeMode}
                      vibePercent={vibePercent}
                      onVibePercentChange={handleVibePercentChange}
                      vibeDetails={vibeDetails}
                      onVibeDetailsChange={setVibeDetails}
                    />
                  </div>
                </div>
              </div>

              {/* Voting preview (disabled) */}
              <div className="score-widget-section">
                <h4>Community Votes</h4>
                <div className="score-channels preview-disabled">
                  <div className="score-channel-row">
                    <span className="score-channel-label">People</span>
                    <span className="score-votes">+0 / -0</span>
                  </div>
                  <div className="score-channel-row">
                    <span className="score-channel-label">Devs</span>
                    <span className="score-votes">+0 / -0</span>
                  </div>
                </div>
                <p className="text-muted text-small">
                  Voting enabled after submission
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* URL editors (temporary inline for Phase 1) */}
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
            onBlur={() => onFieldChange("mainUrl", mainUrl || null)}
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
            onBlur={() => onFieldChange("repoUrl", repoUrl || null)}
            placeholder="https://github.com/user/repo"
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="preview-error">
          <p className="error-message">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="preview-actions">
        <Button
          type="button"
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting || !hasRequiredFields}
          className="btn-large"
        >
          {isSubmitting ? "Submitting..." : "Submit Project"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onStartOver}
          disabled={isSubmitting}
        >
          Start Over
        </Button>
      </div>
    </div>
  );
}

// Icons (copied from ProjectDetails)
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
