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
    <form onSubmit={handleSubmit}>
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Review Your Project</h1>
        <p className="text-muted">
          We&apos;ve extracted these details from {draft.inputUrl}. Edit anything
          that looks wrong.
        </p>
      </header>

      {/* Screenshot */}
      {draft.screenshot && (
        <section className="mb-6 pb-6 border-b border-border">
          <ScreenshotPreview url={draft.screenshot} />
        </section>
      )}

      {/* Basic Info */}
      <section className="mb-6 pb-6 border-b border-border">
        <h2 className="text-lg font-semibold mb-3">Basic Info</h2>

        <div className="mb-4">
          <label htmlFor="title" className="block mb-2 font-medium text-sm">
            Title *
            {savingField === "title" && <span className="text-xs text-muted ml-2 font-normal">Saving...</span>}
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => handleFieldBlur("title", title)}
            maxLength={255}
            required
            className="w-full px-3 py-2 border border-border rounded-md bg-bg text-fg focus:outline-none focus:border-accent"
          />
          <span className={`block text-right text-xs mt-1 ${title.length > 230 ? "text-warning" : "text-muted"}`}>
            {title.length}/255
          </span>
        </div>

        <div className="mb-4">
          <label htmlFor="tagline" className="block mb-2 font-medium text-sm">
            Tagline *
            {savingField === "tagline" && <span className="text-xs text-muted ml-2 font-normal">Saving...</span>}
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
            className="w-full px-3 py-2 border border-border rounded-md bg-bg text-fg focus:outline-none focus:border-accent"
          />
          <span className={`block text-right text-xs mt-1 ${tagline.length > 450 ? "text-warning" : "text-muted"}`}>
            {tagline.length}/500
          </span>
        </div>

        <div>
          <label htmlFor="description" className="block mb-2 font-medium text-sm">
            Description
            {savingField === "description" && <span className="text-xs text-muted ml-2 font-normal">Saving...</span>}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleFieldBlur("description", description)}
            maxLength={10000}
            rows={4}
            placeholder="Optional longer description"
            className="w-full px-3 py-2 border border-border rounded-md bg-bg text-fg resize-y min-h-[100px] focus:outline-none focus:border-accent"
          />
          <span className={`block text-right text-xs mt-1 ${description.length > 9000 ? "text-warning" : "text-muted"}`}>
            {description.length}/10000
          </span>
        </div>
      </section>

      {/* Links */}
      <section className="mb-6 pb-6 border-b border-border">
        <h2 className="text-lg font-semibold mb-1">Links</h2>
        <p className="text-muted text-sm mb-3">At least one URL is required</p>

        <div className="mb-4">
          <label htmlFor="mainUrl" className="block mb-2 font-medium text-sm">Live URL</label>
          <input
            id="mainUrl"
            type="url"
            value={mainUrl}
            onChange={(e) => setMainUrl(e.target.value)}
            onBlur={() => handleFieldBlur("mainUrl", mainUrl || null)}
            placeholder="https://your-app.com"
            className="w-full px-3 py-2 border border-border rounded-md bg-bg text-fg focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor="repoUrl" className="block mb-2 font-medium text-sm">Repository URL</label>
          <input
            id="repoUrl"
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onBlur={() => handleFieldBlur("repoUrl", repoUrl || null)}
            placeholder="https://github.com/user/repo"
            className="w-full px-3 py-2 border border-border rounded-md bg-bg text-fg focus:outline-none focus:border-accent"
          />
        </div>
      </section>

      {/* Tags */}
      <section className="mb-6 pb-6 border-b border-border">
        <h2 className="text-lg font-semibold mb-1">Technologies</h2>
        <p className="text-muted text-sm mb-3">
          We detected these tools. Add or remove as needed.
        </p>
        <TagEditor
          selected={tools}
          onChange={(newTools) => {
            setTools(newTools);
            handleFieldBlur("tools", newTools);
          }}
        />
      </section>

      {/* Vibe Score */}
      <section className="mb-6 pb-6 border-b border-border">
        <h2 className="text-lg font-semibold mb-1">Vibe Score</h2>
        <p className="text-muted text-sm mb-3">
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
      </section>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger rounded-md">
          <p className="text-danger m-0">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || !hasRequiredFields}
          className="py-3 text-base"
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
        <div className="max-w-[400px]">
          <p className="mb-3 leading-relaxed">You&apos;ll lose all changes and need to re-analyze the URL.</p>
          <p className="text-muted text-sm mb-3">This action cannot be undone.</p>
          <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-border">
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
