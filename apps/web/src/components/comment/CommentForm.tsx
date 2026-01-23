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
  const [reviewScore, setReviewScore] = useState(5);
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

    setIsSubmitting(true);
    try {
      await createComment(projectSlug, {
        body: body.trim(),
        parentCommentId,
        reviewScore: isTopLevel ? reviewScore : undefined,
      });
      setBody("");
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
          {isTopLevel ? "Write a Review" : "Write a Reply"}
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
          <label className="mb-2 block font-mono text-sm text-muted-foreground">
            Your Slop Score
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={reviewScore}
              onChange={(e) => setReviewScore(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-none bg-muted [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rotate-3 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-foreground [&::-webkit-slider-thumb]:bg-card"
            />
            <div className="flex w-24 flex-col items-center">
              <span className={`font-mono text-2xl font-black ${getScoreColor(reviewScore)}`}>
                {reviewScore}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {getScoreLabel(reviewScore)}
              </span>
            </div>
          </div>
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
          disabled={!body.trim()}
          className="w-full sm:w-auto"
        >
          {isTopLevel ? "Post Review" : "Reply"}
        </Button>
      </div>
    </form>
  );
}

function getScoreLabel(score: number) {
  if (score >= 9) return "CERTIFIED SLOP";
  if (score >= 8) return "FRESH SLOP";
  if (score >= 6) return "DECENT SLOP";
  if (score >= 4) return "STALE SLOP";
  return "ROTTEN SLOP";
}

function getScoreColor(score: number) {
  if (score >= 8) return "text-primary";
  if (score >= 6) return "text-slop-lime";
  if (score >= 4) return "text-slop-orange";
  return "text-destructive";
}
