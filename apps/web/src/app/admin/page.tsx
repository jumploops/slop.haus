"use client";

import { useState } from "react";
import useSWR from "swr";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  fetchModQueue,
  approveProject,
  hideProject,
  removeProject,
  approveComment,
  removeComment,
  type ModQueueItem,
} from "@/lib/api/admin";
import { useToast } from "@/components/ui/Toast";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

export default function ModQueuePage() {
  const [filter, setFilter] = useState<"all" | "project" | "comment">("all");
  const { showToast } = useToast();

  const { data: items, error, isLoading, mutate } = useSWR(
    `/admin/mod-queue?filter=${filter}`,
    () => fetchModQueue(filter === "all" ? undefined : filter)
  );

  const handleApproveProject = async (item: ModQueueItem) => {
    try {
      await approveProject(item.id);
      showToast("Project approved", "success");
      mutate();
    } catch (error) {
      showToast("Failed to approve project", "error");
    }
  };

  const handleHideProject = async (item: ModQueueItem) => {
    try {
      await hideProject(item.id);
      showToast("Project hidden", "success");
      mutate();
    } catch (error) {
      showToast("Failed to hide project", "error");
    }
  };

  const handleRemoveProject = async (item: ModQueueItem) => {
    if (!confirm("Are you sure you want to remove this project?")) return;
    try {
      await removeProject(item.id);
      showToast("Project removed", "success");
      mutate();
    } catch (error) {
      showToast("Failed to remove project", "error");
    }
  };

  const handleApproveComment = async (item: ModQueueItem) => {
    try {
      await approveComment(item.id);
      showToast("Comment approved", "success");
      mutate();
    } catch (error) {
      showToast("Failed to approve comment", "error");
    }
  };

  const handleRemoveComment = async (item: ModQueueItem) => {
    if (!confirm("Are you sure you want to remove this comment?")) return;
    try {
      await removeComment(item.id);
      showToast("Comment removed", "success");
      mutate();
    } catch (error) {
      showToast("Failed to remove comment", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3">
        <h1 className="text-xl font-bold text-slop-blue">★ MOD QUEUE ★</h1>
        <p className="text-xs text-muted mt-1">
          Review flagged and hidden content awaiting moderation.
        </p>
      </div>

      <Tabs
        tabs={[
          { id: "all", label: "All" },
          { id: "project", label: "Projects" },
          { id: "comment", label: "Comments" },
        ]}
        activeTab={filter}
        onTabChange={(id) => setFilter(id as typeof filter)}
      />

      <div>
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)]">
                <Skeleton variant="text" className="w-3/5" />
                <Skeleton variant="text" className="w-full mt-2" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-6 text-center">
            <p className="text-sm text-danger">Failed to load mod queue</p>
          </div>
        )}

        {!isLoading && !error && items?.length === 0 && (
          <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-6 text-center">
            <CheckIcon />
            <h3 className="text-lg font-bold mt-4 mb-1">Queue is empty</h3>
            <p className="text-xs text-muted">No items awaiting moderation.</p>
          </div>
        )}

        {!isLoading && !error && items && items.length > 0 && (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
                <div className="bg-bg border-2 border-[color:var(--border)] p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.type === "project" ? "default" : "secondary"}>
                        {item.type}
                      </Badge>
                      <Badge variant="warning">{item.status}</Badge>
                      {item.flagCount > 0 && (
                        <Badge variant="danger">{item.flagCount} flags</Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="mb-3">
                    {item.type === "project" && (
                      <h3 className="font-bold text-sm">
                        {item.slug ? (
                          <Link href={`/p/${item.slug}`} className="hover:text-slop-coral">
                            {item.title}
                          </Link>
                        ) : (
                          item.title
                        )}
                      </h3>
                    )}
                    {item.type === "comment" && (
                      <p className="text-sm text-fg line-clamp-3">{item.body}</p>
                    )}
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-2 mb-4">
                    <Avatar src={item.author.image} alt={item.author.name} size="sm" />
                    <span className="text-xs text-muted">{item.author.name}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {item.type === "project" && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveProject(item)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleHideProject(item)}
                        >
                          Hide
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProject(item)}
                        >
                          Remove
                        </Button>
                      </>
                    )}
                    {item.type === "comment" && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveComment(item)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveComment(item)}
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto text-slop-green">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
