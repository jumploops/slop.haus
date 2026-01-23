import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-6">
      <div className="border-2 border-dashed border-border bg-card p-6 text-center">
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">Error 404</p>
          <h1 className="text-5xl font-black text-foreground mt-2">404</h1>
          <h2 className="font-mono text-lg font-bold text-foreground mt-2">Page Not Found</h2>
          <p className="text-xs text-muted-foreground mt-3">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "primary", size: "sm" }), "no-underline mt-4")}
          >
            Go Home
          </Link>
      </div>
    </div>
  );
}
