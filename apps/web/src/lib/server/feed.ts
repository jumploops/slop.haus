import "server-only";

import type { FeedQuery } from "@slop/shared";
import type { FeedResponse } from "@/lib/api/projects";
import { buildFeedApiQueryString } from "@/lib/feed-query";

function getServerApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
}

export async function fetchFeedPageServer(query: Partial<FeedQuery> = {}): Promise<FeedResponse> {
  const apiBaseUrl = getServerApiBaseUrl();
  const queryString = buildFeedApiQueryString(query);
  const response = await fetch(`${apiBaseUrl}/api/v1/projects${queryString ? `?${queryString}` : ""}`,
    {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Feed bootstrap request failed with status ${response.status}`);
  }

  return response.json();
}
