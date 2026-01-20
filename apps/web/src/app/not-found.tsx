import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="text-center">
        <h1 className="text-[6rem] font-bold leading-none bg-gradient-to-br from-accent to-accent-dim bg-clip-text text-transparent mb-2">
          404
        </h1>
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-muted mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className={buttonVariants({ variant: "primary" })}>
          Go Home
        </Link>
      </div>
    </div>
  );
}
