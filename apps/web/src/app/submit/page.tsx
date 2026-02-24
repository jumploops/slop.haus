"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireGitHub } from "@/components/auth/RequireGitHub";
import { UrlInput } from "@/components/submit/UrlInput";
import { GitHubRepoPicker } from "@/components/submit/GitHubRepoPicker";
import { AnalysisProgress } from "@/components/submit/AnalysisProgress";
import { AnalysisError } from "@/components/submit/AnalysisError";
import { analyzeUrl, deleteDraft, retryDraft } from "@/lib/api/drafts";
import type { UrlType } from "@slop/shared";

type SubmitStep = "input" | "analyzing" | "error";

interface AnalysisState {
  draftId: string;
  detectedType: UrlType;
  inputUrl: string;
}

interface ErrorState {
  message: string;
  code?: string;
}

export default function SubmitPage() {
  return (
    <RequireAuth>
      <div className="-mx-4 md:mx-0">
        <RequireGitHub>
          <SubmitFlow />
        </RequireGitHub>
      </div>
    </RequireAuth>
  );
}

function SubmitFlow() {
  const router = useRouter();
  const [step, setStep] = useState<SubmitStep>("input");
  const [urlInput, setUrlInput] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (url: string) => {
    setUrlInput(url);
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
      setError({ message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisComplete = useCallback(() => {
    if (analysis) {
      router.push(`/submit/draft/${analysis.draftId}`);
    }
  }, [analysis, router]);

  const handleAnalysisError = useCallback((errorMessage: string, errorCode?: string) => {
    setError({ message: errorMessage, code: errorCode });
    setStep("error");
  }, []);

  const handleRetry = async () => {
    // If we have a failed draft, try to retry it
    if (analysis?.draftId) {
      setIsLoading(true);
      try {
        await retryDraft(analysis.draftId);
        setError(null);
        setStep("analyzing");
      } catch (err) {
        // If retry fails (e.g., rate limit), show error and go back to input
        const message = err instanceof Error ? err.message : "Failed to retry analysis";
        setError({ message });
        setStep("input");
        setAnalysis(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      // No draft to retry, just go back to input
      setError(null);
      setStep("input");
    }
  };

  const handleManualEntry = () => {
    router.push("/submit/manual");
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
    <div className="mx-auto max-w-2xl space-y-6">
        {step === "input" && (
          <>
            <div className="border-y-2 border-dashed border-border bg-card p-6 md:border-2">
              <UrlInput
                value={urlInput}
                onChange={setUrlInput}
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
                error={error?.message ?? null}
              />
              <GitHubRepoPicker
                onSelectRepo={(repoUrl) => {
                  void handleAnalyze(repoUrl);
                }}
                selectedRepoUrl={urlInput || undefined}
                isLoading={isLoading}
                className="mt-6"
              />
              <div className="mt-4 text-center">
                <Link
                  href="/submit/manual"
                  className="font-mono text-xs uppercase tracking-wide text-muted-foreground hover:text-primary no-underline hover:no-underline"
                >
                  Or enter details manually
                </Link>
              </div>
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

        {step === "error" && error && (
          <AnalysisError
            error={error.message}
            errorCode={error.code}
            onRetry={handleRetry}
            onManualEntry={handleManualEntry}
          />
        )}
    </div>
  );
}
