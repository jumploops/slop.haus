"use client";

import { useState, useEffect, useCallback } from "react";
import type { DraftStatus } from "@slop/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type StepStatus = "pending" | "in_progress" | "completed";

interface ProgressState {
  status: DraftStatus;
  message: string;
  error: string | null;
  errorCode: string | null;
  isComplete: boolean;
  steps: {
    scraping: StepStatus;
    analyzing: StepStatus;
  };
}

interface UseDraftProgressReturn extends ProgressState {
  reset: () => void;
}

const initialState: ProgressState = {
  status: "pending",
  message: "Starting analysis...",
  error: null,
  errorCode: null,
  isComplete: false,
  steps: {
    scraping: "pending",
    analyzing: "pending",
  },
};

export function useDraftProgress(
  draftId: string | null
): UseDraftProgressReturn {
  const [state, setState] = useState<ProgressState>(initialState);

  useEffect(() => {
    if (!draftId) return;

    const eventSource = new EventSource(
      `${API_BASE}/api/v1/drafts/${draftId}/events`,
      { withCredentials: true }
    );

    eventSource.addEventListener("status", (e) => {
      const data = JSON.parse(e.data);
      setState((prev) => ({
        ...prev,
        status: data.status,
        message: data.message,
        steps: {
          scraping:
            data.status === "scraping"
              ? "in_progress"
              : data.status === "analyzing" || data.status === "ready"
                ? "completed"
                : "pending",
          analyzing:
            data.status === "analyzing"
              ? "in_progress"
              : data.status === "ready"
                ? "completed"
                : "pending",
        },
      }));
    });

    eventSource.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data);
      setState((prev) => ({
        ...prev,
        steps: {
          ...prev.steps,
          [data.step]: data.status as StepStatus,
        },
      }));
    });

    eventSource.addEventListener("complete", () => {
      setState((prev) => ({
        ...prev,
        status: "ready",
        message: "Analysis complete!",
        isComplete: true,
        steps: {
          scraping: "completed",
          analyzing: "completed",
        },
      }));
      eventSource.close();
    });

    eventSource.addEventListener("error", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        setState((prev) => ({
          ...prev,
          error: data.error,
          errorCode: data.code || null,
          status: "failed",
        }));
      } catch {
        // Connection error without data - could be network issue
        setState((prev) => ({
          ...prev,
          error: "Connection lost",
          errorCode: null,
        }));
      }
      eventSource.close();
    });

    // Handle connection errors (different from server-sent error events)
    eventSource.onerror = () => {
      // EventSource will auto-reconnect on some errors
      // Only update state if we're not already in an error state
      console.warn("SSE connection error, may reconnect automatically");
    };

    return () => {
      eventSource.close();
    };
  }, [draftId]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return { ...state, reset };
}
