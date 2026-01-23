"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { createComment } from "@/lib/api/comments";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/lib/auth-client";

interface CommentFormProps {
  projectSlug: string;
  parentCommentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({
  projectSlug,
  parentCommentId,
  onSuccess,
  onCancel,
  placeholder = "Write a review...",
}: CommentFormProps) {
  const { data: session, isPending } = useSession();
  const { showToast } = useToast();
  const [body, setBody] = useState("");
  const [reviewScore, setReviewScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isTopLevel = !parentCommentId;

  // Render placeholder during session loading to avoid hydration mismatch
  if (isPending) {
    return <div className="py-4 h-[120px]" />;
  }

  if (!session?.user) {
    return (
      <div className="border-2 border-dashed border-border bg-card p-4 text-center">
        <p className="text-muted-foreground text-sm font-mono">Sign in to leave a review</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isSubmitting) return;
    if (isTopLevel && reviewScore === null) {
      showToast("Select a slop score to post your review", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await createComment(projectSlug, {
        body: body.trim(),
        parentCommentId,
        reviewScore: isTopLevel ? reviewScore ?? undefined : undefined,
      });
      setBody("");
      setReviewScore(null);
      showToast(isTopLevel ? "Review posted" : "Reply posted", "success");
      onSuccess?.();
    } catch (error) {
      showToast(isTopLevel ? "Failed to post review" : "Failed to post reply", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-2 border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm font-bold text-foreground">
          {isTopLevel ? "Your Slop Score" : "Write a Reply"}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        )}
      </div>

      {isTopLevel && (
        <div className="space-y-2">
          <div className="relative pt-12 mt-4">
            <div
              className="absolute top-0 flex flex-col items-center rounded-sm border-2 border-border bg-card px-2 py-1 shadow-sm -translate-x-1/2 -translate-y-1"
              style={{
                left: `${Math.min(96, Math.max(4, ((reviewScore ?? 5) / 10) * 100))}%`,
              }}
            >
              <span
                className={`font-mono text-lg font-black leading-none ${reviewScore === null ? "text-muted-foreground" : getScoreColor(reviewScore)}`}
              >
                {reviewScore ?? "—"}
              </span>
              <span className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                {reviewScore === null ? "SELECT SCORE" : getScoreLabel(reviewScore)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={reviewScore ?? 5}
              onChange={(e) => setReviewScore(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-none bg-muted [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rotate-3 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-foreground [&::-webkit-slider-thumb]:bg-card"
            />
          </div>
          {reviewScore === null && (
            <p className="text-[10px] text-muted-foreground">Pick a score to enable posting.</p>
          )}
          <p className="text-[10px] text-muted-foreground">Rate the app from 0–10.</p>
        </div>
      )}

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="min-h-[90px]"
      />

      <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!body.trim() || (isTopLevel && reviewScore === null)}
          className="w-full sm:w-auto"
        >
          {isTopLevel ? "Post Review" : "Reply"}
        </Button>
      </div>
    </form>
  );
}

function getScoreLabel(score: number) {
  if (score >= 10) return "IMMACULATE SLOP";
  if (score >= 8) return "SOLID SLOP";
  if (score >= 6) return "DECENT SLOP";
  if (score >= 4) return "STALE SLOP";
  return "SLOPPY SLOP";
}

function getScoreColor(score: number) {
  if (score >= 8) return "text-primary";
  if (score >= 6) return "text-slop-lime";
  if (score >= 4) return "text-slop-orange";
  return "text-destructive";
}
