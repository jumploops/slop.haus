"use client";

import { useState } from "react";
import { DEFAULT_VIBE_DETAILS } from "@slop/shared";
import { ScreenshotPreview } from "./ScreenshotPreview";
import { TagEditor } from "./TagEditor";
import { VibeInput } from "@/components/form/VibeInput";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
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

  const labelWithSaving = (label: string, field: string) => (
    <span className="flex items-center gap-2">
      <span>{label}</span>
      {savingField === field && (
        <span className="text-[10px] text-muted">Saving...</span>
      )}
    </span>
  );

  const countHelper = (count: number, max: number, warnAt: number) => (
    <span
      className={`block text-right ${count > warnAt ? "text-warning" : ""}`}
    >
      {count}/{max}
    </span>
  );

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3">
        <div className="bg-bg border-2 border-[color:var(--border)] p-4">
          <h1 className="text-xl font-bold text-slop-blue">★ REVIEW YOUR PROJECT ★</h1>
          <p className="text-xs text-muted mt-2">
            We&apos;ve extracted these details from {draft.inputUrl}. Edit anything that looks wrong.
          </p>
        </div>
      </header>

      {draft.screenshot && (
        <section className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3">
          <div className="bg-bg border-2 border-[color:var(--border)] p-4">
            <h2 className="text-sm font-bold text-slop-purple">SCREENSHOT</h2>
            <div className="mt-3">
              <ScreenshotPreview url={draft.screenshot} />
            </div>
          </div>
        </section>
      )}

      <section className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3">
        <div className="bg-bg border-2 border-[color:var(--border)] p-4 space-y-4">
          <h2 className="text-sm font-bold text-slop-purple">BASIC INFO</h2>

          <Input
            id="title"
            label={labelWithSaving("Title *", "title")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => handleFieldBlur("title", title)}
            maxLength={255}
            required
            helperText={countHelper(title.length, 255, 230)}
          />

          <Input
            id="tagline"
            label={labelWithSaving("Tagline *", "tagline")}
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            onBlur={() => handleFieldBlur("tagline", tagline)}
            maxLength={500}
            placeholder="One-sentence description"
            required
            helperText={countHelper(tagline.length, 500, 450)}
          />

          <Textarea
            id="description"
            label={labelWithSaving("Description", "description")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleFieldBlur("description", description)}
            maxLength={10000}
            rows={4}
            placeholder="Optional longer description"
            helperText={countHelper(description.length, 10000, 9000)}
          />
        </div>
      </section>

      <section className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3">
        <div className="bg-bg border-2 border-[color:var(--border)] p-4 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slop-purple">LINKS</h2>
            <p className="text-xs text-muted mt-1">At least one URL is required.</p>
          </div>

          <Input
            id="mainUrl"
            type="url"
            label="Live URL"
            value={mainUrl}
            onChange={(e) => setMainUrl(e.target.value)}
            onBlur={() => handleFieldBlur("mainUrl", mainUrl || null)}
            placeholder="https://your-app.com"
          />

          <Input
            id="repoUrl"
            type="url"
            label="Repository URL"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onBlur={() => handleFieldBlur("repoUrl", repoUrl || null)}
            placeholder="https://github.com/user/repo"
          />
        </div>
      </section>

      <section className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3">
        <div className="bg-bg border-2 border-[color:var(--border)] p-4 space-y-3">
          <div>
            <h2 className="text-sm font-bold text-slop-purple">TECHNOLOGIES</h2>
            <p className="text-xs text-muted mt-1">
              We detected these tools. Add or remove as needed.
            </p>
          </div>
          <TagEditor
            selected={tools}
            onChange={(newTools) => {
              setTools(newTools);
              handleFieldBlur("tools", newTools);
            }}
          />
        </div>
      </section>

      <section className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3">
        <div className="bg-bg border-2 border-[color:var(--border)] p-4 space-y-3">
          <div>
            <h2 className="text-sm font-bold text-slop-purple">VIBE SCORE</h2>
            <p className="text-xs text-muted mt-1">
              How much AI was involved in creating this project?
            </p>
          </div>
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
      </section>

      {error && (
        <div className="border-2 border-danger bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3">
          <div className="bg-bg border-2 border-danger/70 p-3">
            <p className="text-danger font-bold text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3">
        <div className="bg-bg border-2 border-[color:var(--border)] p-4 flex flex-col gap-3">
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
      </div>

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
