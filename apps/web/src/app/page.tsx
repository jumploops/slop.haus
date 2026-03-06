import { FeedPageClient } from "@/components/feed/FeedPageClient";
import type { FeedResponse } from "@/lib/api/projects";
import { parseFeedRoute, type FeedRouteSearchParams } from "@/lib/feed-query";
import { fetchFeedPageServer } from "@/lib/server/feed";

interface FeedPageProps {
  searchParams: Promise<FeedRouteSearchParams>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const { sort, window } = parseFeedRoute(await searchParams);

  let initialFeed: FeedResponse | null = null;

  try {
    initialFeed = await fetchFeedPageServer({
      sort,
      window,
      page: 1,
      limit: 20,
    });
  } catch (error) {
    console.error("Failed to bootstrap feed on the server", error);
  }

  return (
    <FeedPageClient
      key={`${sort}:${window}`}
      initialFeed={initialFeed}
      initialSort={sort}
      initialWindow={window}
    />
  );
}
