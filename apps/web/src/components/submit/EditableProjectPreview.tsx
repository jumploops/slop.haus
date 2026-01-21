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
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
    <div className="space-y-6">
      {/* Edit mode banner */}
      <div className="bg-warning border-2 border-[color:var(--foreground)] px-4 py-2 text-xs font-bold text-fg text-center">
        Review your project. Click any highlighted area to edit.
      </div>

      {/* Project preview - mirrors ProjectDetails structure */}
      <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
        <div className="bg-bg border-2 border-[color:var(--border)] p-4">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Media section */}
            <div className="md:w-[420px] flex-shrink-0">
              <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary">
                <img
                  src={imageUrl}
                  alt={title || "Project screenshot"}
                  className="w-full object-cover aspect-video"
                />
              </div>
            </div>

            {/* Info section */}
            <div className="flex-1 space-y-3">
              <InlineEditText
                value={title}
                onSave={handleTitleSave}
                placeholder="Project Title"
                maxLength={255}
                required
                as="h1"
                className="text-2xl text-slop-blue"
              />

              <InlineEditText
                value={tagline}
                onSave={handleTaglineSave}
                placeholder="One-sentence description"
                maxLength={500}
                required
                className="text-sm text-muted font-normal"
                as="p"
              />

              {/* Author info (read-only) */}
              <div className="border-2 border-[color:var(--border)] bg-bg-secondary p-2 text-xs flex flex-wrap gap-3">
                <span className="flex items-center gap-2 font-bold text-slop-purple">
                  <Avatar src={userImage} alt={userName} size="sm" />
                  {userName}
                </span>
                <span className="text-muted">Submitted just now</span>
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-2">
                {mainUrl && (
                  <a
                    href={mainUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "primary", size: "sm" }),
                      "no-underline hover:no-underline"
                    )}
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
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "sm" }),
                      "no-underline hover:no-underline"
                    )}
                    onClick={(e) => e.preventDefault()}
                  >
                    <GithubIcon /> View Repo
                  </a>
                )}
                {!mainUrl && !repoUrl && (
                  <span className="text-xs text-muted">Add a URL below</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          {/* Description section */}
          <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
            <div className="bg-bg border-2 border-[color:var(--border)] p-4 space-y-3">
              <h3 className="text-sm font-bold text-slop-purple">~~ ABOUT THIS SLOP ~~</h3>
              <InlineEditTextarea
                value={description}
                onSave={handleDescriptionSave}
                placeholder="Add a description..."
                maxLength={10000}
              />
            </div>
          </div>

          {/* Tools section */}
          <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
            <div className="bg-bg border-2 border-[color:var(--border)] p-4 space-y-3">
              <h3 className="text-sm font-bold text-slop-purple">~~ BUILT WITH ~~</h3>
              {tools.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tools.map((tool) => (
                    <Badge key={tool} variant="default">
                      #{tool}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted">Add technologies...</span>
              )}
              <TagEditor selected={tools} onChange={handleToolsChange} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
            <div className="bg-bg border-2 border-[color:var(--border)] p-4 space-y-3">
              <h4 className="text-xs font-bold text-slop-purple text-center">~~ VIBE SCORE ~~</h4>
              <VibeMeter percent={vibePercent} showLabel />
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

          <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
            <div className="bg-bg border-2 border-[color:var(--border)] p-4">
              <h4 className="text-xs font-bold text-slop-purple text-center">~~ COMMUNITY VOTES ~~</h4>
              <div className="space-y-2 text-xs mt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-fg">People</span>
                  <span className="text-muted">+0 / -0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-fg">Devs</span>
                  <span className="text-muted">+0 / -0</span>
                </div>
              </div>
              <p className="text-[10px] text-muted mt-3">
                Voting enabled after submission
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* URL editors */}
      <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
        <div className="bg-bg border-2 border-[color:var(--border)] p-4 space-y-3">
          <h3 className="text-sm font-bold text-slop-purple">~~ PROJECT LINKS ~~</h3>
          <p className="text-[10px] text-muted">At least one URL is required</p>
          <div className="space-y-3">
            <Input
              label="Live URL"
              type="url"
              value={mainUrl}
              onChange={(e) => setMainUrl(e.target.value)}
              onBlur={() => onFieldChange("mainUrl", mainUrl || null)}
              placeholder="https://your-app.com"
            />
            <Input
              label="Repository URL"
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onBlur={() => onFieldChange("repoUrl", repoUrl || null)}
              placeholder="https://github.com/user/repo"
            />
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-4 text-center">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting || !hasRequiredFields}
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
