"use client";

import { useState } from "react";
import type { ProjectRevision } from "@/lib/api/projects";

interface RevisionStatusBannerProps {
  revision: ProjectRevision;
  onDismiss?: () => void;
}

export function RevisionStatusBanner({ revision, onDismiss }: RevisionStatusBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (revision.status === "approved") {
    return null;
  }

  const isPending = revision.status === "pending";
  const isRejected = revision.status === "rejected";

  // Map field names to display labels
  const fieldLabels: Record<string, string> = {
    title: "title",
    tagline: "tagline",
    description: "description",
    mainUrl: "main URL",
    repoUrl: "repository URL",
    vibeMode: "vibe mode",
    vibePercent: "vibe score",
    vibeDetails: "vibe details",
    tools: "tools",
  };

  // Use the explicit changedFields array from the revision
  // This solves the NULL ambiguity - we know exactly what was changed
  const changedFields = (revision.changedFields || []).map(
    (field) => fieldLabels[field] || field
  );

  return (
    <div className={`revision-banner ${isPending ? "revision-banner-pending" : "revision-banner-rejected"}`}>
      <div className="revision-banner-header">
        <div className="revision-banner-icon">
          {isPending ? <ClockIcon /> : <AlertIcon />}
        </div>
        <div className="revision-banner-content">
          <p className="revision-banner-title">
            {isPending
              ? "Your recent edits are pending review"
              : "Your recent edits were not approved"}
          </p>
          <p className="revision-banner-subtitle">
            {isPending
              ? "A moderator will review your changes shortly. The project shows the previous version until approved."
              : "Please review the feedback below and make corrections."}
          </p>
        </div>
        {onDismiss && isRejected && (
          <button
            type="button"
            className="revision-banner-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {(isRejected || changedFields.length > 0) && (
        <button
          type="button"
          className="revision-banner-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Hide details" : "Show details"}
          <ChevronIcon direction={isExpanded ? "up" : "down"} />
        </button>
      )}

      {isExpanded && (
        <div className="revision-banner-details">
          {changedFields.length > 0 && (
            <div className="revision-banner-fields">
              <p className="revision-banner-fields-label">Fields changed:</p>
              <ul>
                {changedFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          )}

          {isRejected && revision.reason && (
            <div className="revision-banner-reason">
              <p className="revision-banner-reason-label">Reason:</p>
              <p className="revision-banner-reason-text">{revision.reason}</p>
            </div>
          )}

          <p className="revision-banner-timestamp">
            Submitted {formatRelativeTime(revision.submittedAt)}
          </p>
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.28 3.22a.75.75 0 00-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 101.06 1.06L8 9.06l3.72 3.72a.75.75 0 101.06-1.06L9.06 8l3.72-3.72a.75.75 0 00-1.06-1.06L8 6.94 4.28 3.22z" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      style={{ transform: direction === "up" ? "rotate(180deg)" : undefined }}
    >
      <path d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" />
    </svg>
  );
}
