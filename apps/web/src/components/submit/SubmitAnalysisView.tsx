"use client";

import { AnalysisProgress } from "@/components/submit/AnalysisProgress";
import { AnalysisError } from "@/components/submit/AnalysisError";
import type { UrlType } from "@slop/shared";

export interface SubmitAnalysisState {
  draftId: string;
  detectedType: UrlType;
  inputUrl: string;
}

export interface SubmitErrorState {
  message: string;
  code?: string;
}

interface SubmitAnalysisViewProps {
  step: "analyzing" | "error";
  analysis: SubmitAnalysisState | null;
  error: SubmitErrorState | null;
  onComplete: () => void;
  onError: (errorMessage: string, errorCode?: string) => void;
  onCancel: () => void;
  onRetry: () => void;
  onManualEntry: () => void;
}

export function SubmitAnalysisView({
  step,
  analysis,
  error,
  onComplete,
  onError,
  onCancel,
  onRetry,
  onManualEntry,
}: SubmitAnalysisViewProps) {
  return (
    <div className="mx-auto max-w-2xl">
      {step === "analyzing" && analysis && (
        <AnalysisProgress
          draftId={analysis.draftId}
          detectedType={analysis.detectedType}
          inputUrl={analysis.inputUrl}
          onComplete={onComplete}
          onError={onError}
          onCancel={onCancel}
        />
      )}

      {step === "error" && error && (
        <AnalysisError
          error={error.message}
          errorCode={error.code}
          onRetry={onRetry}
          onManualEntry={onManualEntry}
        />
      )}
    </div>
  );
}
