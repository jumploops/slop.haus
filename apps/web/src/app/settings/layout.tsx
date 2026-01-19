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
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 min-h-[calc(100vh-200px)]">
        <aside className="md:border-r md:border-border md:pr-8">
          <h2 className="text-xl font-semibold mb-4">Settings</h2>
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
    <nav className="flex flex-row md:flex-col gap-1">
      {settingsNav.map((item) => (
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
