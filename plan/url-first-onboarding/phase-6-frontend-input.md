# Phase 6: Frontend - URL Input & Progress

## Status: Not Started

## Goal

Build the URL input component and analysis progress UI for the first two steps of the submission flow.

## Dependencies

- Phase 4 complete (draft API endpoints)
- Phase 5 complete (SSE endpoint)

## Tasks

### 6.1 Create API Client Functions

**File:** `apps/web/src/lib/api/drafts.ts`

```typescript
import { apiPost, apiGet, apiPatch, apiDelete } from "../api";
import type {
  AnalyzeUrlRequest,
  AnalyzeUrlResponse,
  DraftResponse,
  UpdateDraftRequest,
  SubmitDraftRequest,
} from "@slop/shared";

export async function analyzeUrl(url: string): Promise<AnalyzeUrlResponse> {
  return apiPost<AnalyzeUrlResponse>("/drafts/analyze", { url });
}

export async function getDraft(draftId: string): Promise<DraftResponse> {
  return apiGet<DraftResponse>(`/drafts/${draftId}`);
}

export async function updateDraft(
  draftId: string,
  data: UpdateDraftRequest
): Promise<void> {
  await apiPatch(`/drafts/${draftId}`, data);
}

export async function submitDraft(
  draftId: string,
  data: SubmitDraftRequest
): Promise<{ project: { slug: string } }> {
  return apiPost(`/drafts/${draftId}/submit`, data);
}

export async function deleteDraft(draftId: string): Promise<void> {
  await apiDelete(`/drafts/${draftId}`);
}
```

### 6.2 Create URL Input Component

**File:** `apps/web/src/components/submit/UrlInput.tsx`

```tsx
"use client";

import { useState } from "react";

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function UrlInput({ onAnalyze, isLoading, error }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setValidationError("Please enter a URL");
      return false;
    }

    try {
      const parsed = new URL(value);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        setValidationError("Only HTTP/HTTPS URLs are supported");
        return false;
      }
      setValidationError(null);
      return true;
    } catch {
      setValidationError("Please enter a valid URL");
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateUrl(url)) {
      onAnalyze(url);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  };

  const displayError = error || validationError;

  return (
    <form onSubmit={handleSubmit} className="url-input-form">
      <div className="url-input-header">
        <h1>Share your vibecoded project</h1>
        <p className="text-muted">
          Enter a URL and we'll extract the details for you
        </p>
      </div>

      <div className="url-input-field">
        <input
          type="url"
          value={url}
          onChange={handleChange}
          placeholder="https://github.com/user/project or any live URL"
          disabled={isLoading}
          className={displayError ? "input-error" : ""}
          autoFocus
        />
        {displayError && (
          <span className="error-message">{displayError}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !url.trim()}
        className="btn btn-primary btn-large"
      >
        {isLoading ? "Analyzing..." : "Analyze Project"}
      </button>

      <div className="url-input-hints">
        <p className="text-muted text-small">
          Supported: GitHub, GitLab, npm, live websites, Chrome Web Store, Steam
        </p>
      </div>
    </form>
  );
}
```

### 6.3 Create Analysis Progress Component

**File:** `apps/web/src/components/submit/AnalysisProgress.tsx`

```tsx
"use client";

import { useDraftProgress } from "@/hooks/useDraftProgress";
import type { UrlType } from "@slop/shared";

interface AnalysisProgressProps {
  draftId: string;
  detectedType: UrlType;
  inputUrl: string;
  onComplete: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export function AnalysisProgress({
  draftId,
  detectedType,
  inputUrl,
  onComplete,
  onError,
  onCancel,
}: AnalysisProgressProps) {
  const { status, message, error, isComplete, steps } = useDraftProgress(draftId);

  // Handle completion
  if (isComplete) {
    onComplete();
  }

  // Handle error
  if (error) {
    onError(error);
  }

  const getTypeLabel = (type: UrlType): string => {
    const labels: Record<UrlType, string> = {
      github: "GitHub Repository",
      gitlab: "GitLab Repository",
      npm: "npm Package",
      pypi: "PyPI Package",
      chrome_webstore: "Chrome Extension",
      steam: "Steam Game",
      live_site: "Website",
    };
    return labels[type] || "URL";
  };

  return (
    <div className="analysis-progress">
      <div className="analysis-progress-header">
        <h2>Analyzing your project</h2>
        <p className="text-muted">{inputUrl}</p>
      </div>

      <div className="analysis-progress-type">
        <span className="badge">{getTypeLabel(detectedType)}</span>
      </div>

      <div className="analysis-progress-steps">
        <ProgressStep
          label="Fetching page content"
          status={steps.scraping}
        />
        <ProgressStep
          label="Extracting project details"
          status={steps.analyzing}
        />
      </div>

      <div className="analysis-progress-status">
        <span className="status-message">{message}</span>
      </div>

      {error && (
        <div className="analysis-progress-error">
          <p className="error-message">{error}</p>
          <button onClick={onCancel} className="btn btn-secondary">
            Try Again
          </button>
        </div>
      )}

      {!error && !isComplete && (
        <button onClick={onCancel} className="btn btn-ghost">
          Cancel
        </button>
      )}
    </div>
  );
}

interface ProgressStepProps {
  label: string;
  status: "pending" | "in_progress" | "completed";
}

function ProgressStep({ label, status }: ProgressStepProps) {
  return (
    <div className={`progress-step progress-step-${status}`}>
      <span className="progress-step-icon">
        {status === "completed" && <CheckIcon />}
        {status === "in_progress" && <SpinnerIcon />}
        {status === "pending" && <CircleIcon />}
      </span>
      <span className="progress-step-label">{label}</span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      className="spinner"
    >
      <circle cx="8" cy="8" r="6" strokeWidth="2" opacity="0.3" />
      <path d="M8 2a6 6 0 016 6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" opacity="0.3">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
```

