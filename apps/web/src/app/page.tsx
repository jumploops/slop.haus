"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWRInfinite from "swr/infinite";
import type { SWRInfiniteKeyLoader } from "swr/infinite";
import { Tabs } from "@/components/ui/Tabs";
import { ProjectCard } from "@/components/project/ProjectCard";
import { ProjectCardSkeleton } from "@/components/ui/Skeleton";
import { Button, buttonVariants } from "@/components/ui/Button";
import { fetchFeed, FeedResponse } from "@/lib/api/projects";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { useSlopMode } from "@/lib/slop-mode";
import { SlopGoo } from "@/components/slop/SlopGoo";
import { LayoutGrid, List, ListOrdered, Loader2 } from "lucide-react";

type SortOption = "hot" | "new" | "top";
type WindowOption = "24h" | "7d" | "30d" | "all";
type DisplayMode = "list-sm" | "list-lg" | "grid";
type FeedKey = readonly ["feed", SortOption, WindowOption, number];

const sortTabs = [
  { id: "hot", label: "Hot" },
  { id: "new", label: "New" },
  { id: "top", label: "Top" },
];

const windowOptions: { value: WindowOption; label: string }[] = [
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

export default function FeedPage() {
  const { data: session } = useSession();
  const { enabled: slopEnabled } = useSlopMode();
  const [sort, setSort] = useState<SortOption>("hot");
  const [timeWindow, setTimeWindow] = useState<WindowOption>("all");
  const [showIntro, setShowIntro] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("list-lg");
  const introRef = useRef<HTMLDivElement | null>(null);
  const slopIntroClass = slopEnabled ? "" : "shadow-[2px_2px_0_var(--border)]";
  const slopDismissClass = slopEnabled
    ? "shadow-[1px_1px_0_var(--border)] -rotate-6"
    : "";
  const slopControlRowClass = slopEnabled ? "rotate-[-0.3deg] translate-y-[1px]" : "";
  const slopSelectClass = slopEnabled
    ? "shadow-[1px_1px_0_var(--border)] rotate-[0.4deg]"
    : "";
  const slopToggleSm = slopEnabled
    ? "shadow-[1px_1px_0_var(--border)] rotate-[-0.4deg] translate-y-[1px]"
    : "";
  const slopToggleLg = slopEnabled
    ? "shadow-[1px_1px_0_var(--border)] rotate-[0.6deg] -translate-y-[1px]"
    : "";
  const slopToggleGrid = slopEnabled
    ? "shadow-[1px_1px_0_var(--border)] rotate-[-0.2deg]"
    : "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem("slop:feedIntroDismissed");
    setShowIntro(dismissed !== "true");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("slop:feedDisplayMode");
    if (stored === "list-sm" || stored === "list-lg" || stored === "grid") {
      if (stored === "list-lg" && !window.matchMedia("(min-width: 640px)").matches) {
        setDisplayMode("list-sm");
      } else {
        setDisplayMode(stored);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("slop:feedDisplayMode", displayMode);
  }, [displayMode]);

  const getFeedKey: SWRInfiniteKeyLoader<FeedResponse, FeedKey | null> = (
    pageIndex,
    previousPageData
  ) => {
    if (previousPageData && pageIndex >= previousPageData.pagination.totalPages) {
      return null;
    }
    return ["feed", sort, timeWindow, pageIndex + 1];
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite<FeedResponse>(
    getFeedKey,
    ([, nextSort, nextWindow, page]: FeedKey) =>
      fetchFeed({ sort: nextSort, window: nextWindow, page, limit: 20 }),
    {
      revalidateOnFocus: false,
    }
  );

  const pages = data ?? [];
  const projects = pages.flatMap((page) => page.projects);
  const pagination = pages[0]?.pagination;
  const totalPages = pagination?.totalPages ?? 0;
  const totalCount = pagination?.total ?? 0;
  const isLoadingMore = isValidating && size > 0;

  const handleSortChange = (newSort: string) => {
    setSort(newSort as SortOption);
  };

  const handleWindowChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeWindow(e.target.value as WindowOption);
  };

  const handleDisplayModeChange = (mode: DisplayMode) => {
    if (mode === "list-lg" && typeof window !== "undefined") {
      const isDesktop = window.matchMedia("(min-width: 640px)").matches;
      if (!isDesktop) {
        setDisplayMode("list-sm");
        return;
      }
    }
    setDisplayMode(mode);
  };

  useEffect(() => {
    setSize(1);
  }, [sort, timeWindow, setSize]);

  const loadMore = () => {
    if (pagination && size < totalPages) {
      setSize((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-8">
      {showIntro && (
        <div className="flex flex-col items-center text-center pt-6">
          <div
            ref={introRef}
            className={cn(
              "relative -rotate-2 border-4 border-primary bg-primary/10 px-6 py-3 border-dashed",
              slopEnabled ? "mb-8" : "mb-4",
              slopIntroClass
            )}
            style={slopEnabled ? { borderBottomStyle: "solid" } : undefined}
          >
            <h1 className="font-mono text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              <span className="relative inline-block">
                <span className="relative">Confess your slop</span>
              </span>
            </h1>
            <button
              type="button"
              onClick={() => {
                window.localStorage.setItem("slop:feedIntroDismissed", "true");
                setShowIntro(false);
              }}
              aria-label="Dismiss intro"
              className={cn(
                "absolute -top-7 -right-6 inline-flex h-8 w-8 items-center justify-center border-2 border-border bg-muted font-mono text-sm leading-none text-muted-foreground transition-colors hover:border-primary hover:bg-card hover:text-foreground cursor-pointer -rotate-4",
                slopDismissClass
              )}
            >
              ×
            </button>
          </div>
          {slopEnabled && (
            <SlopGoo
              targetRef={introRef}
              seed={42}
              rotationDeg={-2}
              attach={{ start: 0, end: 1 }}
              thickness={12}
              maxDrop={64}
              beadSpacing={18}
              dripCount={7}
              poolBias={0.8}
              viscositySeconds={35}
              edgeInset={0}
              edgeInsetLowEnd={8}
              edgeOffset={2}
              edgeFeather={1}
              borderOffset={-8}
              zIndex={-1}
            />
          )}
          <p className="max-w-md text-muted-foreground">
            This is the one place slop is encouraged — share your funny/useful/useless machinations even if they barely function.
          </p>
          <div className="mt-4 flex w-full max-w-md items-center justify-center">
            <Link
              href="/submit"
              className={cn(
                buttonVariants({ variant: "primary", size: "md" }),
                "justify-self-center text-white hover:text-white dark:text-zinc-900 dark:hover:text-zinc-900"
              )}
            >
              Submit slop
            </Link>
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
          slopControlRowClass
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Tabs
            tabs={sortTabs}
            activeTab={sort}
            onTabChange={handleSortChange}
            className="mb-0 w-full sm:w-auto"
            sloppy={slopEnabled}
          />

          {sort === "top" && (
            <select
              value={timeWindow}
              onChange={handleWindowChange}
              className={cn(
                "w-full sm:w-auto",
                "min-h-10 sm:min-h-0 px-3 py-2 sm:py-1 text-xs font-bold font-mono uppercase tracking-wide",
                "bg-background text-foreground",
                "border-2 border-dashed border-border",
                slopSelectClass,
                "focus:outline-none focus:border-primary"
              )}
            >
              {windowOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => handleDisplayModeChange("list-sm")}
            aria-label="List view (small screenshots)"
            title="List (small)"
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center border-2 border-dashed transition-colors",
              slopToggleSm,
              displayMode === "list-sm"
                ? "bg-primary/10 text-primary border-primary"
                : "bg-card text-muted-foreground border-border hover:text-primary"
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDisplayModeChange("list-lg")}
            aria-label="List view (large screenshots)"
            title="List (large)"
            className={cn(
              "hidden sm:inline-flex h-10 w-10 items-center justify-center border-2 border-dashed transition-colors",
              slopToggleLg,
              displayMode === "list-lg"
                ? "bg-primary/10 text-primary border-primary"
                : "bg-card text-muted-foreground border-border hover:text-primary"
            )}
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDisplayModeChange("grid")}
            aria-label="Grid view"
            title="Grid"
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center border-2 border-dashed transition-colors",
              slopToggleGrid,
              displayMode === "grid"
                ? "bg-primary/10 text-primary border-primary"
                : "bg-card text-muted-foreground border-border hover:text-primary"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="border-2 border-border bg-card p-6 text-center">
          <h3 className="text-lg font-bold text-destructive mb-2">Failed to load feed</h3>
          <p className="text-sm text-muted-foreground">Please try again later.</p>
          <Button onClick={() => mutate()} className="mt-4">
            Retry
          </Button>
        </div>
      )}

      {isLoading && pages.length === 0 && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {pagination && projects.length === 0 && (
        <div className="border-2 border-dashed border-border p-6 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">No projects yet</h3>
          <p className="text-sm text-muted-foreground">Be the first to submit a project!</p>
          <Button onClick={() => (window.location.href = "/submit")} className="mt-4">
            Submit a Project
          </Button>
        </div>
      )}

      {pagination && projects.length > 0 && (
        <>
          <div
            className={cn(
              displayMode === "grid"
                ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : displayMode === "list-lg"
                ? "space-y-4"
                : "space-y-3",
              slopEnabled &&
                (displayMode === "grid"
                  ? "gap-6"
                  : displayMode === "list-lg"
                  ? "space-y-6"
                  : "space-y-5")
            )}
          >
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                rank={index + 1}
                variant={displayMode}
                sloppy={slopEnabled}
              />
            ))}
          </div>

          {pagination && size < totalPages && (
            <div className="flex justify-center mt-4">
              <Button variant="secondary" onClick={loadMore} disabled={isLoadingMore}>
                {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoadingMore ? "Loading" : "Load More"}
              </Button>
            </div>
          )}

          <div className="text-center text-muted-foreground text-xs mt-4">
            Showing {projects.length} of {totalCount} projects
          </div>
        </>
      )}
      {session?.user?.role === "admin" && (
        <button
          type="button"
          onClick={() => {
            window.localStorage.removeItem("slop:feedIntroDismissed");
            setShowIntro(true);
          }}
          className="fixed bottom-4 right-4 z-50 border-2 border-dashed border-border bg-card px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          Reset intro
        </button>
      )}
    </div>
  );
}
