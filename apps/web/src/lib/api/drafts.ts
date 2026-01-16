import { apiPost, apiGet, apiPatch, apiDelete } from "../api";
import type {
  AnalyzeUrlResponse,
  UpdateDraftRequest,
  SubmitDraftRequest,
  DraftListResponse,
} from "@slop/shared";

export interface DraftDetailResponse {
  draft: {
    draftId: string;
    status: string;
    inputUrl: string;
    detectedUrlType: string;
    createdAt: string;
    updatedAt: string;
    error?: string;
    screenshot?: string;
    suggested?: {
      title: string | null;
      tagline: string | null;
      description: string | null;
      tools: string[];
      vibePercent: number | null;
      mainUrl: string | null;
      repoUrl: string | null;
    };
    final?: {
      title: string | null;
      tagline: string | null;
      description: string | null;
      tools: string[] | null;
      vibePercent: number | null;
      mainUrl: string | null;
      repoUrl: string | null;
    };
  };
}

export async function analyzeUrl(url: string): Promise<AnalyzeUrlResponse> {
  return apiPost<AnalyzeUrlResponse>("/drafts/analyze", { url });
}

export async function getDraft(draftId: string): Promise<DraftDetailResponse> {
  return apiGet<DraftDetailResponse>(`/drafts/${draftId}`);
}

export async function getDrafts(): Promise<DraftListResponse> {
  return apiGet<DraftListResponse>("/drafts");
}

export async function updateDraft(
  draftId: string,
  data: UpdateDraftRequest
): Promise<{ success: boolean }> {
  return apiPatch<{ success: boolean }>(`/drafts/${draftId}`, data);
}

export async function submitDraft(
  draftId: string,
  data: SubmitDraftRequest
): Promise<{ project: { slug: string } }> {
  return apiPost<{ project: { slug: string } }>(`/drafts/${draftId}/submit`, data);
}

export async function deleteDraft(draftId: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/drafts/${draftId}`);
}

export async function retryDraft(draftId: string): Promise<{ success: boolean; draftId: string }> {
  return apiPost<{ success: boolean; draftId: string }>(`/drafts/${draftId}/retry`, {});
}
