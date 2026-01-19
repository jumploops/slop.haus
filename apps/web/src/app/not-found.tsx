import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className={buttonVariants({ variant: "primary" })}>
          Go Home
        </Link>
      </div>
    </div>
  );
}
