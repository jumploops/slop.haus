"use client";

import useSWR from "swr";
import Link from "next/link";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchMyProjects, deleteProject, type MyProjectListItem } from "@/lib/api/projects";
import { formatRelativeTime, getPlaceholderImage } from "@/lib/utils";
import { useState } from "react";
import { DeleteProjectModal } from "@/components/project/DeleteProjectModal";
import { useRouter } from "next/navigation";

export default function MyProjectsPage() {
  return (
    <RequireAuth>
      <MyProjectsContent />
    </RequireAuth>
  );
}

function MyProjectsContent() {
  const router = useRouter();
  const { data: projects, error, isLoading, mutate } = useSWR(
    "/users/me/projects",
    fetchMyProjects
  );

  const [deleteTarget, setDeleteTarget] = useState<MyProjectListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteProject(deleteTarget.slug);
      mutate();
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete project:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="my-projects-page">
      <div className="my-projects-header">
        <div>
          <h1>My Projects</h1>
          <p className="my-projects-description">
            Manage your submitted projects
          </p>
        </div>
        <Link href="/submit" className="btn btn-primary">
          <PlusIcon /> Submit New
        </Link>
      </div>

      {isLoading && (
        <div className="my-projects-list">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="my-project-card skeleton-card">
              <div className="skeleton" style={{ width: "80px", height: "60px" }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: "60%", height: "1.25rem" }} />
                <div className="skeleton" style={{ width: "80%", height: "1rem", marginTop: "0.5rem" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="empty-state">
          <p>Failed to load projects</p>
        </div>
      )}

      {!isLoading && !error && projects?.length === 0 && (
        <div className="empty-state">
          <EmptyBoxIcon />
          <h3>No projects yet</h3>
          <p>
            <Link href="/submit">Submit your first project</Link> to get started.
          </p>
        </div>
      )}

      {!isLoading && !error && projects && projects.length > 0 && (
        <div className="my-projects-list">
          {projects.map((project) => (
            <MyProjectCard
              key={project.id}
              project={project}
              onEdit={() => router.push(`/p/${project.slug}/edit`)}
              onDelete={() => setDeleteTarget(project)}
            />
          ))}
        </div>
      )}

      {deleteTarget && (
        <DeleteProjectModal
          projectTitle={deleteTarget.title}
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}

interface MyProjectCardProps {
  project: MyProjectListItem;
  onEdit: () => void;
  onDelete: () => void;
}

function MyProjectCard({ project, onEdit, onDelete }: MyProjectCardProps) {
  const primaryMedia = project.primaryMedia;
  const imageUrl = primaryMedia?.url || getPlaceholderImage(project.title);

  const statusBadge = getStatusBadge(project.status);

  return (
    <div className="my-project-card">
      <Link href={`/p/${project.slug}`} className="my-project-card-image">
        <img src={imageUrl} alt={project.title} />
      </Link>

      <div className="my-project-card-content">
        <div className="my-project-card-header">
          <Link href={`/p/${project.slug}`} className="my-project-card-title">
            {project.title}
          </Link>
          {statusBadge && (
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          )}
        </div>

        <p className="my-project-card-tagline">{project.tagline}</p>

        <div className="my-project-card-meta">
          <span>Submitted {formatRelativeTime(project.createdAt)}</span>
          {project.lastEditedAt && (
            <span>Edited {formatRelativeTime(project.lastEditedAt)}</span>
          )}
          <span>{project.commentCount} comment{project.commentCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="my-project-card-actions">
        {project.status !== "removed" && (
          <>
            <Button variant="secondary" onClick={onEdit}>
              <PencilIcon /> Edit
            </Button>
            <Button variant="ghost" onClick={onDelete} className="btn-danger-ghost">
              <TrashIcon /> Delete
            </Button>
          </>
        )}
        {project.status === "removed" && (
          <span className="my-project-card-removed">Deleted</span>
        )}
      </div>
    </div>
  );
}

function getStatusBadge(status: string): { variant: "warning" | "danger"; label: string } | null {
  switch (status) {
    case "hidden":
      return { variant: "warning", label: "Pending Review" };
    case "removed":
      return { variant: "danger", label: "Removed" };
    default:
      return null; // published - no badge needed
  }
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.85 2.15a.5.5 0 0 1 .7 0l1.3 1.3a.5.5 0 0 1 0 .7l-8.5 8.5a.5.5 0 0 1-.2.12l-2.5.75a.5.5 0 0 1-.62-.62l.75-2.5a.5.5 0 0 1 .12-.2l8.5-8.5zm.35 1.4L11 2.35 3.5 9.85l-.45 1.5 1.5-.45L12.2 3.55z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6.5 1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V2h3.25a.75.75 0 0 1 0 1.5H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3.5h-.25a.75.75 0 0 1 0-1.5H6v-.5zm1 0V2h1V1.5h-1zM4.5 3.5v9a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5v-9h-7z" />
    </svg>
  );
}

function EmptyBoxIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
