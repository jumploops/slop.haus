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
import Link from "next/link";
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
    <div className="admin-page">
      <h1>Pending Revisions</h1>
      <p className="admin-page-description">
        Review and approve project edit requests.
      </p>

      {isLoading && (
        <div className="revisions-list">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="revision-item">
              <Skeleton className="skeleton-text" style={{ width: "200px" }} />
              <Skeleton className="skeleton-text" style={{ width: "100%", marginTop: "0.5rem" }} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="empty-state">
          <p>Failed to load revisions</p>
        </div>
      )}

      {!isLoading && !error && revisions?.length === 0 && (
        <div className="empty-state">
          <CheckIcon />
          <h3>No pending revisions</h3>
          <p>All project edits have been reviewed.</p>
        </div>
      )}

      {!isLoading && !error && revisions && revisions.length > 0 && (
        <div className="revisions-list">
          {revisions.map((revision) => (
            <div key={revision.id} className="revision-item">
              <div className="revision-header">
                <Badge variant="warning">Pending Review</Badge>
                <span className="revision-time">
                  Submitted {formatRelativeTime(revision.submittedAt)}
                </span>
              </div>

              <div className="revision-changes">
                {revision.title && (
                  <div className="revision-field">
                    <label>Title</label>
                    <p className="revision-new-value">{revision.title}</p>
                  </div>
                )}
                {revision.tagline && (
                  <div className="revision-field">
                    <label>Tagline</label>
                    <p className="revision-new-value">{revision.tagline}</p>
                  </div>
                )}
                {revision.description && (
                  <div className="revision-field">
                    <label>Description</label>
                    <p className="revision-new-value revision-description">
                      {revision.description}
                    </p>
                  </div>
                )}
                {revision.mainUrl && (
                  <div className="revision-field">
                    <label>Main URL</label>
                    <p className="revision-new-value">{revision.mainUrl}</p>
                  </div>
                )}
                {revision.repoUrl && (
                  <div className="revision-field">
                    <label>Repo URL</label>
                    <p className="revision-new-value">{revision.repoUrl}</p>
                  </div>
                )}
              </div>

              <div className="revision-actions">
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
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
