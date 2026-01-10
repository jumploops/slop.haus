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
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn("avatar", `avatar-${size}`, className)}>
      {src ? (
        <img src={src} alt={alt} className="avatar-image" />
      ) : (
        <span className="avatar-initials">{initials}</span>
      )}
    </div>
  );
}
