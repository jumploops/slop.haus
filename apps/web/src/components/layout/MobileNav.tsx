"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="mobile-nav-overlay" onClick={onClose} />
      <nav className="mobile-nav">
        <div className="mobile-nav-header">
          <span className="logo">slop.haus</span>
          <button className="mobile-nav-close" onClick={onClose} aria-label="Close navigation">
            <CloseIcon />
          </button>
        </div>

        <div className="mobile-nav-links">
          <Link href="/" className={cn("mobile-nav-link", pathname === "/" && "active")}>
            Feed
          </Link>
          <Link href="/submit" className={cn("mobile-nav-link", pathname === "/submit" && "active")}>
            Submit
          </Link>
          {session?.user && (
            <Link
              href="/favorites"
              className={cn("mobile-nav-link", pathname === "/favorites" && "active")}
            >
              Favorites
            </Link>
          )}
          {session?.user && (
            <Link
              href="/settings/profile"
              className={cn("mobile-nav-link", pathname.startsWith("/settings") && "active")}
            >
              Settings
            </Link>
          )}
          {session?.user && (session.user.role === "admin" || session.user.role === "mod") && (
            <Link
              href="/admin"
              className={cn("mobile-nav-link", pathname.startsWith("/admin") && "active")}
            >
              Admin
            </Link>
          )}
        </div>

        <div className="mobile-nav-auth">
          {isPending ? (
            <span className="text-muted">Loading...</span>
          ) : session?.user ? (
            <>
              <span className="mobile-nav-user">{session.user.name}</span>
              <button onClick={() => signOut()} className="btn btn-secondary">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => signIn.social({ provider: "github" })}
                className="btn btn-primary"
              >
                Sign in with GitHub
              </button>
              <button
                onClick={() => signIn.social({ provider: "google" })}
                className="btn btn-secondary"
              >
                Sign in with Google
              </button>
            </>
          )}
        </div>
      </nav>
    </>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
