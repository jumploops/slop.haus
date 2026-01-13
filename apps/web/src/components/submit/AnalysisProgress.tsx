"use client";

import { useEffect } from "react";
import { useDraftProgress } from "@/hooks/useDraftProgress";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { UrlType } from "@slop/shared";

interface AnalysisProgressProps {
  draftId: string;
  detectedType: UrlType;
  inputUrl: string;
  onComplete: () => void;
  onError: (error: string, errorCode?: string) => void;
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
  const { status, message, error, errorCode, isComplete, steps } = useDraftProgress(draftId);

  // Handle completion
  useEffect(() => {
    if (isComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  // Handle error
  useEffect(() => {
    if (error) {
      onError(error, errorCode ?? undefined);
    }
  }, [error, errorCode, onError]);

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
        <Badge variant="default">{getTypeLabel(detectedType)}</Badge>
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
          <Button onClick={onCancel} variant="secondary">
            Try Again
          </Button>
        </div>
      )}

      {!error && !isComplete && (
        <Button onClick={onCancel} variant="ghost">
          Cancel
        </Button>
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
