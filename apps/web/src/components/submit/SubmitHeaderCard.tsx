"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SubmitTabs, type SubmitTab } from "@/components/submit/SubmitTabs";
import { cn } from "@/lib/utils";

interface SubmitHeaderCardProps {
  activeTab: SubmitTab;
  className?: string;
  maxWidthClassName?: string;
  contentClassName?: string;
  children?: React.ReactNode;
}

export function SubmitHeaderCard({
  activeTab,
  className,
  maxWidthClassName = "max-w-2xl",
  contentClassName,
  children,
}: SubmitHeaderCardProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className={cn("mx-auto", maxWidthClassName, className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="inline-flex items-center gap-2 px-0 text-xs uppercase tracking-wide"
      >
        <BackIcon />
        Back
      </Button>

      <div className="mt-3 border-y-2 border-dashed border-border bg-card p-6 md:border-2">
        <h1 className="mb-2 font-mono text-2xl font-black text-foreground">
          Share your vibecoded project
        </h1>
        <p className="text-xs text-muted-foreground">
          Choose how you want to submit your project.
        </p>
        <SubmitTabs activeTab={activeTab} className="mt-4" />
        {children ? <div className={cn("mt-6", contentClassName)}>{children}</div> : null}
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
