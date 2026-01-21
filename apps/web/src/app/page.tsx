"use client";

import { useState } from "react";
import useSWR from "swr";
import { Tabs } from "@/components/ui/Tabs";
import { ProjectCard } from "@/components/project/ProjectCard";
import { ProjectCardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { fetchFeed, FeedResponse } from "@/lib/api/projects";
import { cn } from "@/lib/utils";

type SortOption = "hot" | "new" | "top";
type ChannelOption = "normal" | "dev";
type WindowOption = "24h" | "7d" | "30d" | "all";

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
  const [sort, setSort] = useState<SortOption>("hot");
  const [channel, setChannel] = useState<ChannelOption>("normal");
  const [timeWindow, setTimeWindow] = useState<WindowOption>("all");
  const [page, setPage] = useState(1);

  const { data, error, isLoading, mutate } = useSWR<FeedResponse>(
    ["feed", sort, channel, timeWindow, page],
    () => fetchFeed({ sort, channel, window: timeWindow, page, limit: 20 }),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const handleSortChange = (newSort: string) => {
    setSort(newSort as SortOption);
    setPage(1);
  };

  const handleChannelChange = (newChannel: ChannelOption) => {
    setChannel(newChannel);
    setPage(1);
  };

  const handleWindowChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeWindow(e.target.value as WindowOption);
    setPage(1);
  };

  const loadMore = () => {
    if (data && page < data.pagination.totalPages) {
      setPage((p) => p + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Tabs
          tabs={sortTabs}
          activeTab={sort}
          onTabChange={handleSortChange}
          className="mb-0 w-full sm:w-auto"
        />

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant={channel === "normal" ? "primary" : "secondary"}
            size="sm"
            onClick={() => handleChannelChange("normal")}
          >
            Normal
          </Button>
          <Button
            type="button"
            variant={channel === "dev" ? "primary" : "secondary"}
            size="sm"
            onClick={() => handleChannelChange("dev")}
          >
            Dev
          </Button>
        </div>

        {sort === "top" && (
          <select
            value={timeWindow}
            onChange={handleWindowChange}
            className={cn(
              "w-full sm:w-auto",
              "min-h-10 sm:min-h-0 px-2 py-2 sm:py-1 text-xs font-bold",
              "bg-bg text-fg",
              "border-2 border-[color:var(--border)]",
              "shadow-[2px_2px_0_var(--foreground)]"
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

      {error && (
        <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-6 text-center">
          <h3 className="text-lg font-bold text-slop-coral mb-2">Failed to load feed</h3>
          <p className="text-sm text-muted">Please try again later.</p>
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
        <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-6 text-center">
          <h3 className="text-lg font-bold text-slop-purple mb-2">No projects yet</h3>
          <p className="text-sm text-muted">Be the first to submit a project!</p>
          <Button onClick={() => (window.location.href = "/submit")} className="mt-4">
            Submit a Project
          </Button>
        </div>
      )}

      {data && data.projects.length > 0 && (
        <>
          <div className="space-y-3">
            {data.projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} channel={channel} rank={index + 1} />
            ))}
          </div>

          {page < data.pagination.totalPages && (
            <div className="flex justify-center mt-4">
              <Button variant="secondary" onClick={loadMore}>
                Load More
              </Button>
            </div>
          )}

          <div className="text-center text-muted text-xs mt-4">
            Showing {data.projects.length} of {data.pagination.total} projects
          </div>
        </>
      )}
    </div>
  );
}
