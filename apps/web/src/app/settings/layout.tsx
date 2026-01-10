"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";

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
      <div className="settings-layout">
        <aside className="settings-sidebar">
          <h2>Settings</h2>
          <SettingsNav />
        </aside>
        <div className="settings-content">{children}</div>
      </div>
    </RequireAuth>
  );
}

function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="settings-nav">
      {settingsNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`settings-nav-item ${pathname === item.href ? "active" : ""}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
