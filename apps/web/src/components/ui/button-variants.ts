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
    "font-medium transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-accent text-accent-foreground border border-accent",
          "hover:bg-accent-dim hover:border-accent-dim",
        ],
        secondary: [
          "bg-transparent text-fg border border-border",
          "hover:bg-border",
        ],
        ghost: [
          "bg-transparent text-muted border border-transparent",
          "hover:text-fg hover:bg-border",
        ],
        danger: [
          "bg-danger text-white border border-danger",
          "hover:opacity-90",
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
