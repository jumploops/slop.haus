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
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 min-h-[calc(100vh-200px)]">
        <aside className="border-2 border-dashed border-border bg-card p-4">
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
      <div className="max-w-lg mx-auto">
        <div className="border-2 border-destructive bg-card p-6 text-center">
          <h1 className="text-xl font-bold text-destructive mb-2">Unauthorized</h1>
          <p className="text-xs text-muted-foreground mb-4">
            You don&apos;t have permission to access this page.
          </p>
          <Link href="/">
            <Button variant="primary">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 min-h-[calc(100vh-200px)]">
      <aside className="border-2 border-dashed border-border bg-card p-4">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-foreground mb-3">
          Admin
        </h2>
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
    <nav className="flex flex-row flex-wrap md:flex-col gap-1">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "px-3 py-2 text-xs font-bold font-mono uppercase tracking-wide transition-colors no-underline hover:no-underline",
            "border-2 border-dashed border-border",
            "bg-card",
            "flex-1 md:flex-none text-center md:text-left",
            pathname === item.href
              ? "bg-primary/10 text-primary border-primary"
              : "text-muted-foreground hover:text-primary"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
