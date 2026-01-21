"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CommentForm } from "./CommentForm";
import { formatRelativeTime } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { deleteComment } from "@/lib/api/comments";
import { useToast } from "@/components/ui/Toast";
import type { CommentWithChildren } from "@/lib/api/comments";

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

  const isOwner = session?.user?.id === comment.author.id;
  const canDelete =
    isOwner ||
    session?.user?.role === "admin" ||
    session?.user?.role === "mod";

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    setIsDeleting(true);
    try {
      await deleteComment(comment.id);
      showToast("Comment deleted", "success");
      onCommentUpdate();
    } catch (error) {
      showToast("Failed to delete comment", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplySuccess = () => {
    setIsReplying(false);
    onCommentUpdate();
  };

  if (comment.status === "removed") {
    return (
      <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3">
        <p className="text-muted italic text-sm">[removed]</p>
        {comment.children.length > 0 && (
          <div className="ml-6 mt-3 border-l-2 border-[color:var(--foreground)] pl-4">
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
    <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
      <div className="bg-bg border-2 border-[color:var(--border)] p-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Avatar src={comment.author.image} alt={comment.author.name} size="sm" />
          <span className="font-bold text-xs text-slop-blue">{comment.author.name}</span>
          {comment.author.devVerified && <Badge variant="dev">Dev</Badge>}
          <span className="text-muted text-[10px]">{formatRelativeTime(comment.createdAt)}</span>
        </div>

        {/* Body */}
        <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">{comment.body}</p>

        {/* Actions */}
        <div className="flex gap-2">
          {session?.user && comment.depth < 10 && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setIsReplying(!isReplying)}
            >
              Reply
            </Button>
          )}
          {canDelete && (
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>

        {/* Reply form */}
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

        {/* Nested replies */}
        {comment.children.length > 0 && (
          <div className="ml-6 mt-3 border-l-2 border-[color:var(--foreground)] pl-4 space-y-3">
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
  );
}
