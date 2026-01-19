"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
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
      <div className="py-3">
        <p className="text-muted italic">[removed]</p>
        {comment.children.length > 0 && (
          <div className="ml-6 mt-3 border-l-2 border-border pl-4">
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
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Avatar src={comment.author.image} alt={comment.author.name} size="sm" />
        <span className="font-medium text-sm">{comment.author.name}</span>
        {comment.author.devVerified && <Badge variant="dev">Dev</Badge>}
        <span className="text-muted text-xs">{formatRelativeTime(comment.createdAt)}</span>
      </div>

      {/* Body */}
      <p className="text-sm leading-relaxed mb-2 whitespace-pre-wrap">{comment.body}</p>

      {/* Actions */}
      <div className="flex gap-4">
        {session?.user && comment.depth < 10 && (
          <button
            type="button"
            onClick={() => setIsReplying(!isReplying)}
            className="text-xs text-muted hover:text-fg bg-transparent border-none cursor-pointer transition-colors"
          >
            Reply
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs text-muted hover:text-danger bg-transparent border-none cursor-pointer transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
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
        <div className="ml-6 mt-3 border-l-2 border-border pl-4">
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
