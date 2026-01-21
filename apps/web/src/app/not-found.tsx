import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-6">
      <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3 text-center">
        <div className="bg-bg border-2 border-[color:var(--border)] p-6">
          <p className="text-[10px] text-muted">ERROR 404</p>
          <h1 className="text-5xl font-bold text-slop-coral mt-2">404</h1>
          <h2 className="text-lg font-bold text-slop-blue mt-2">Page Not Found</h2>
          <p className="text-xs text-muted mt-3">
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
    </div>
  );
}