### 6.4 Refactor Submit Page

**File:** `apps/web/src/app/submit/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireGitHub } from "@/components/auth/RequireGitHub";
import { UrlInput } from "@/components/submit/UrlInput";
import { AnalysisProgress } from "@/components/submit/AnalysisProgress";
import { analyzeUrl, deleteDraft } from "@/lib/api/drafts";
import Link from "next/link";
import type { UrlType } from "@slop/shared";

type SubmitStep = "input" | "analyzing" | "review";

interface AnalysisState {
  draftId: string;
  detectedType: UrlType;
  inputUrl: string;
}

export default function SubmitPage() {
  return (
    <RequireAuth>
      <RequireGitHub>
        <SubmitFlow />
      </RequireGitHub>
    </RequireAuth>
  );
}

function SubmitFlow() {
  const router = useRouter();
  const [step, setStep] = useState<SubmitStep>("input");
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeUrl(url);
      setAnalysis({
        draftId: result.draftId,
        detectedType: result.detectedUrlType,
        inputUrl: url,
      });
      setStep("analyzing");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze URL";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisComplete = () => {
    if (analysis) {
      router.push(`/submit/draft/${analysis.draftId}`);
    }
  };

  const handleAnalysisError = (errorMessage: string) => {
    setError(errorMessage);
    setStep("input");
  };

  const handleCancel = async () => {
    if (analysis) {
      try {
        await deleteDraft(analysis.draftId);
      } catch {
        // Ignore delete errors
      }
    }
    setAnalysis(null);
    setStep("input");
    setError(null);
  };

  return (
    <div className="submit-page">
      <div className="submit-container">
        {step === "input" && (
          <>
            <UrlInput
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              error={error}
            />
            <div className="submit-manual-link">
              <Link href="/submit/manual" className="text-muted">
                Or enter details manually
              </Link>
            </div>
          </>
        )}

        {step === "analyzing" && analysis && (
          <AnalysisProgress
            draftId={analysis.draftId}
            detectedType={analysis.detectedType}
            inputUrl={analysis.inputUrl}
            onComplete={handleAnalysisComplete}
            onError={handleAnalysisError}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}
```

### 6.5 Add CSS Styles

**File:** `apps/web/src/app/globals.css`

Add to existing CSS:

```css
/* URL Input */
.url-input-form {
  max-width: 600px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
}

.url-input-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.url-input-header h1 {
  margin-bottom: var(--space-2);
}

.url-input-field {
  margin-bottom: var(--space-4);
}

.url-input-field input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-size: 1.1rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: border-color 0.2s;
}

.url-input-field input:focus {
  border-color: var(--primary);
  outline: none;
}

.url-input-field input.input-error {
  border-color: var(--error);
}

.url-input-field .error-message {
  display: block;
  color: var(--error);
  font-size: 0.875rem;
  margin-top: var(--space-2);
}

.url-input-hints {
  margin-top: var(--space-4);
  text-align: center;
}

.btn-large {
  width: 100%;
  padding: var(--space-3) var(--space-6);
  font-size: 1.1rem;
}

/* Analysis Progress */
.analysis-progress {
  max-width: 500px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
  text-align: center;
}

.analysis-progress-header {
  margin-bottom: var(--space-4);
}

.analysis-progress-header h2 {
  margin-bottom: var(--space-2);
}

.analysis-progress-type {
  margin-bottom: var(--space-6);
}

.analysis-progress-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  text-align: left;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.progress-step-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.progress-step-completed .progress-step-icon {
  color: var(--success);
}

.progress-step-in_progress .progress-step-icon {
  color: var(--primary);
}

.progress-step-pending .progress-step-icon {
  color: var(--text-muted);
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.analysis-progress-status {
  margin-bottom: var(--space-4);
}

.analysis-progress-error {
  margin-top: var(--space-4);
}

.analysis-progress-error .error-message {
  color: var(--error);
  margin-bottom: var(--space-4);
}

/* Submit page */
.submit-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-container {
  width: 100%;
}

.submit-manual-link {
  text-align: center;
  margin-top: var(--space-6);
}
```

### 6.6 Move Old Form to Manual Route

**File:** `apps/web/src/app/submit/manual/page.tsx`

Move the current form-based submit page here (copy existing `submit/page.tsx` content).

## Verification

- [ ] URL input accepts valid URLs
- [ ] URL input shows validation errors
- [ ] Analyze button calls API and starts progress
- [ ] Progress component shows SSE updates
- [ ] Progress steps animate correctly
- [ ] Cancel button deletes draft and resets
- [ ] Error state shows retry option
- [ ] Complete redirects to review page
- [ ] Manual entry link works
- [ ] Mobile responsive

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/lib/api/drafts.ts` | NEW |
| `apps/web/src/hooks/useDraftProgress.ts` | NEW (from Phase 5) |
| `apps/web/src/components/submit/UrlInput.tsx` | NEW |
| `apps/web/src/components/submit/AnalysisProgress.tsx` | NEW |
| `apps/web/src/app/submit/page.tsx` | Refactor to URL-first |
| `apps/web/src/app/submit/manual/page.tsx` | NEW (move old form) |
| `apps/web/src/app/globals.css` | Add styles |

## Notes

- Old submit form preserved at `/submit/manual` for fallback
- Progress uses SSE with polling fallback
- Draft is deleted on cancel
- Error handling shows user-friendly messages
- Loading states prevent double-submission
