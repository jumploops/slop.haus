export type UserRole = "user" | "mod" | "admin";
export type ProjectStatus = "published" | "hidden" | "removed";
export type VibeMode = "overview" | "detailed";
export type EnrichmentStatus = "pending" | "completed" | "failed";
export type RaterType = "public" | "dev";
export type CommentStatus = "visible" | "hidden" | "removed";

export interface User {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: UserRole;
  devVerified: boolean;
  createdAt: Date;
}

export interface Project {
  id: string;
  slug: string;
  authorUserId: string;
  title: string;
  tagline: string;
  description: string | null;
  mainUrl: string | null;
  repoUrl: string | null;
  vibeMode: VibeMode;
  vibePercent: number;
  vibeDetailsJson: Record<string, number> | null;
  likeCount: number;
  reviewCount: number;
  reviewScoreTotal: number;
  slopScore: number;
  commentCount: number;
  status: ProjectStatus;
  enrichmentStatus: EnrichmentStatus;
  createdAt: Date;
  updatedAt: Date;
  lastEditedAt: Date | null;
}

export interface Comment {
  id: string;
  projectId: string;
  authorUserId: string;
  parentCommentId: string | null;
  depth: number;
  body: string;
  reviewScore: number | null;
  upvoteCount: number;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithAuthor extends Project {
  author: Pick<User, "id" | "name" | "image" | "devVerified">;
}

export interface CommentWithAuthor extends Comment {
  author: Pick<User, "id" | "name" | "image" | "devVerified">;
}
