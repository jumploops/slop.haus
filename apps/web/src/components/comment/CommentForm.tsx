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
      <div className="py-2 text-center">
        <p className="text-muted text-sm">Sign in to leave a review</p>
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-[10px] font-bold text-slop-purple">
        {isTopLevel ? "📝 ADD YOUR REVIEW:" : "💬 ADD YOUR REPLY:"}
      </p>
      {isTopLevel && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-muted">
            <span>Slop</span>
            <span>Solid</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={reviewScore}
              onChange={(e) => setReviewScore(Number(e.target.value))}
              className="w-full accent-[color:var(--accent)]"
            />
            <span className="text-sm font-bold text-fg w-8 text-right">
              {reviewScore}
            </span>
          </div>
          <p className="text-[10px] text-muted">Rate the app from 0–10.</p>
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
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
        )}
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
