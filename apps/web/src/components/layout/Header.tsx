"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { MobileNav } from "./MobileNav";

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-bg border-b border-border h-[var(--app-header-height)]">
      <div className="max-w-[var(--app-container-max)] mx-auto px-[var(--app-page-gutter)] h-full flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold text-accent hover:no-underline"
        >
          slop.haus
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-6">
          <NavLink href="/" active={pathname === "/"}>
            Feed
          </NavLink>
          <NavLink href="/submit" active={pathname === "/submit"}>
            Submit
          </NavLink>
          {session?.user && (
            <NavLink href="/favorites" active={pathname === "/favorites"}>
              Favorites
            </NavLink>
          )}
          {session?.user && (
            <NavLink href="/my/projects" active={pathname.startsWith("/my/projects")}>
              My Projects
            </NavLink>
          )}
          {session?.user && (
            <NavLink href="/settings/profile" active={pathname.startsWith("/settings")}>
              Settings
            </NavLink>
          )}
          {session?.user && (session.user.role === "admin" || session.user.role === "mod") && (
            <NavLink href="/admin" active={pathname.startsWith("/admin")}>
              Admin
            </NavLink>
          )}
        </nav>

        {/* Right side - theme switcher + auth buttons + mobile trigger */}
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <div className="hidden sm:block">
            <AuthButtons />
          </div>
          <button
            onClick={() => setMobileNavOpen(true)}
            className={cn(
              "sm:hidden flex items-center justify-center",
              "w-10 h-10 rounded-md",
              "bg-transparent hover:bg-border",
              "text-fg transition-colors"
            )}
            aria-label="Open navigation"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-fg hover:text-accent transition-colors duration-200",
        "hover:no-underline",
        active && "text-accent"
      )}
    >
      {children}
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
