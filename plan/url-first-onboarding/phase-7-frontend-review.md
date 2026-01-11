# Phase 7: Frontend - Draft Review & Edit

## Status: Not Started

## Goal

Build the draft review page where users can see extracted data, edit fields, and submit their project.

## Dependencies

- Phase 6 complete (URL input and progress UI)

## Tasks

### 7.1 Create Draft Review Page

**File:** `apps/web/src/app/submit/draft/[draftId]/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireGitHub } from "@/components/auth/RequireGitHub";
import { DraftReview } from "@/components/submit/DraftReview";
import { getDraft, updateDraft, submitDraft, deleteDraft } from "@/lib/api/drafts";
import { Skeleton } from "@/components/ui/Skeleton";
import type { EnrichmentDraft } from "@slop/shared";

export default function DraftReviewPage() {
  const params = useParams();
  const draftId = params.draftId as string;

  return (
    <RequireAuth>
      <RequireGitHub>
        <DraftReviewContent draftId={draftId} />
      </RequireGitHub>
    </RequireAuth>
  );
}

function DraftReviewContent({ draftId }: { draftId: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<EnrichmentDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadDraft() {
      try {
        const { draft } = await getDraft(draftId);

        if (draft.status !== "ready") {
          // Redirect if not ready
          if (draft.status === "pending" || draft.status === "scraping" || draft.status === "analyzing") {
            router.push("/submit");
          } else {
            setError(`Draft is ${draft.status}`);
          }
          return;
        }

        setDraft(draft as EnrichmentDraft);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load draft");
      } finally {
        setLoading(false);
      }
    }

    loadDraft();
  }, [draftId, router]);

  const handleUpdate = async (field: string, value: unknown) => {
    if (!draft) return;

    try {
      await updateDraft(draftId, { [field]: value });
      setDraft({
        ...draft,
        final: {
          ...draft.final,
          [field]: value,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleSubmit = async (vibeMode: "overview" | "detailed", vibeDetails?: Record<string, number>) => {
    setSubmitting(true);
    setError(null);

    try {
      const { project } = await submitDraft(draftId, { vibeMode, vibeDetails });
      router.push(`/p/${project.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
      setSubmitting(false);
    }
  };

  const handleStartOver = async () => {
    try {
      await deleteDraft(draftId);
    } catch {
      // Ignore
    }
    router.push("/submit");
  };

  if (loading) {
    return (
      <div className="draft-review-page">
        <div className="draft-review-container">
          <Skeleton height={400} />
        </div>
      </div>
    );
  }

  if (error && !draft) {
    return (
      <div className="draft-review-page">
        <div className="draft-review-container">
          <div className="error-state">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => router.push("/submit")} className="btn btn-primary">
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!draft) return null;

  return (
    <div className="draft-review-page">
      <div className="draft-review-container">
        <DraftReview
          draft={draft}
          onUpdate={handleUpdate}
          onSubmit={handleSubmit}
          onStartOver={handleStartOver}
          isSubmitting={submitting}
          error={error}
        />
      </div>
    </div>
  );
}
```

### 7.2 Create Draft Review Component

**File:** `apps/web/src/components/submit/DraftReview.tsx`

```tsx
"use client";

import { useState } from "react";
import { ScreenshotPreview } from "./ScreenshotPreview";
import { TagEditor } from "./TagEditor";
import { VibeInput } from "@/components/form/VibeInput";
import type { EnrichmentDraft } from "@slop/shared";

interface DraftReviewProps {
  draft: EnrichmentDraft;
  onUpdate: (field: string, value: unknown) => Promise<void>;
  onSubmit: (vibeMode: "overview" | "detailed", vibeDetails?: Record<string, number>) => void;
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
  const [description, setDescription] = useState(getValue<string>("description") || "");
  const [mainUrl, setMainUrl] = useState(getValue<string>("mainUrl") || "");
  const [repoUrl, setRepoUrl] = useState(getValue<string>("repoUrl") || "");
  const [tools, setTools] = useState<string[]>(getValue<string[]>("tools") || []);
  const [vibeMode, setVibeMode] = useState<"overview" | "detailed">("overview");
  const [vibePercent, setVibePercent] = useState(getValue<number>("vibePercent") || 50);
  const [vibeDetails, setVibeDetails] = useState<Record<string, number>>({});

