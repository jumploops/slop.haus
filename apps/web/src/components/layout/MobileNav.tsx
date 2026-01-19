"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

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

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-[100]",
          "transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out panel */}
      <nav
        className={cn(
          "fixed top-0 right-0 bottom-0 w-[280px] max-w-full",
          "bg-bg border-l border-border z-[101]",
          "flex flex-col",
          "transform transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-lg font-bold text-accent">slop.haus</span>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded text-muted hover:text-fg hover:bg-border transition-colors"
            aria-label="Close navigation"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          <MobileNavLink href="/" active={pathname === "/"}>
            Feed
          </MobileNavLink>
          <MobileNavLink href="/submit" active={pathname === "/submit"}>
            Submit
          </MobileNavLink>
          {session?.user && (
            <MobileNavLink href="/favorites" active={pathname === "/favorites"}>
              Favorites
            </MobileNavLink>
          )}
          {session?.user && (
            <MobileNavLink href="/my/projects" active={pathname.startsWith("/my/projects")}>
              My Projects
            </MobileNavLink>
          )}
          {session?.user && (
            <MobileNavLink href="/settings/profile" active={pathname.startsWith("/settings")}>
              Settings
            </MobileNavLink>
          )}
          {session?.user && (session.user.role === "admin" || session.user.role === "mod") && (
            <MobileNavLink href="/admin" active={pathname.startsWith("/admin")}>
              Admin
            </MobileNavLink>
          )}
        </div>

        {/* Auth section */}
        <div className="p-4 border-t border-border flex flex-col gap-3">
          {isPending ? (
            <span className="text-muted text-sm">Loading...</span>
          ) : session?.user ? (
            <>
              <span className="text-sm text-muted truncate">{session.user.name}</span>
              <Button variant="secondary" onClick={() => signOut()}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={() => signIn.social({ provider: "github" })}>
                Sign in with GitHub
              </Button>
              <Button variant="secondary" onClick={() => signIn.social({ provider: "google" })}>
                Sign in with Google
              </Button>
            </>
          )}
        </div>
      </nav>
    </>
  );
}

function MobileNavLink({
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
        "block px-4 py-3 rounded-md transition-colors",
        "hover:no-underline",
        active ? "bg-border text-accent" : "text-fg hover:bg-border"
      )}
    >
      {children}
    </Link>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
