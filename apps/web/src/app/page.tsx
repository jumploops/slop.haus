"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Tabs } from "@/components/ui/Tabs";
import { ProjectCard } from "@/components/project/ProjectCard";
import { ProjectCardSkeleton } from "@/components/ui/Skeleton";
import { Button, buttonVariants } from "@/components/ui/Button";
import { fetchFeed, FeedResponse } from "@/lib/api/projects";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { useSlopDrip } from "@/lib/slop-drip";
import { useSlopMode } from "@/lib/slop-mode";
import { LayoutGrid, List, ListOrdered } from "lucide-react";

type SortOption = "hot" | "new" | "top";
type WindowOption = "24h" | "7d" | "30d" | "all";
type DisplayMode = "list-sm" | "list-lg" | "grid";

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
  const [page, setPage] = useState(1);
  const [showIntro, setShowIntro] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("list-lg");
  const introDripRef = useSlopDrip(slopEnabled, { depth: 32, dripCount: 9 });
  const slopIntroClass = slopEnabled
    ? "shadow-[2px_2px_0_var(--border)] before:absolute before:-top-3 before:left-8 before:h-4 before:w-12 before:-rotate-2 before:bg-secondary/70 before:border before:border-border before:content-[''] before:opacity-80 after:absolute after:-top-3 after:right-6 after:h-3 after:w-10 after:rotate-2 after:bg-secondary/60 after:border after:border-border after:content-[''] after:opacity-80"
    : "";
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

  const { data, error, isLoading, mutate } = useSWR<FeedResponse>(
    ["feed", sort, timeWindow, page],
    () => fetchFeed({ sort, window: timeWindow, page, limit: 20 }),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const handleSortChange = (newSort: string) => {
    setSort(newSort as SortOption);
    setPage(1);
  };

  const handleWindowChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeWindow(e.target.value as WindowOption);
    setPage(1);
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

  const loadMore = () => {
    if (data && page < data.pagination.totalPages) {
      setPage((p) => p + 1);
    }
  };

  return (
    <div className="space-y-8">
      {showIntro && (
        <div className="flex flex-col items-center text-center pt-6">
          <div
            ref={introDripRef}
            className={cn(
              "relative mb-4 -rotate-2 border-4 border-dashed border-primary bg-primary/10 px-6 py-3",
              slopIntroClass,
              slopEnabled && "slop-drip"
            )}
          >
            <h1 className="font-mono text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              <span className="relative inline-block">
                {slopEnabled && (
                  <span
                    className="absolute -left-2 -right-3 top-3 -z-10 h-3 -rotate-1 bg-primary/20 blur-[0.5px]"
                    aria-hidden="true"
                  />
                )}
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
                "absolute -top-7 -right-6 inline-flex h-8 w-8 items-center justify-center border-2 border-border bg-muted font-mono text-sm leading-none text-muted-foreground transition-colors hover:border-primary hover:bg-card hover:text-foreground rotate-4",
                slopDismissClass
              )}
            >
              ×
            </button>
          </div>
          <p className="max-w-md text-muted-foreground">
            This is the one place slop is encouraged — share your funny/useful/useless machinations even if they barely function.
          </p>
          <div className="mt-4 flex w-full max-w-md items-center justify-center">
            <Link
              href="/submit"
              className={cn(
                buttonVariants({ variant: "primary", size: "md" }),
                "justify-self-center"
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

      {isLoading && !data && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {data && data.projects.length === 0 && (
        <div className="border-2 border-dashed border-border p-6 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">No projects yet</h3>
          <p className="text-sm text-muted-foreground">Be the first to submit a project!</p>
          <Button onClick={() => (window.location.href = "/submit")} className="mt-4">
            Submit a Project
          </Button>
        </div>
      )}

      {data && data.projects.length > 0 && (
        <>
          <div
            className={cn(
              displayMode === "grid"
                ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : displayMode === "list-lg"
                ? "space-y-4"
                : "space-y-3"
            )}
          >
            {data.projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                rank={index + 1}
                variant={displayMode}
                sloppy={slopEnabled}
              />
            ))}
          </div>

          {page < data.pagination.totalPages && (
            <div className="flex justify-center mt-4">
              <Button variant="secondary" onClick={loadMore}>
                Load More
              </Button>
            </div>
          )}

          <div className="text-center text-muted-foreground text-xs mt-4">
            Showing {data.projects.length} of {data.pagination.total} projects
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
