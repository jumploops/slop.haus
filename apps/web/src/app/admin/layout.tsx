"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/Skeleton";

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
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <Skeleton className="skeleton-text" style={{ width: "100px", height: "24px" }} />
        </aside>
        <div className="admin-content">
          <Skeleton className="skeleton-text" style={{ width: "200px", height: "32px" }} />
        </div>
      </div>
    );
  }

  const isAdmin = session?.user?.role === "admin";
  const isMod = session?.user?.role === "mod";
  const hasAccess = isAdmin || isMod;

  if (!hasAccess) {
    return (
      <div className="admin-unauthorized">
        <h1>Unauthorized</h1>
        <p>You don't have permission to access this page.</p>
        <Link href="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>Admin</h2>
        <AdminNav isAdmin={isAdmin} />
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}

function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  // Mods can only see mod queue
  const nav = isAdmin ? adminNav : adminNav.slice(0, 1);

  return (
    <nav className="admin-nav">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`admin-nav-item ${pathname === item.href ? "active" : ""}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
