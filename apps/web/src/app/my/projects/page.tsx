"use client";

import useSWR from "swr";
import Link from "next/link";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonVariants } from "@/components/ui/Button";
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
    <div className="max-w-[900px] mx-auto p-4">
      <header className="flex justify-between items-start mb-6 gap-4 flex-col sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-muted mt-2">
            Manage your submitted projects
          </p>
        </div>
        <Link href="/submit" className={buttonVariants({ variant: "primary" })}>
          <PlusIcon /> Submit New
        </Link>
      </header>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 bg-bg-secondary border border-border rounded-lg items-center">
              <div className="skeleton w-[80px] h-[60px]" />
              <div className="flex-1">
                <div className="skeleton w-3/5 h-5" />
                <div className="skeleton w-4/5 h-4 mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-muted">
          <p>Failed to load projects</p>
        </div>
      )}

      {!isLoading && !error && projects?.length === 0 && (
        <div className="text-center py-12 text-muted">
          <EmptyBoxIcon />
          <h3 className="text-fg mt-4 mb-2 font-semibold">No projects yet</h3>
          <p>
            <Link href="/submit">Submit your first project</Link> to get started.
          </p>
        </div>
      )}

      {!isLoading && !error && projects && projects.length > 0 && (
        <div className="flex flex-col gap-3">
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
    <div className="flex gap-4 p-4 bg-bg-secondary border border-border rounded-lg items-start flex-col sm:flex-row">
      <Link href={`/p/${project.slug}`} className="shrink-0 w-full sm:w-[100px] h-[120px] sm:h-[75px] rounded overflow-hidden bg-bg">
        <img src={imageUrl} alt={project.title} className="w-full h-full object-cover" />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/p/${project.slug}`} className="font-semibold text-fg truncate hover:text-accent hover:no-underline">
            {project.title}
          </Link>
          {statusBadge && (
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          )}
        </div>

        <p className="text-muted text-sm line-clamp-2 mb-2">{project.tagline}</p>

        <div className="flex gap-3 text-xs text-muted">
          <span>Submitted {formatRelativeTime(project.createdAt)}</span>
          {project.lastEditedAt && (
            <span>Edited {formatRelativeTime(project.lastEditedAt)}</span>
          )}
          <span>{project.commentCount} comment{project.commentCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-start">
        {project.status !== "removed" && (
          <>
            <Button variant="secondary" onClick={onEdit}>
              <PencilIcon /> Edit
            </Button>
            <Button variant="ghost" onClick={onDelete} className="text-danger hover:bg-danger/10">
              <TrashIcon /> Delete
            </Button>
          </>
        )}
        {project.status === "removed" && (
          <span className="text-muted text-sm italic">Deleted</span>
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
