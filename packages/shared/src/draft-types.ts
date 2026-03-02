import type { UrlType } from "./url-detection";

export const DRAFT_STATUSES = [
  "pending",
  "scraping",
  "analyzing",
  "ready",
  "submitted",
  "failed",
  "expired",
] as const;

export type DraftStatus = (typeof DRAFT_STATUSES)[number];

export interface DraftSuggested {
  title: string | null;
  tagline: string | null;
  description: string | null;
  tools: string[];
  vibePercent: number | null;
  mainUrl: string | null;
  repoUrl: string | null;
}

export interface DraftFinal {
  title: string | null;
  tagline: string | null;
  description: string | null;
  tools: string[] | null;
  vibePercent: number | null;
  mainUrl: string | null;
  repoUrl: string | null;
}

export interface EnrichmentDraft {
  id: string;
  userId: string;
  inputUrl: string;
  detectedUrlType: UrlType;
  screenshotUrl: string | null;
  suggested: DraftSuggested;
  final: DraftFinal;
  status: DraftStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface DraftListItem {
  id: string;
  inputUrl: string;
  detectedUrlType: UrlType;
  status: DraftStatus;
  suggestedTitle: string | null;
  screenshotUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response types
export interface AnalyzeUrlRequest {
  url: string;
}

export interface AnalyzeUrlResponse {
  draftId: string;
  status: DraftStatus;
  detectedUrlType: UrlType;
}

export interface DraftResponse {
  draft: EnrichmentDraft;
}

export interface DraftListResponse {
  drafts: DraftListItem[];
}

export interface UpdateDraftRequest {
  title?: string;
  tagline?: string;
  description?: string;
  tools?: string[];
  vibePercent?: number;
  mainUrl?: string | null;
  repoUrl?: string | null;
}

export interface SubmitDraftRequest {
  vibeMode: "overview" | "detailed";
  vibePercent?: number;
  vibeDetails?: Record<string, number>;
}

// SSE Event types
export type DraftEventType = "status" | "progress" | "complete" | "error" | "heartbeat";

export interface DraftStatusEvent {
  status: DraftStatus;
  message: string;
}

export interface DraftProgressEvent {
  step: string;
  status: "pending" | "in_progress" | "completed";
}

export interface DraftCompleteEvent {
  draftId: string;
}

export interface DraftErrorEvent {
  error: string;
  code: string;
}