  const handleFieldBlur = (field: string, value: unknown) => {
    onUpdate(field, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(vibeMode, vibeMode === "detailed" ? vibeDetails : undefined);
  };

  const hasRequiredFields = title.trim() && tagline.trim() && (mainUrl || repoUrl);

  return (
    <form onSubmit={handleSubmit} className="draft-review">
      <div className="draft-review-header">
        <h1>Review Your Project</h1>
        <p className="text-muted">
          We've extracted these details from {draft.inputUrl}. Edit anything that looks wrong.
        </p>
      </div>

      {/* Screenshot */}
      {draft.screenshotUrl && (
        <div className="draft-review-section">
          <ScreenshotPreview
            url={draft.screenshotUrl}
            onReplace={() => {
              // Future: allow replacing screenshot
              console.log("Replace screenshot - not implemented");
            }}
          />
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
          percent={vibePercent}
          onPercentChange={(value) => {
            setVibePercent(value);
            handleFieldBlur("vibePercent", value);
          }}
          details={vibeDetails}
          onDetailsChange={setVibeDetails}
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
        <button
          type="submit"
          disabled={isSubmitting || !hasRequiredFields}
          className="btn btn-primary btn-large"
        >
          {isSubmitting ? "Submitting..." : "Submit Project"}
        </button>
        <button
          type="button"
          onClick={onStartOver}
          disabled={isSubmitting}
          className="btn btn-ghost"
        >
          Start Over
        </button>
      </div>
    </form>
  );
}
```

### 7.3 Create Screenshot Preview Component

**File:** `apps/web/src/components/submit/ScreenshotPreview.tsx`

```tsx
"use client";

import Image from "next/image";

interface ScreenshotPreviewProps {
  url: string;
  onReplace: () => void;
}

export function ScreenshotPreview({ url, onReplace }: ScreenshotPreviewProps) {
  return (
    <div className="screenshot-preview">
      <div className="screenshot-preview-image">
        <Image
          src={url}
          alt="Project screenshot"
          width={640}
          height={400}
          style={{ objectFit: "cover" }}
        />
      </div>
      <div className="screenshot-preview-actions">
        <button
          type="button"
          onClick={onReplace}
          className="btn btn-ghost btn-small"
        >
          Change screenshot
        </button>
      </div>
    </div>
  );
}
```

### 7.4 Create Tag Editor Component

**File:** `apps/web/src/components/submit/TagEditor.tsx`

```tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { getTools } from "@/lib/api/tools";

interface TagEditorProps {
  selected: string[];
  onChange: (tools: string[]) => void;
  maxTags?: number;
}

export function TagEditor({ selected, onChange, maxTags = 10 }: TagEditorProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: tools = [] } = useSWR("tools", getTools);

  const filteredTools = tools
    .filter((tool) => !selected.includes(tool.slug))
    .filter(
      (tool) =>
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.slug.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 8);

  const handleAdd = (slug: string) => {
    if (selected.length < maxTags && !selected.includes(slug)) {
      onChange([...selected, slug]);
    }
    setSearch("");
    setIsOpen(false);
  };

  const handleRemove = (slug: string) => {
    onChange(selected.filter((s) => s !== slug));
  };

  const selectedTools = tools.filter((t) => selected.includes(t.slug));

  return (
    <div className="tag-editor">
      <div className="tag-editor-selected">
        {selectedTools.map((tool) => (
          <span key={tool.slug} className="tag">
            {tool.name}
            <button
              type="button"
              onClick={() => handleRemove(tool.slug)}
              className="tag-remove"
              aria-label={`Remove ${tool.name}`}
            >
              &times;
            </button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-muted">No technologies selected</span>
        )}
      </div>

      {selected.length < maxTags && (
        <div className="tag-editor-input">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search to add..."
          />

          {isOpen && search && filteredTools.length > 0 && (
            <div className="tag-editor-dropdown">
              {filteredTools.map((tool) => (
                <button
                  key={tool.slug}
                  type="button"
                  onClick={() => handleAdd(tool.slug)}
                  className="tag-editor-option"
                >
                  {tool.name}
                </button>
              ))}
            </div>
          )}

          {isOpen && search && filteredTools.length === 0 && (
            <div className="tag-editor-dropdown">
              <span className="text-muted">No matching tools</span>
            </div>
          )}
        </div>
      )}

      <p className="text-muted text-small">
        {selected.length}/{maxTags} technologies
      </p>
    </div>
  );
}
```

### 7.5 Add CSS Styles

**File:** `apps/web/src/app/globals.css`

Add to existing CSS:

```css
/* Draft Review Page */
.draft-review-page {
  padding: var(--space-6) var(--space-4);
}

.draft-review-container {
  max-width: 700px;
  margin: 0 auto;
}

.draft-review-header {
  margin-bottom: var(--space-6);
}

.draft-review-header h1 {
  margin-bottom: var(--space-2);
}

.draft-review-section {
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--border-color);
}

.draft-review-section h2 {
  font-size: 1.1rem;
  margin-bottom: var(--space-3);
}

.draft-review-error {
  margin-bottom: var(--space-4);
}

.draft-review-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Screenshot Preview */
.screenshot-preview {
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-secondary);
}

.screenshot-preview-image {
  position: relative;
  aspect-ratio: 16 / 10;
}

.screenshot-preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.screenshot-preview-actions {
  padding: var(--space-2);
  text-align: center;
}

/* Tag Editor */
.tag-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.tag-editor-selected {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  min-height: 36px;
  align-items: center;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0 var(--space-1);
  font-size: 1.1rem;
  line-height: 1;
}

.tag-remove:hover {
  color: var(--error);
}

.tag-editor-input {
  position: relative;
}

.tag-editor-input input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
}

