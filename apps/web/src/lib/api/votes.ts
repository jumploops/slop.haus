import { apiGet, apiPost } from "../api";
import type { VoteInput } from "@slop/shared";

export interface VoteState {
  normal: number | null;
  dev: number | null;
  hasDevCredential: boolean;
}

export interface VoteResult {
  success: boolean;
  scores: {
    normalUp: number;
    normalDown: number;
    normalScore: number;
    devUp: number;
    devDown: number;
    devScore: number;
  };
}

export async function vote(slug: string, data: VoteInput): Promise<VoteResult> {
  return apiPost<VoteResult>(`/projects/${slug}/vote`, data);
}

export async function getVoteState(slug: string): Promise<VoteState> {
  return apiGet<VoteState>(`/projects/${slug}/vote-state`);
}
