import type { FeedQuery } from "@slop/shared";

export const FEED_SORTS = ["hot", "new", "top"] as const;
export const FEED_WINDOWS = ["24h", "7d", "30d", "all"] as const;

export type FeedSort = (typeof FEED_SORTS)[number];
export type FeedWindow = (typeof FEED_WINDOWS)[number];

export const DEFAULT_FEED_SORT: FeedSort = "hot";
export const DEFAULT_FEED_WINDOW: FeedWindow = "all";

export interface FeedRouteState {
  sort: FeedSort;
  window: FeedWindow;
}

export interface FeedRouteSearchParams {
  sort?: string | string[] | undefined;
  window?: string | string[] | undefined;
}

function getFirstSearchParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function normalizeFeedSort(value: string | string[] | undefined): FeedSort {
  const candidate = getFirstSearchParam(value);
  if (candidate && FEED_SORTS.includes(candidate as FeedSort)) {
    return candidate as FeedSort;
  }
  return DEFAULT_FEED_SORT;
}

export function normalizeFeedWindow(value: string | string[] | undefined): FeedWindow {
  const candidate = getFirstSearchParam(value);
  if (candidate && FEED_WINDOWS.includes(candidate as FeedWindow)) {
    return candidate as FeedWindow;
  }
  return DEFAULT_FEED_WINDOW;
}

export function parseFeedRoute(searchParams: FeedRouteSearchParams = {}): FeedRouteState {
  return {
    sort: normalizeFeedSort(searchParams.sort),
    window: normalizeFeedWindow(searchParams.window),
  };
}

export function buildFeedHref({ sort, window }: FeedRouteState): string {
  const params = new URLSearchParams();

  if (sort !== DEFAULT_FEED_SORT) {
    params.set("sort", sort);
  }

  if (window !== DEFAULT_FEED_WINDOW) {
    params.set("window", window);
  }

  const queryString = params.toString();
  return queryString ? `/?${queryString}` : "/";
}

export function buildFeedApiQueryString(query: Partial<FeedQuery> = {}): string {
  const params = new URLSearchParams();

  if (query.sort) {
    params.set("sort", query.sort);
  }

  if (query.window) {
    params.set("window", query.window);
  }

  if (query.page) {
    params.set("page", String(query.page));
  }

  if (query.limit) {
    params.set("limit", String(query.limit));
  }

  return params.toString();
}
