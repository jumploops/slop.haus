import { cn } from "@/lib/utils";

interface AvatarProps {
  src: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  const initials = alt
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-sm bg-bg-secondary overflow-hidden flex-shrink-0",
        "border-2 border-[color:var(--foreground)]",
        size === "sm" && "w-6 h-6 text-[0.625rem]",
        size === "md" && "w-8 h-8 text-xs",
        size === "lg" && "w-12 h-12 text-base",
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="text-fg font-medium">{initials}</span>
      )}
    </div>
  );
}
