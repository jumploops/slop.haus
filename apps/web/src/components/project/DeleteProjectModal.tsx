"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface DeleteProjectModalProps {
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteProjectModal({
  projectTitle,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteProjectModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Delete "${projectTitle}"?`}>
      <div className="max-w-[400px]">
        <p className="mb-3 leading-relaxed">
          This will hide your project from public view. Reviews and likes will be preserved.
        </p>
        <p className="text-muted-foreground text-sm mb-3">
          If you need to restore a deleted project, please contact support.
        </p>
        <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-border">
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Project"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
