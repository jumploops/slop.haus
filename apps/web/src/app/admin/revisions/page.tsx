"use client";

import useSWR from "swr";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  fetchPendingRevisions,
  approveRevision,
  rejectRevision,
} from "@/lib/api/admin";
import { useToast } from "@/components/ui/Toast";
import { formatRelativeTime } from "@/lib/utils";
import { useState } from "react";
import type { ProjectRevision } from "@/lib/api/projects";

export default function RevisionsPage() {
  const { showToast } = useToast();
  const { data: revisions, error, isLoading, mutate } = useSWR(
    "/admin/revisions",
    fetchPendingRevisions
  );
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (revision: ProjectRevision) => {
    setProcessingId(revision.id);
    try {
      await approveRevision(revision.id);
      showToast("Revision approved", "success");
      mutate();
    } catch (error) {
      showToast("Failed to approve revision", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (revision: ProjectRevision) => {
    if (!confirm("Are you sure you want to reject this revision?")) return;

    setProcessingId(revision.id);
    try {
      await rejectRevision(revision.id);
      showToast("Revision rejected", "success");
      mutate();
    } catch (error) {
      showToast("Failed to reject revision", "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-border bg-card p-4">
        <h1 className="font-mono text-xl font-black text-foreground">Pending Revisions</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review and approve project edit requests.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border-2 border-border p-4">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-full mt-2" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="border-2 border-destructive bg-card p-6 text-center">
          <p className="text-sm text-destructive">Failed to load revisions</p>
        </div>
      )}

      {!isLoading && !error && revisions?.length === 0 && (
        <div className="border-2 border-dashed border-border p-6 text-center">
          <CheckIcon />
          <h3 className="text-foreground mt-4 mb-1 font-bold">No pending revisions</h3>
          <p className="text-xs text-muted-foreground">All project edits have been reviewed.</p>
        </div>
      )}

      {!isLoading && !error && revisions && revisions.length > 0 && (
        <div className="flex flex-col gap-4">
          {revisions.map((revision) => (
            <div key={revision.id} className="bg-card border-2 border-border p-4">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <Badge variant="warning">Pending Review</Badge>
                  <span className="text-[10px] text-muted-foreground">
                    Submitted {formatRelativeTime(revision.submittedAt)}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {revision.title && (
                    <div className="p-3 bg-muted border-2 border-border">
                      <label className="block text-[10px] text-muted-foreground mb-1">Title</label>
                      <p className="text-sm m-0 text-foreground">{revision.title}</p>
                    </div>
                  )}
                  {revision.tagline && (
                    <div className="p-3 bg-muted border-2 border-border">
                      <label className="block text-[10px] text-muted-foreground mb-1">Tagline</label>
                      <p className="text-sm m-0 text-foreground">{revision.tagline}</p>
                    </div>
                  )}
                  {revision.description && (
                    <div className="p-3 bg-muted border-2 border-border">
                      <label className="block text-[10px] text-muted-foreground mb-1">Description</label>
                      <p className="text-sm m-0 max-h-[150px] overflow-y-auto whitespace-pre-wrap text-foreground">
                        {revision.description}
                      </p>
                    </div>
                  )}
                  {revision.mainUrl && (
                    <div className="p-3 bg-muted border-2 border-border">
                      <label className="block text-[10px] text-muted-foreground mb-1">Main URL</label>
                      <p className="text-sm m-0 text-foreground">{revision.mainUrl}</p>
                    </div>
                  )}
                  {revision.repoUrl && (
                    <div className="p-3 bg-muted border-2 border-border">
                      <label className="block text-[10px] text-muted-foreground mb-1">Repo URL</label>
                      <p className="text-sm m-0 text-foreground">{revision.repoUrl}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 mt-4 border-t-2 border-border">
                  <Button
                    variant="primary"
                    onClick={() => handleApprove(revision)}
                    disabled={processingId === revision.id}
                  >
                    {processingId === revision.id ? "Processing..." : "Approve"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleReject(revision)}
                    disabled={processingId === revision.id}
                  >
                    Reject
                  </Button>
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
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto text-primary">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
