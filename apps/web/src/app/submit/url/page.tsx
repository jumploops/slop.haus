"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { SubmitHeaderCard } from "@/components/submit/SubmitHeaderCard";
import {
  SubmitAnalysisView,
  type SubmitAnalysisState,
  type SubmitErrorState,
} from "@/components/submit/SubmitAnalysisView";
import { UrlInput } from "@/components/submit/UrlInput";
import { analyzeUrl, deleteDraft, retryDraft } from "@/lib/api/drafts";

type SubmitStep = "input" | "analyzing" | "error";

export default function SubmitUrlPage() {
  const router = useRouter();
  const [step, setStep] = useState<SubmitStep>("input");
  const [urlInput, setUrlInput] = useState("");
  const [analysis, setAnalysis] = useState<SubmitAnalysisState | null>(null);
  const [error, setError] = useState<SubmitErrorState | null>(null);
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
      setStep("error");
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
    if (analysis?.draftId) {
      setIsLoading(true);
      try {
        await retryDraft(analysis.draftId);
        setError(null);
        setStep("analyzing");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to retry analysis";
        setError({ message });
        setStep("input");
        setAnalysis(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setError(null);
    setStep("input");
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
    <RequireAuth>
      <div className="-mx-4 space-y-6 md:mx-0">
        {step === "input" ? (
          <SubmitHeaderCard activeTab="url">
            <div className="space-y-4">
              <p className="text-center text-xs text-muted-foreground">
                Supported: GitHub, GitLab, npm, live websites, Chrome Web Store, Steam
              </p>
              <UrlInput
                value={urlInput}
                onChange={setUrlInput}
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
                error={error?.message ?? null}
                showIntro={false}
                showSupportedText={false}
              />
            </div>
          </SubmitHeaderCard>
        ) : (
          <SubmitAnalysisView
            step={step}
            analysis={analysis}
            error={error}
            onComplete={handleAnalysisComplete}
            onError={handleAnalysisError}
            onCancel={handleCancel}
            onRetry={handleRetry}
            onManualEntry={handleManualEntry}
          />
        )}
      </div>
    </RequireAuth>
  );
}
