"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { checkFavorite, addFavorite, removeFavorite } from "@/lib/api/favorites";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/lib/auth-client";

interface UseFavoriteOptions {
  onSuccess?: () => void;
}

export function useFavorite(projectSlug: string, options?: UseFavoriteOptions) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const isRegisteredUser = Boolean(session?.user && !session.user.isAnonymous);

  const { data: isFavorited, mutate, isLoading } = useSWR(
    isRegisteredUser ? `/projects/${projectSlug}/favorite` : null,
    () => checkFavorite(projectSlug),
    {
      revalidateOnFocus: false,
    }
  );

  const toggleFavorite = useCallback(async () => {
    if (!isRegisteredUser) {
      showToast("Sign in to add favorites", "info");
      return;
    }

    // Optimistic update
    mutate(!isFavorited, false);

    try {
      if (isFavorited) {
        await removeFavorite(projectSlug);
        showToast("Removed from favorites", "success");
      } else {
        await addFavorite(projectSlug);
        showToast("Added to favorites", "success");
      }
      mutate();
      options?.onSuccess?.();
    } catch (error) {
      // Rollback
      mutate(isFavorited, false);
      showToast("Failed to update favorites", "error");
    }
  }, [projectSlug, isFavorited, mutate, isRegisteredUser, showToast, options]);

  return {
    isFavorited: isFavorited ?? false,
    toggleFavorite,
    isLoading,
  };
}
