"use client";

import { useEffect } from "react";
import { useDraftProgress } from "@/hooks/useDraftProgress";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
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
    <div className="max-w-md mx-auto text-center">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Analyzing your project</h2>
        <p className="text-muted text-sm break-all">{inputUrl}</p>
      </div>

      <div className="mb-6">
        <Badge variant="default">{getTypeLabel(detectedType)}</Badge>
      </div>

      <div className="space-y-3 mb-6">
        <ProgressStep
          label="Fetching page content"
          status={steps.scraping}
        />
        <ProgressStep
          label="Extracting project details"
          status={steps.analyzing}
        />
      </div>

      <div className="mb-6">
        <p className="text-sm text-muted animate-pulse">{message}</p>
      </div>

      {error && (
        <div className="mb-6">
          <p className="text-sm text-danger mb-4">{error}</p>
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
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "flex items-center justify-center w-6 h-6",
          status === "completed" && "text-accent",
          status === "in_progress" && "text-accent",
          status === "pending" && "text-muted"
        )}
      >
        {status === "completed" && <CheckIcon />}
        {status === "in_progress" && <SpinnerIcon />}
        {status === "pending" && <CircleIcon />}
      </span>
      <span
        className={cn(
          "text-sm",
          status === "completed" && "text-fg",
          status === "in_progress" && "text-fg",
          status === "pending" && "text-muted"
        )}
      >
        {label}
      </span>
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
      className="animate-spin"
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
