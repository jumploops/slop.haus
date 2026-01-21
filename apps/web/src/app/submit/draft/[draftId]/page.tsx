"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireGitHub } from "@/components/auth/RequireGitHub";
import { EditableProjectPreview } from "@/components/submit/EditableProjectPreview";
import { getDraft, updateDraft, submitDraft, deleteDraft } from "@/lib/api/drafts";
import { Button } from "@/components/ui/Button";

interface DraftData {
  draftId: string;
  status: string;
  inputUrl: string;
  detectedUrlType: string;
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
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadDraft() {
      try {
        const { draft: draftData } = await getDraft(draftId);

        if (draftData.status !== "ready") {
          // Redirect if not ready
          if (
            draftData.status === "pending" ||
            draftData.status === "scraping" ||
            draftData.status === "analyzing"
          ) {
            router.push("/submit");
          } else {
            setError(`Draft is ${draftData.status}`);
          }
          return;
        }

        setDraft({
          draftId: draftData.draftId,
          status: draftData.status,
          inputUrl: draftData.inputUrl,
          detectedUrlType: draftData.detectedUrlType,
          screenshot: draftData.screenshot,
          suggested: draftData.suggested || {
            title: null,
            tagline: null,
            description: null,
            tools: [],
            vibePercent: null,
            mainUrl: null,
            repoUrl: null,
          },
          final: draftData.final || {
            title: null,
            tagline: null,
            description: null,
            tools: null,
            vibePercent: null,
            mainUrl: null,
            repoUrl: null,
          },
        });
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

  const handleSubmit = async (
    vibeMode: "overview" | "detailed",
    vibeDetails?: Record<string, number>
  ) => {
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
      <div className="max-w-2xl mx-auto">
        <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-6 text-center">
          <p className="text-sm text-muted">Loading draft...</p>
        </div>
      </div>
    );
  }

  if (error && !draft) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-6 text-center">
          <h2 className="text-lg font-bold text-danger mb-2">Error</h2>
          <p className="text-sm text-fg mb-4">{error}</p>
          <Button onClick={() => router.push("/submit")} variant="primary">
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  if (!draft) return null;

  return (
    <EditableProjectPreview
      draft={draft}
      onFieldChange={handleUpdate}
      onSubmit={handleSubmit}
      onStartOver={handleStartOver}
      isSubmitting={submitting}
      error={error}
    />
  );
}
