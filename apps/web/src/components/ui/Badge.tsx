import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center px-2 py-0.5",
    "rounded-sm text-[10px] font-bold",
    "border-2 border-[color:var(--foreground)]",
  ],
  {
    variants: {
      variant: {
        default: "bg-bg-secondary text-fg",
        secondary: "bg-bg text-muted",
        success: "bg-slop-green/20 text-slop-green",
        warning: "bg-slop-yellow/40 text-fg",
        danger: "bg-danger/20 text-danger",
        dev: "bg-slop-purple/20 text-slop-purple",
        admin: "bg-danger/20 text-danger",
        mod: "bg-warning/20 text-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, variant, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}

export { badgeVariants };
