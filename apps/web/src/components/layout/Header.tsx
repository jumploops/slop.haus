"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { MobileNav } from "./MobileNav";

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="header">
      <div className="container">
        <Link href="/" className="logo">
          slop.haus
        </Link>

        <nav className="nav">
          <Link href="/">Feed</Link>
          <Link href="/submit">Submit</Link>
          {session?.user && <Link href="/favorites">Favorites</Link>}
          {session?.user && <Link href="/settings/profile">Settings</Link>}
          {session?.user && (session.user.role === "admin" || session.user.role === "mod") && (
            <Link href="/admin/mod-queue">Admin</Link>
          )}
        </nav>

        <div className="header-right">
          <AuthButtons />
          <button
            className="mobile-nav-trigger"
            onClick={() => setMobileNavOpen(true)}
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

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
