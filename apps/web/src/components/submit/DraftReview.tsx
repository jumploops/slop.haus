"use client";

import { useState } from "react";
import { ScreenshotPreview } from "./ScreenshotPreview";
import { TagEditor } from "./TagEditor";
import { VibeInput } from "@/components/form/VibeInput";
import { Button } from "@/components/ui/Button";

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
  const [vibeDetails, setVibeDetails] = useState<Record<string, number>>({
    idea: 50,
    design: 50,
    code: 50,
    prompts: 50,
    vibe: 50,
  });

  const handleFieldBlur = (field: string, value: unknown) => {
    onUpdate(field, value);
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
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => handleFieldBlur("title", title)}
            maxLength={255}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="tagline">Tagline *</label>
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
        </div>

        <div className="form-field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleFieldBlur("description", description)}
            maxLength={10000}
            rows={4}
            placeholder="Optional longer description"
          />
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
          onClick={onStartOver}
          disabled={isSubmitting}
          variant="ghost"
        >
          Start Over
        </Button>
      </div>
    </form>
  );
}
