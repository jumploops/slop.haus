import { apiGet, apiPost, apiPatch, apiDelete, apiPostFormData } from "../api";
import type { FeedQuery, CreateProjectInput, UpdateProjectInput } from "@slop/shared";

export interface ProjectMedia {
  id: string;
  projectId: string;
  type: string;
  url: string;
  isPrimary: boolean;
}

export interface ProjectAuthor {
  id: string;
  name: string;
  image: string | null;
  devVerified: boolean;
}

export interface ProjectTool {
  id: string;
  name: string;
  slug: string;
}

export interface ProjectListItem {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  mainUrl: string | null;
  repoUrl: string | null;
  vibePercent: number;
  normalUp: number;
  normalDown: number;
  normalScore: number;
  devUp: number;
  devDown: number;
  devScore: number;
  commentCount: number;
  createdAt: string;
  author: ProjectAuthor;
  primaryMedia: ProjectMedia | null;
}

export interface MyProjectListItem extends ProjectListItem {
  status: "published" | "hidden" | "removed";
  updatedAt: string;
  lastEditedAt: string | null;
}

export interface ProjectDetail {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string | null;
  mainUrl: string | null;
  repoUrl: string | null;
  vibeMode: "overview" | "detailed";
  vibePercent: number;
  vibeDetailsJson: Record<string, number> | null;
  normalUp: number;
  normalDown: number;
  normalScore: number;
  devUp: number;
  devDown: number;
  devScore: number;
  commentCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastEditedAt: string | null;
  authorUserId: string;
  author: ProjectAuthor;
  media: ProjectMedia[];
  tools: ProjectTool[];
}

export interface FeedResponse {
  projects: ProjectListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProjectResponse {
  project: ProjectDetail;
}

export interface ProjectRevision {
  id: string;
  projectId: string;
  title: string | null;
  tagline: string | null;
  description: string | null;
  mainUrl: string | null;
  repoUrl: string | null;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
  reason?: string | null;
}

export async function fetchFeed(query: Partial<FeedQuery> = {}): Promise<FeedResponse> {
  const params = new URLSearchParams();
  if (query.sort) params.set("sort", query.sort);
  if (query.channel) params.set("channel", query.channel);
  if (query.window) params.set("window", query.window);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const qs = params.toString();
  return apiGet<FeedResponse>(`/projects${qs ? `?${qs}` : ""}`);
}

export async function fetchProject(slug: string): Promise<ProjectDetail> {
  const response = await apiGet<ProjectResponse>(`/projects/${slug}`);
  return response.project;
}

export async function createProject(data: CreateProjectInput): Promise<ProjectDetail> {
  const response = await apiPost<{ project: ProjectDetail }>("/projects", data);
  return response.project;
}

export async function updateProject(
  slug: string,
  data: UpdateProjectInput
): Promise<{ project: ProjectDetail; revision?: ProjectRevision }> {
  return apiPatch(`/projects/${slug}`, data);
}

export async function deleteProject(slug: string): Promise<void> {
  await apiDelete(`/projects/${slug}`);
}

export async function refreshProject(slug: string): Promise<void> {
  await apiPost(`/projects/${slug}/refresh`);
}

export async function fetchProjectRevisions(slug: string): Promise<ProjectRevision[]> {
  const response = await apiGet<{ revisions: ProjectRevision[] }>(`/projects/${slug}/revisions`);
  return response.revisions;
}

export async function uploadScreenshot(slug: string, file: File): Promise<string> {
  // Client-side validation
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error("File too large. Maximum size is 5MB.");
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Allowed: PNG, JPEG, WebP.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await apiPostFormData<{ url: string }>(`/projects/${slug}/screenshot`, formData);
  return response.url;
}

export async function fetchMyProjects(): Promise<MyProjectListItem[]> {
  const response = await apiGet<{ projects: MyProjectListItem[] }>("/users/me/projects");
  return response.projects;
}
