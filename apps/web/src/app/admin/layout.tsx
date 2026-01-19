"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Mod Queue" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/revisions", label: "Revisions" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 min-h-[calc(100vh-200px)]">
        <aside className="md:border-r md:border-border md:pr-8">
          <Skeleton variant="text" className="w-24 h-6" />
        </aside>
        <div>
          <Skeleton variant="title" className="w-48" />
        </div>
      </div>
    );
  }

  const isAdmin = session?.user?.role === "admin";
  const isMod = session?.user?.role === "mod";
  const hasAccess = isAdmin || isMod;

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 className="text-2xl font-bold mb-2">Unauthorized</h1>
        <p className="text-muted mb-6">You don't have permission to access this page.</p>
        <Link href="/">
          <Button variant="primary">Go Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 min-h-[calc(100vh-200px)]">
      <aside className="md:border-r md:border-border md:pr-8">
        <h2 className="text-xl font-semibold mb-4 text-danger">Admin</h2>
        <AdminNav isAdmin={isAdmin} />
      </aside>
      <div>{children}</div>
    </div>
  );
}

function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  // Mods can only see mod queue
  const nav = isAdmin ? adminNav : adminNav.slice(0, 1);

  return (
    <nav className="flex flex-row md:flex-col gap-1">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "px-3 py-2 rounded-md text-sm transition-colors hover:no-underline",
            pathname === item.href
              ? "bg-border text-fg"
              : "text-muted hover:text-fg hover:bg-bg-secondary"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
