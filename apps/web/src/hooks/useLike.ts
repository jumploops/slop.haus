"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { getLikeState, like, LikeState, LikeResult } from "@/lib/api/likes";
import { ApiResponseError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface UseLikeOptions {
  onLikeSuccess?: (result: LikeResult) => void;
}

export function useLike(projectSlug: string, options: UseLikeOptions = {}) {
  const { showToast } = useToast();
  const [isLiking, setIsLiking] = useState(false);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);

  const { data: likeState, mutate } = useSWR<LikeState>(
    `/projects/${projectSlug}/like-state`,
    () => getLikeState(projectSlug),
    {
      revalidateOnFocus: false,
    }
  );

  const submitLike = useCallback(
    async (value: 1 | 0) => {
      if (isLiking) return;

      // Check rate limit
      if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
        const remaining = Math.ceil((rateLimitedUntil - Date.now()) / 1000);
        showToast(`Please wait ${remaining} seconds`, "error");
        return;
      }

      setIsLiking(true);

      // Optimistic update
      const previousState = likeState;
      mutate(
        {
          liked: value === 1,
        },
        false
      );

      try {
        const result = await like(projectSlug, { value });
        options.onLikeSuccess?.(result);
        // Revalidate to get actual state
        mutate();
      } catch (error) {
        // Rollback on error
        mutate(previousState, false);

        if (error instanceof ApiResponseError) {
          if (error.status === 429 && error.retryAfter) {
            setRateLimitedUntil(Date.now() + error.retryAfter * 1000);
            showToast(`Rate limited. Try again in ${error.retryAfter}s`, "error");
          } else {
            showToast(error.message, "error");
          }
        } else {
          showToast("Failed to like", "error");
        }
      } finally {
        setIsLiking(false);
      }
    },
    [projectSlug, likeState, mutate, isLiking, rateLimitedUntil, showToast, options]
  );

  return {
    likeState,
    submitLike,
    isLiking,
    isRateLimited: rateLimitedUntil ? Date.now() < rateLimitedUntil : false,
  };
}
