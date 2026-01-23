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
    "font-mono font-bold transition-colors duration-200",
    "border-2 border-border rounded-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90",
        ],
        secondary: [
          "bg-muted text-muted-foreground",
          "hover:border-primary hover:text-foreground",
        ],
        ghost: [
          "bg-transparent text-muted-foreground border-transparent",
          "hover:text-primary hover:border-border",
        ],
        danger: [
          "bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90",
        ],
      },
      size: {
        sm: "px-3 py-2 text-xs min-h-10 sm:min-h-0 sm:px-2 sm:py-1",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
