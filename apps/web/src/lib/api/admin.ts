import { apiGet, apiPost, apiDelete } from "../api";
import type { ProjectRevision } from "./projects";

export interface ModQueueItem {
  id: string;
  type: "project" | "comment";
  status: string;
  title?: string;
  body?: string;
  slug?: string;
  flagCount: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    image: string | null;
  };
}

interface ModQueueApiEntry {
  type: "project" | "comment";
  item: {
    id: string;
    status: string;
    title?: string;
    body?: string;
    slug?: string;
    createdAt: string;
    author: {
      id: string;
      username: string;
      image: string | null;
    };
  };
  flags: {
    count: number;
  };
}

export interface VerifiedDev {
  id: string;
  username: string;
  email: string;
  image: string | null;
  devVerified: boolean;
}

export async function fetchModQueue(type?: "project" | "comment"): Promise<ModQueueItem[]> {
  const params = type ? `?type=${type}` : "";
  const response = await apiGet<{ queue: ModQueueApiEntry[] }>(`/admin/mod-queue${params}`);

  return response.queue.map((entry) => ({
    id: entry.item.id,
    type: entry.type,
    status: entry.item.status,
    title: entry.item.title,
    body: entry.item.body,
    slug: entry.item.slug,
    flagCount: entry.flags.count,
    createdAt: entry.item.createdAt,
    author: entry.item.author,
  }));
}

export async function approveProject(id: string): Promise<void> {
  await apiPost(`/admin/projects/${id}/approve`);
}

export async function hideProject(id: string): Promise<void> {
  await apiPost(`/admin/projects/${id}/hide`);
}

export async function removeProject(id: string): Promise<void> {
  await apiPost(`/admin/projects/${id}/remove`);
}

export async function approveComment(id: string): Promise<void> {
  await apiPost(`/admin/comments/${id}/approve`);
}

export async function removeComment(id: string): Promise<void> {
  await apiPost(`/admin/comments/${id}/remove`);
}

export async function verifyDev(userId: string): Promise<void> {
  await apiPost(`/admin/verify-dev/${userId}`);
}

export async function unverifyDev(userId: string): Promise<void> {
  await apiDelete(`/admin/verify-dev/${userId}`);
}

export async function fetchVerifiedDevs(): Promise<VerifiedDev[]> {
  const response = await apiGet<{ developers: VerifiedDev[] }>("/admin/verified-devs");
  return response.developers;
}

export async function fetchPendingRevisions(): Promise<ProjectRevision[]> {
  const response = await apiGet<{ revisions: ProjectRevision[] }>("/admin/revisions?status=pending");
  return response.revisions;
}

export async function approveRevision(id: string): Promise<void> {
  await apiPost(`/admin/revisions/${id}/approve`);
}

export async function rejectRevision(id: string): Promise<void> {
  await apiPost(`/admin/revisions/${id}/reject`);
}
