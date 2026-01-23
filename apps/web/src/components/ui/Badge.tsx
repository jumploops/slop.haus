import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center px-2 py-0.5",
    "rounded-none text-[10px] font-bold",
    "font-mono uppercase tracking-wide",
    "border-2 border-border",
  ],
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        secondary: "bg-muted text-muted-foreground",
        success: "bg-slop-lime/30 text-foreground",
        warning: "bg-slop-orange/30 text-foreground",
        danger: "bg-destructive/20 text-destructive",
        dev: "bg-slop-pink/30 text-foreground",
        admin: "bg-destructive/20 text-destructive",
        mod: "bg-slop-orange/20 text-foreground",
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
