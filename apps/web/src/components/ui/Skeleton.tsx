import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />;
}

export function SkeletonText({ className }: SkeletonProps) {
  return <div className={cn("skeleton skeleton-text", className)} />;
}

export function SkeletonAvatar({ className }: SkeletonProps) {
  return <div className={cn("skeleton skeleton-avatar", className)} />;
}

export function ProjectCardSkeleton() {
  return (
    <div className="project-card">
      <Skeleton className="skeleton-image" />
      <SkeletonText className="skeleton-title" />
      <SkeletonText className="skeleton-tagline" />
      <Skeleton className="skeleton-vibe" />
      <div className="skeleton-meta">
        <SkeletonText />
        <SkeletonText />
        <SkeletonText />
      </div>
    </div>
  );
}
