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
    <section className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Comments ({comments?.length ?? 0})</h3>

      <CommentForm projectSlug={projectSlug} onSuccess={() => mutate()} />

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton variant="avatar" />
                <Skeleton variant="text" className="w-24" />
              </div>
              <Skeleton variant="text" className="mt-2" />
              <Skeleton variant="text" className="w-4/5 mt-1" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="py-8 text-center">
          <p className="text-muted">Failed to load comments</p>
        </div>
      )}

      {!isLoading && !error && commentTree.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-muted">No comments yet. Be the first to comment!</p>
        </div>
      )}

      {!isLoading && !error && commentTree.length > 0 && (
        <div className="divide-y divide-border">
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
    </section>
  );
}
