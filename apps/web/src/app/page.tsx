import { cookies } from "next/headers";
import { FeedPageClient } from "@/components/feed/FeedPageClient";
import type { FeedResponse } from "@/lib/api/projects";
import { parseFeedRoute, type FeedRouteSearchParams } from "@/lib/feed-query";
import {
  FEED_INTRO_DISMISSED_COOKIE_NAME,
  isFeedIntroDismissedCookieValue,
} from "@/lib/feed-intro";
import { fetchFeedPageServer } from "@/lib/server/feed";

interface FeedPageProps {
  searchParams: Promise<FeedRouteSearchParams>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const { sort, window } = parseFeedRoute(await searchParams);
  const cookieStore = await cookies();
  const initialShowIntro = !isFeedIntroDismissedCookieValue(
    cookieStore.get(FEED_INTRO_DISMISSED_COOKIE_NAME)?.value
  );

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
      initialShowIntro={initialShowIntro}
    />
  );
}
