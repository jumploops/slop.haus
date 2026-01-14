"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { EditableProject } from "@/components/project/EditableProject";
import { DeleteProjectModal } from "@/components/project/DeleteProjectModal";
import { useSession } from "@/lib/auth-client";
import { fetchProject, updateProject, deleteProject, fetchProjectRevisions } from "@/lib/api/projects";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function EditProjectPage({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const { data: project, error, mutate } = useSWR(
    `/projects/${slug}`,
    () => fetchProject(slug)
  );

  // Fetch revisions to show pending/rejected status
  const { data: revisions, mutate: mutateRevisions } = useSWR(
    project ? `/projects/${slug}/revisions` : null,
    () => fetchProjectRevisions(slug)
  );

  // Find the latest pending or rejected revision to display
  const latestActionableRevision = revisions?.find(
    (r) => r.status === "pending" || r.status === "rejected"
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Loading state
  if (!project || sessionPending) {
    return (
      <RequireAuth>
        <div className="edit-project-loading">
          <div className="skeleton" style={{ width: "100%", height: "400px" }} />
        </div>
      </RequireAuth>
    );
  }

  // Error state
  if (error) {
    return (
      <RequireAuth>
        <div className="empty-state">
          <p>Failed to load project. Please try again.</p>
        </div>
      </RequireAuth>
    );
  }

  // Auth check - redirect if not author
  const isAuthor = session?.user?.id === project.author.id;
  if (!session || !isAuthor) {
    router.replace(`/p/${slug}`);
    return null;
  }

  // Field change handler
  const handleFieldChange = async (field: string, value: unknown) => {
    setSaveError(null);
    try {
      const result = await updateProject(slug, { [field]: value });
      // Update local cache with new data
      mutate(result.project, false);
      // Revalidate revisions to reflect new revision status
      mutateRevisions();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
      throw err; // Re-throw so the component knows it failed
    }
  };

  // Delete handler
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(slug);
      router.push("/");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete");
      setIsDeleting(false);
    }
  };

  // Screenshot change handler - revalidate to get updated media
  const handleScreenshotChange = () => {
    mutate();
  };

  return (
    <RequireAuth>
      <EditableProject
        project={project}
        onFieldChange={handleFieldChange}
        onScreenshotChange={handleScreenshotChange}
        onDelete={() => setShowDeleteModal(true)}
        onDone={() => router.push(`/p/${slug}`)}
        error={saveError}
        pendingRevision={latestActionableRevision}
        onRevisionDismiss={() => mutateRevisions()}
      />
      <DeleteProjectModal
        projectTitle={project.title}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </RequireAuth>
  );
}
