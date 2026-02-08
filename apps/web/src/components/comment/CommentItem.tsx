"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { CommentForm } from "./CommentForm";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { deleteComment, voteOnComment } from "@/lib/api/comments";
import { useToast } from "@/components/ui/Toast";
import type { CommentWithChildren } from "@/lib/api/comments";
import { ThumbsUp } from "lucide-react";
import { getSlopBandForReviewScore } from "@slop/shared";
import { getSlopBandBadgeClass } from "@/lib/slop-score-presentation";

interface CommentItemProps {
  comment: CommentWithChildren;
  projectSlug: string;
  onCommentUpdate: () => void;
}

export function CommentItem({ comment, projectSlug, onCommentUpdate }: CommentItemProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(comment.upvoteCount);

  useEffect(() => {
    setLocalUpvotes(comment.upvoteCount);
  }, [comment.upvoteCount]);

  const isOwner = session?.user?.id === comment.author.id;
  const canDelete =
    isOwner ||
    session?.user?.role === "admin" ||
    session?.user?.role === "mod";

  const handleDelete = async () => {
    const label = comment.reviewScore !== null ? "review" : "comment";
    if (!confirm(`Are you sure you want to delete this ${label}?`)) return;

    setIsDeleting(true);
    try {
      await deleteComment(comment.id);
      showToast(comment.reviewScore !== null ? "Review deleted" : "Comment deleted", "success");
      onCommentUpdate();
    } catch (error) {
      showToast(comment.reviewScore !== null ? "Failed to delete review" : "Failed to delete comment", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplySuccess = () => {
    setIsReplying(false);
    onCommentUpdate();
  };

  const handleVote = async () => {
    if (!session?.user || isVoting) return;
    setIsVoting(true);

    const nextValue = hasUpvoted ? 0 : 1;
    try {
      const result = await voteOnComment(comment.id, { value: nextValue });
      setHasUpvoted(nextValue === 1);
      setLocalUpvotes(result.upvoteCount);
      onCommentUpdate();
    } catch (error) {
      showToast(comment.reviewScore !== null ? "Failed to vote on review" : "Failed to vote", "error");
    } finally {
      setIsVoting(false);
    }
  };

  if (comment.status === "removed") {
    return (
      <div className="border-2 border-border bg-card p-3">
        <p className="text-muted-foreground italic text-sm">[removed]</p>
        {comment.children.length > 0 && (
          <div className="ml-3 sm:ml-6 mt-3 border-l-2 border-border pl-4">
            {comment.children.map((child) => (
              <CommentItem
                key={child.id}
                comment={child}
                projectSlug={projectSlug}
                onCommentUpdate={onCommentUpdate}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-2 border-border bg-card p-4">
      <div className="flex items-start gap-4">
        {comment.reviewScore !== null && (
          <div className="flex-shrink-0">
            <div
              className={cn(
                "flex h-8 w-8 rotate-3 items-center justify-center rounded-sm font-mono text-xs font-black shadow-md",
                getSlopBandBadgeClass(getSlopBandForReviewScore(comment.reviewScore))
              )}
            >
              {comment.reviewScore}
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <Avatar src={comment.author.image} alt={comment.author.name} size="sm" />
            <span className="font-mono text-sm font-bold text-foreground break-words">
              {comment.author.name}
            </span>
            {comment.author.devVerified && <Badge variant="dev">Dev</Badge>}
            <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
          </div>

          <p className="mb-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
            {comment.body}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={handleVote}
              disabled={!session?.user || isVoting}
              className={cn(
                "flex items-center gap-1.5 font-mono transition-colors",
                hasUpvoted ? "text-primary" : "hover:text-foreground",
                (!session?.user || isVoting) && "opacity-50 cursor-not-allowed"
              )}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>
                {localUpvotes} {comment.reviewScore !== null ? "helpful" : "upvotes"}
              </span>
            </button>
            {session?.user && comment.depth < 10 && (
              <button
                type="button"
                onClick={() => setIsReplying(!isReplying)}
                className="font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                Reply
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="font-mono text-xs text-muted-foreground hover:text-destructive"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>

          {isReplying && (
            <div className="mt-4">
              <CommentForm
                projectSlug={projectSlug}
                parentCommentId={comment.id}
                onSuccess={handleReplySuccess}
                onCancel={() => setIsReplying(false)}
                placeholder={`Reply to ${comment.author.name}...`}
              />
            </div>
          )}

          {comment.children.length > 0 && (
            <div className="ml-3 sm:ml-6 mt-4 border-l-2 border-border pl-4 space-y-3">
              {comment.children.map((child) => (
                <CommentItem
                  key={child.id}
                  comment={child}
                  projectSlug={projectSlug}
                  onCommentUpdate={onCommentUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
