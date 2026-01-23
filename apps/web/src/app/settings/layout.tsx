"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { cn } from "@/lib/utils";

const settingsNav = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/connections", label: "Connections" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 min-h-[calc(100vh-200px)]">
        <aside className="border-2 border-dashed border-border bg-card p-4">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-foreground mb-3">
            Settings
          </h2>
          <SettingsNav />
        </aside>
        <div className="max-w-2xl">{children}</div>
      </div>
    </RequireAuth>
  );
}

function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row flex-wrap md:flex-col gap-1">
      {settingsNav.map((item) => (
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
