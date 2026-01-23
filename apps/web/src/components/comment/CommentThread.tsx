"use client";

import useSWR from "swr";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import { fetchComments, buildCommentTree } from "@/lib/api/comments";
import { Skeleton } from "@/components/ui/Skeleton";
import { MessageSquare } from "lucide-react";

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
  const sortedCommentTree = [...commentTree].sort((a, b) => {
    if (b.upvoteCount !== a.upvoteCount) {
      return b.upvoteCount - a.upvoteCount;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const reviewCount = comments
    ? comments.filter(
        (comment) =>
          !comment.parentCommentId && comment.status !== "removed"
      ).length
    : 0;

  return (
    <section className="mt-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-mono text-lg font-bold text-foreground">Reviews</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
            {reviewCount}
          </span>
        </div>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="mb-6">
        <CommentForm projectSlug={projectSlug} onSuccess={() => mutate()} />
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border-2 border-border bg-card p-4">
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
        <div className="border-2 border-border bg-card p-6 text-center">
          <p className="text-sm text-destructive font-bold">Failed to load comments</p>
        </div>
      )}

      {!isLoading && !error && commentTree.length === 0 && (
        <div className="border-2 border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
        </div>
      )}

      {!isLoading && !error && sortedCommentTree.length > 0 && (
        <div className="space-y-3">
          {sortedCommentTree.map((comment) => (
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
