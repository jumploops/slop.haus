"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface UrlChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveOnly: () => void;
  onSaveAndRescrape: () => void;
  isSaving: boolean;
  urlType: "mainUrl" | "repoUrl";
}

export function UrlChangeModal({
  isOpen,
  onClose,
  onSaveOnly,
  onSaveAndRescrape,
  isSaving,
  urlType,
}: UrlChangeModalProps) {
  const isMainUrl = urlType === "mainUrl";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="URL Changed">
      <div className="max-w-[400px]">
        <p className="mb-3 leading-relaxed">
          You&apos;ve updated the {isMainUrl ? "live site" : "repository"} URL.
          Would you like to refresh the project data from this URL?
        </p>

        {isMainUrl && (
          <p className="text-muted-foreground text-sm mb-3">
            This will capture a new screenshot from the updated URL.
          </p>
        )}

        {!isMainUrl && (
          <p className="text-muted-foreground text-sm mb-3">
            This will refresh the README and project metadata from the new repository.
          </p>
        )}

        <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-border">
          <Button
            variant="secondary"
            onClick={onSaveOnly}
            disabled={isSaving}
          >
            Just Save URL
          </Button>
          <Button
            variant="primary"
            onClick={onSaveAndRescrape}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save & Refresh"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
