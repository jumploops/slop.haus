"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { MobileNav } from "./MobileNav";
import { Star } from "lucide-react";

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b-4 border-[color:var(--foreground)] bg-gradient-to-r from-slop-teal via-slop-purple to-slop-pink h-[var(--app-header-height)]">
      <div className="max-w-[var(--app-container-max)] mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-1 text-xl font-bold drop-shadow-[2px_2px_0_var(--foreground)] no-underline hover:no-underline"
        >
          <Star className="h-4 w-4 text-slop-yellow motion-safe:animate-[spinSlow_6s_linear_infinite]" />
          <span className="text-accent-foreground">SlOp</span>
          <span className="text-slop-yellow">.HaUs</span>
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

        {/* Right side - auth buttons + mobile trigger */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <AuthButtons />
          </div>
          <button
            onClick={() => setMobileNavOpen(true)}
            className={cn(
              "sm:hidden flex items-center justify-center",
              "w-10 h-10",
              "border-2 border-[color:var(--foreground)]",
              "bg-bg-secondary text-fg",
              "shadow-[2px_2px_0_var(--foreground)]",
              "active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
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
        "text-accent-foreground hover:text-slop-yellow transition-colors duration-200",
        "no-underline hover:no-underline",
        active && "text-slop-yellow"
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
