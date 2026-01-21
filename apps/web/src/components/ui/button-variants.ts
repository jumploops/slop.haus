import { cva, type VariantProps } from "class-variance-authority";

/**
 * Button style variants using CVA.
 * Extracted to a separate file so it can be used in both
 * Server Components (for Links) and Client Components (for Buttons).
 */
export const buttonVariants = cva(
  // Base styles
  [
    "btn",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        primary: [
          "btn-primary",
          "hover:bg-accent-dim hover:border-accent-dim",
        ],
        secondary: [
          "btn-secondary",
          "hover:bg-border",
        ],
        ghost: [
          "btn-ghost",
          "hover:text-fg hover:bg-border",
        ],
        danger: [
          "btn-danger",
          "hover:opacity-90",
        ],
      },
      size: {
        sm: "btn-sm",
        md: "btn-md",
        lg: "btn-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
