import { cva, type VariantProps } from "class-variance-authority";

/**
 * Button style variants using CVA.
 * Extracted to a separate file so it can be used in both
 * Server Components (for Links) and Client Components (for Buttons).
 */
export const buttonVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center gap-2",
    "font-bold transition-colors duration-200",
    "border-2 border-[color:var(--foreground)]",
    "shadow-[2px_2px_0_var(--foreground)]",
    "active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-b from-accent via-accent-dim to-accent",
          "text-accent-foreground",
        ],
        secondary: [
          "bg-gradient-to-b from-bg-secondary via-bg to-border",
          "text-fg",
        ],
        ghost: [
          "bg-transparent text-fg border-transparent shadow-none",
          "hover:bg-bg-secondary hover:border-[color:var(--foreground)]",
        ],
        danger: [
          "bg-danger text-bg",
        ],
      },
      size: {
        sm: "px-2 py-1 text-xs rounded-sm",
        md: "px-4 py-2 text-sm rounded-md",
        lg: "px-6 py-3 text-base rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
