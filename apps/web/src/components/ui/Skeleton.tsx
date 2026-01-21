import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "avatar" | "image" | "title" | "tagline" | "vibe";
  style?: React.CSSProperties;
}

export function Skeleton({ className, variant, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded bg-gradient-to-r from-border via-bg-secondary to-border bg-[length:200%_100%] animate-shimmer",
        variant === "text" && "h-4 w-full",
        variant === "avatar" && "w-8 h-8 rounded-full",
        variant === "image" && "w-[120px] h-[80px]",
        variant === "title" && "h-6 w-3/5",
        variant === "tagline" && "h-4 w-4/5",
        variant === "vibe" && "h-2 w-full",
        className
      )}
      style={style}
    />
  );
}

export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton variant="text" className={className} />;
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return <Skeleton variant="avatar" className={className} />;
}

export function ProjectCardSkeleton() {
  return (
    <div className="card mb-4">
      <div className="flex gap-4 mb-4">
        <Skeleton variant="image" />
        <div className="flex-1">
          <Skeleton variant="title" className="mb-2" />
          <Skeleton variant="tagline" className="mb-2" />
          <Skeleton variant="vibe" />
        </div>
      </div>
      <div className="flex gap-4 pt-4 border-t border-border">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
