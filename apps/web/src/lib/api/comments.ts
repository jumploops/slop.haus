import { apiGet, apiPost, apiPatch, apiDelete } from "../api";
import type { CreateCommentInput, UpdateCommentInput } from "@slop/shared";

export interface CommentAuthor {
  id: string;
  name: string;
  image: string | null;
  devVerified: boolean;
}

export interface Comment {
  id: string;
  body: string;
  parentCommentId: string | null;
  depth: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}

export interface CommentWithChildren extends Comment {
  children: CommentWithChildren[];
}

export async function fetchComments(slug: string): Promise<Comment[]> {
  const response = await apiGet<{ comments: Comment[] }>(`/projects/${slug}/comments`);
  return response.comments;
}

export async function createComment(
  slug: string,
  data: CreateCommentInput
): Promise<Comment> {
  const response = await apiPost<{ comment: Comment }>(`/projects/${slug}/comments`, data);
  return response.comment;
}

export async function updateComment(
  id: string,
  data: UpdateCommentInput
): Promise<Comment> {
  const response = await apiPatch<{ comment: Comment }>(`/comments/${id}`, data);
  return response.comment;
}

export async function deleteComment(id: string): Promise<void> {
  await apiDelete(`/comments/${id}`);
}

// Build a tree structure from flat comments
export function buildCommentTree(comments: Comment[]): CommentWithChildren[] {
  const map = new Map<string, CommentWithChildren>();
  const roots: CommentWithChildren[] = [];

  // Create nodes with empty children arrays
  for (const comment of comments) {
    map.set(comment.id, { ...comment, children: [] });
  }

  // Build tree
  for (const comment of comments) {
    const node = map.get(comment.id)!;
    if (comment.parentCommentId) {
      const parent = map.get(comment.parentCommentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}
