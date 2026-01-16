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
    <div className="admin-page">
      <h1>Mod Queue</h1>
      <p className="admin-page-description">
        Review flagged and hidden content awaiting moderation.
      </p>

      <Tabs
        tabs={[
          { id: "all", label: "All" },
          { id: "project", label: "Projects" },
          { id: "comment", label: "Comments" },
        ]}
        activeTab={filter}
        onTabChange={(id) => setFilter(id as typeof filter)}
      />

      {isLoading && (
        <div className="mod-queue-list">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mod-queue-item">
              <Skeleton className="skeleton-text" style={{ width: "60%" }} />
              <Skeleton className="skeleton-text" style={{ width: "100%", marginTop: "0.5rem" }} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="empty-state">
          <p>Failed to load mod queue</p>
        </div>
      )}

      {!isLoading && !error && items?.length === 0 && (
        <div className="empty-state">
          <CheckIcon />
          <h3>Queue is empty</h3>
          <p>No items awaiting moderation.</p>
        </div>
      )}

      {!isLoading && !error && items && items.length > 0 && (
        <div className="mod-queue-list">
          {items.map((item) => (
            <div key={item.id} className="mod-queue-item">
              <div className="mod-queue-item-header">
                <div className="mod-queue-item-info">
                  <Badge variant={item.type === "project" ? "default" : "secondary"}>
                    {item.type}
                  </Badge>
                  <Badge variant="warning">{item.status}</Badge>
                  {item.flagCount > 0 && (
                    <Badge variant="danger">{item.flagCount} flags</Badge>
                  )}
                </div>
                <span className="mod-queue-item-time">
                  {formatRelativeTime(item.createdAt)}
                </span>
              </div>

              <div className="mod-queue-item-content">
                {item.type === "project" && (
                  <>
                    <h3>
                      {item.slug ? (
                        <Link href={`/p/${item.slug}`}>{item.title}</Link>
                      ) : (
                        item.title
                      )}
                    </h3>
                  </>
                )}
                {item.type === "comment" && (
                  <p className="mod-queue-comment-body">{item.body}</p>
                )}
              </div>

              <div className="mod-queue-item-author">
                <Avatar src={item.author.image} alt={item.author.name} size="sm" />
                <span>{item.author.name}</span>
              </div>

              <div className="mod-queue-item-actions">
                {item.type === "project" && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => handleApproveProject(item)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleHideProject(item)}
                    >
                      Hide
                    </Button>
                    <Button
                      variant="ghost"
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
                      onClick={() => handleApproveComment(item)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleRemoveComment(item)}
                    >
                      Remove
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
