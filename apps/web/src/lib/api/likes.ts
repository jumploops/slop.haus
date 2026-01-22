import { apiGet, apiPost } from "../api";
import type { LikeInput } from "@slop/shared";

export interface LikeState {
  liked: boolean;
}

export interface LikeResult {
  success: boolean;
  likeCount: number;
}

export async function like(slug: string, data: LikeInput): Promise<LikeResult> {
  return apiPost<LikeResult>(`/projects/${slug}/like`, data);
}

export async function getLikeState(slug: string): Promise<LikeState> {
  return apiGet<LikeState>(`/projects/${slug}/like-state`);
}