.tag-editor-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.tag-editor-option {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

.tag-editor-option:hover {
  background: var(--bg-secondary);
}

/* Error state */
.error-state {
  text-align: center;
  padding: var(--space-8);
}

.error-state h2 {
  margin-bottom: var(--space-2);
}

.error-state p {
  margin-bottom: var(--space-4);
}
```

### 7.6 Configure Next.js for External Images

**File:** `next.config.js`

Ensure storage URLs are allowed:

```js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      // Add production storage domain when needed
    ],
  },
};
```

## Verification

- [ ] Draft page loads correctly when status is "ready"
- [ ] Redirects to /submit if draft not ready
- [ ] All suggested fields pre-populated
- [ ] Fields are editable
- [ ] Changes saved on blur
- [ ] Tag editor shows suggestions
- [ ] Tag editor limits to max tags
- [ ] Vibe input works in both modes
- [ ] Submit creates project
- [ ] Submit redirects to project page
- [ ] Start over deletes draft and redirects
- [ ] Error states handled gracefully
- [ ] Mobile responsive

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/app/submit/draft/[draftId]/page.tsx` | NEW |
| `apps/web/src/components/submit/DraftReview.tsx` | NEW |
| `apps/web/src/components/submit/ScreenshotPreview.tsx` | NEW |
| `apps/web/src/components/submit/TagEditor.tsx` | NEW |
| `apps/web/src/app/globals.css` | Add styles |
| `next.config.js` | Add image domain |

## Notes

- Fields auto-save on blur (debounced)
- Final values override suggested on submit
- Vibe score can be changed from AI suggestion
- Screenshot replacement is future enhancement
- Form validation matches existing schema requirements
