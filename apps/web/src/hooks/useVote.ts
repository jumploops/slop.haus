"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { getVoteState, vote, VoteState, VoteResult } from "@/lib/api/votes";
import { ApiResponseError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface UseVoteOptions {
  onVoteSuccess?: (result: VoteResult) => void;
}

export function useVote(projectSlug: string, options: UseVoteOptions = {}) {
  const { showToast } = useToast();
  const [isVoting, setIsVoting] = useState(false);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);

  const { data: voteState, mutate } = useSWR<VoteState>(
    `/projects/${projectSlug}/vote-state`,
    () => getVoteState(projectSlug),
    {
      revalidateOnFocus: false,
    }
  );

  const submitVote = useCallback(
    async (channel: "normal" | "dev", value: 1 | -1 | 0) => {
      if (isVoting) return;

      // Check rate limit
      if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
        const remaining = Math.ceil((rateLimitedUntil - Date.now()) / 1000);
        showToast(`Please wait ${remaining} seconds`, "error");
        return;
      }

      setIsVoting(true);

      // Optimistic update
      const previousState = voteState;
      mutate(
        {
          ...voteState!,
          [channel]: value === 0 ? null : value,
        },
        false
      );

      try {
        const result = await vote(projectSlug, { channel, value });
        options.onVoteSuccess?.(result);
        // Revalidate to get actual state
        mutate();
      } catch (error) {
        // Rollback on error
        mutate(previousState, false);

        if (error instanceof ApiResponseError) {
          if (error.status === 429 && error.retryAfter) {
            setRateLimitedUntil(Date.now() + error.retryAfter * 1000);
            showToast(`Rate limited. Try again in ${error.retryAfter}s`, "error");
          } else if (error.code === "DEV_CREDENTIAL_REQUIRED") {
            showToast("Dev verification required for dev voting", "error");
          } else {
            showToast(error.message, "error");
          }
        } else {
          showToast("Failed to vote", "error");
        }
      } finally {
        setIsVoting(false);
      }
    },
    [projectSlug, voteState, mutate, isVoting, rateLimitedUntil, showToast, options]
  );

  return {
    voteState,
    submitVote,
    isVoting,
    isRateLimited: rateLimitedUntil ? Date.now() < rateLimitedUntil : false,
  };
}
