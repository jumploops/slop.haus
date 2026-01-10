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
      <div className="comment">
        <p className="comment-removed">[removed]</p>
        {comment.children.length > 0 && (
          <div className="comment-replies">
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
    <div className="comment">
      <div className="comment-header">
        <Avatar src={comment.author.image} alt={comment.author.name} size="sm" />
        <span className="comment-author">{comment.author.name}</span>
        {comment.author.devVerified && <Badge variant="dev">Dev</Badge>}
        <span className="comment-time">{formatRelativeTime(comment.createdAt)}</span>
      </div>

      <div className="comment-body">{comment.body}</div>

      <div className="comment-actions">
        {session?.user && comment.depth < 10 && (
          <button
            type="button"
            className="comment-action"
            onClick={() => setIsReplying(!isReplying)}
          >
            Reply
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            className="comment-action"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>

      {isReplying && (
        <div className="comment-reply-form">
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
        <div className="comment-replies">
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
