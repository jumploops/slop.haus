"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { SubmitHeaderCard } from "@/components/submit/SubmitHeaderCard";
import {
  SubmitAnalysisView,
  type SubmitAnalysisState,
  type SubmitErrorState,
} from "@/components/submit/SubmitAnalysisView";
import { GitHubRepoPicker } from "@/components/submit/GitHubRepoPicker";
import { Button } from "@/components/ui/Button";
import { analyzeUrl, deleteDraft, retryDraft } from "@/lib/api/drafts";
import { fetchCurrentUser } from "@/lib/api/auth";
import { linkSocial } from "@/lib/auth-client";

type SubmitStep = "input" | "analyzing" | "error";

export default function SubmitRepoPage() {
  const router = useRouter();
  const { data: user, isLoading: isUserLoading, error: userError } = useSWR(
    "/auth/me",
    fetchCurrentUser
  );

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
      const message = err instanceof Error ? err.message : "Failed to analyze repository";
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

  const handleLinkGitHub = () => {
    linkSocial({
      provider: "github",
      callbackURL: `${window.location.origin}/submit/repo`,
    });
  };

  return (
    <RequireAuth>
      <div className="-mx-4 space-y-6 md:mx-0">
        {step === "input" ? (
          <SubmitHeaderCard activeTab="repo">
            <div className="space-y-4">
              <p className="text-center text-xs text-muted-foreground">
                Choose a public repository and we&apos;ll analyze it automatically.
              </p>

              {isUserLoading && (
                <p className="text-xs text-muted-foreground">Checking GitHub connection...</p>
              )}

              {!isUserLoading && userError && (
                <p className="text-xs text-destructive">
                  Could not load your account connection status right now.
                </p>
              )}

              {!isUserLoading && !userError && !user?.hasGitHub && (
                <div className="space-y-3 border-y-2 border-dashed border-border bg-bg p-4 text-center md:border-2">
                  <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-foreground">
                    Link GitHub to Browse Repos
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Connect your GitHub account to import a public repo in one click. Use the same
                    email as your current account when linking providers.
                  </p>
                  <Button type="button" variant="primary" onClick={handleLinkGitHub}>
                    Link GitHub Account
                  </Button>
                </div>
              )}

              {!isUserLoading && user?.hasGitHub && (
                <GitHubRepoPicker
                  onSelectRepo={(repoUrl) => {
                    void handleAnalyze(repoUrl);
                  }}
                  selectedRepoUrl={urlInput || undefined}
                  isLoading={isLoading}
                />
              )}
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
