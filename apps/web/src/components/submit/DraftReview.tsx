"use client";

import { useState } from "react";
import { DEFAULT_VIBE_DETAILS } from "@slop/shared";
import { ScreenshotPreview } from "./ScreenshotPreview";
import { TagEditor } from "./TagEditor";
import { VibeInput } from "@/components/form/VibeInput";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

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

interface DraftReviewProps {
  draft: DraftData;
  onUpdate: (field: string, value: unknown) => Promise<void>;
  onSubmit: (
    vibeMode: "overview" | "detailed",
    vibeDetails?: Record<string, number>
  ) => void;
  onStartOver: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export function DraftReview({
  draft,
  onUpdate,
  onSubmit,
  onStartOver,
  isSubmitting,
  error,
}: DraftReviewProps) {
  // Resolve values: final takes precedence, fallback to suggested
  const getValue = <T,>(field: keyof typeof draft.final): T => {
    const finalValue = draft.final[field];
    if (finalValue !== null && finalValue !== undefined) {
      return finalValue as T;
    }
    return draft.suggested[field] as T;
  };

  const [title, setTitle] = useState(getValue<string>("title") || "");
  const [tagline, setTagline] = useState(getValue<string>("tagline") || "");
  const [description, setDescription] = useState(
    getValue<string>("description") || ""
  );
  const [mainUrl, setMainUrl] = useState(getValue<string>("mainUrl") || "");
  const [repoUrl, setRepoUrl] = useState(getValue<string>("repoUrl") || "");
  const [tools, setTools] = useState<string[]>(
    getValue<string[]>("tools") || []
  );
  const [vibeMode, setVibeMode] = useState<"overview" | "detailed">("overview");
  const [vibePercent, setVibePercent] = useState(
    getValue<number>("vibePercent") || 50
  );
  const [vibeDetails, setVibeDetails] = useState<Record<string, number>>(
    { ...DEFAULT_VIBE_DETAILS }
  );
  const [savingField, setSavingField] = useState<string | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const handleFieldBlur = async (field: string, value: unknown) => {
    setSavingField(field);
    try {
      await onUpdate(field, value);
    } finally {
      // Brief delay so user sees "Saved" feedback
      setTimeout(() => setSavingField(null), 800);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(vibeMode, vibeMode === "detailed" ? vibeDetails : undefined);
  };

  const hasRequiredFields =
    title.trim() && tagline.trim() && (mainUrl || repoUrl);

  return (
    <form onSubmit={handleSubmit} className="draft-review">
      <div className="draft-review-header">
        <h1>Review Your Project</h1>
        <p className="text-muted">
          We've extracted these details from {draft.inputUrl}. Edit anything
          that looks wrong.
        </p>
      </div>

      {/* Screenshot */}
      {draft.screenshot && (
        <div className="draft-review-section">
          <ScreenshotPreview url={draft.screenshot} />
        </div>
      )}

      {/* Basic Info */}
      <div className="draft-review-section">
        <h2>Basic Info</h2>

        <div className="form-field">
          <label htmlFor="title">
            Title *
            {savingField === "title" && <span className="save-indicator">Saving...</span>}
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => handleFieldBlur("title", title)}
            maxLength={255}
            required
          />
          <span className={`char-count ${title.length > 230 ? "warning" : ""}`}>
            {title.length}/255
          </span>
        </div>

        <div className="form-field">
          <label htmlFor="tagline">
            Tagline *
            {savingField === "tagline" && <span className="save-indicator">Saving...</span>}
          </label>
          <input
            id="tagline"
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            onBlur={() => handleFieldBlur("tagline", tagline)}
            maxLength={500}
            placeholder="One-sentence description"
            required
          />
          <span className={`char-count ${tagline.length > 450 ? "warning" : ""}`}>
            {tagline.length}/500
          </span>
        </div>

        <div className="form-field">
          <label htmlFor="description">
            Description
            {savingField === "description" && <span className="save-indicator">Saving...</span>}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleFieldBlur("description", description)}
            maxLength={10000}
            rows={4}
            placeholder="Optional longer description"
          />
          <span className={`char-count ${description.length > 9000 ? "warning" : ""}`}>
            {description.length}/10000
          </span>
        </div>
      </div>

      {/* Links */}
      <div className="draft-review-section">
        <h2>Links</h2>
        <p className="text-muted text-small">At least one URL is required</p>

        <div className="form-field">
          <label htmlFor="mainUrl">Live URL</label>
          <input
            id="mainUrl"
            type="url"
            value={mainUrl}
            onChange={(e) => setMainUrl(e.target.value)}
            onBlur={() => handleFieldBlur("mainUrl", mainUrl || null)}
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
            onBlur={() => handleFieldBlur("repoUrl", repoUrl || null)}
            placeholder="https://github.com/user/repo"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="draft-review-section">
        <h2>Technologies</h2>
        <p className="text-muted text-small">
          We detected these tools. Add or remove as needed.
        </p>
        <TagEditor
          selected={tools}
          onChange={(newTools) => {
            setTools(newTools);
            handleFieldBlur("tools", newTools);
          }}
        />
      </div>

      {/* Vibe Score */}
      <div className="draft-review-section">
        <h2>Vibe Score</h2>
        <p className="text-muted text-small">
          How much AI was involved in creating this project?
        </p>
        <VibeInput
          mode={vibeMode}
          onModeChange={setVibeMode}
          vibePercent={vibePercent}
          onVibePercentChange={(value) => {
            setVibePercent(value);
            handleFieldBlur("vibePercent", value);
          }}
          vibeDetails={vibeDetails}
          onVibeDetailsChange={setVibeDetails}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="draft-review-error">
          <p className="error-message">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="draft-review-actions">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || !hasRequiredFields}
          className="btn-large"
        >
          {isSubmitting ? "Submitting..." : "Submit Project"}
        </Button>
        <Button
          type="button"
          onClick={() => setShowDiscardModal(true)}
          disabled={isSubmitting}
          variant="ghost"
        >
          Start Over
        </Button>
      </div>

      {/* Discard Confirmation Modal */}
      <Modal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        title="Discard draft?"
      >
        <div className="delete-modal-content">
          <p>You&apos;ll lose all changes and need to re-analyze the URL.</p>
          <p className="text-muted text-small">This action cannot be undone.</p>
          <div className="delete-modal-actions">
            <Button
              variant="ghost"
              onClick={() => setShowDiscardModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setShowDiscardModal(false);
                onStartOver();
              }}
            >
              Discard Draft
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  );
}
