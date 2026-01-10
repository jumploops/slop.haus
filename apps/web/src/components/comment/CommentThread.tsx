"use client";

import useSWR from "swr";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import { fetchComments, buildCommentTree } from "@/lib/api/comments";
import { Skeleton } from "@/components/ui/Skeleton";

interface CommentThreadProps {
  projectSlug: string;
}

export function CommentThread({ projectSlug }: CommentThreadProps) {
  const { data: comments, error, isLoading, mutate } = useSWR(
    `/projects/${projectSlug}/comments`,
    () => fetchComments(projectSlug),
    {
      revalidateOnFocus: false,
    }
  );

  const commentTree = comments ? buildCommentTree(comments) : [];

  return (
    <div className="comment-section">
      <h3>Comments ({comments?.length ?? 0})</h3>

      <CommentForm projectSlug={projectSlug} onSuccess={() => mutate()} />

      {isLoading && (
        <div className="comment-thread">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="comment">
              <div className="comment-header">
                <Skeleton className="skeleton-avatar" />
                <Skeleton className="skeleton-text" style={{ width: "100px" }} />
              </div>
              <Skeleton className="skeleton-text" style={{ marginTop: "0.5rem" }} />
              <Skeleton className="skeleton-text" style={{ width: "80%", marginTop: "0.25rem" }} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="empty-state">
          <p>Failed to load comments</p>
        </div>
      )}

      {!isLoading && !error && commentTree.length === 0 && (
        <div className="empty-state">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}

      {!isLoading && !error && commentTree.length > 0 && (
        <div className="comment-thread">
          {commentTree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              projectSlug={projectSlug}
              onCommentUpdate={() => mutate()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
