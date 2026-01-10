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
  placeholder = "Write a comment...",
}: CommentFormProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session?.user) {
    return (
      <div className="comment-form-signin">
        <p className="text-muted text-sm">Sign in to leave a comment</p>
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
      });
      setBody("");
      showToast("Comment posted", "success");
      onSuccess?.();
    } catch (error) {
      showToast("Failed to post comment", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={3}
      />
      <div className="comment-form-actions">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting} disabled={!body.trim()}>
          {parentCommentId ? "Reply" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
