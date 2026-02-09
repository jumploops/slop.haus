"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useSlopMode } from "@/lib/slop-mode";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const { theme, setTheme } = useTheme();
  const { enabled: slopEnabled, toggle: toggleSlop } = useSlopMode();
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const isAdmin = session?.user?.role === "admin";
  const isMod = session?.user?.role === "mod";
  const showAdminLink = isAdmin || isMod;
  const themeLabel = mounted ? getThemeLabel(theme) : "System";
  const slopLabel = slopEnabled ? "On" : "Off";

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-overlay z-[100]",
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
          "bg-card border-l-2 border-border z-[101]",
          "flex flex-col",
          "transform transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-dashed border-border">
          <span className="flex items-baseline gap-0">
            <span className="font-display text-xl font-normal tracking-tight text-slop-green">slop</span>
            <span className="font-mono text-lg font-black text-foreground">.</span>
            <span className="brick-text font-haus text-xl font-normal tracking-tight">haus</span>
          </span>
          <button
            onClick={onClose}
            className={cn(
              "flex items-center justify-center w-8 h-8",
              "border-2 border-dashed border-border",
              "bg-muted text-foreground",
              "active:translate-x-[1px] active:translate-y-[1px]"
            )}
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
            <>
              <MobileNavLink href="/favorites" active={pathname === "/favorites"}>
                Favorites
              </MobileNavLink>
              <MobileNavLink href="/my/projects" active={pathname === "/my/projects"}>
                My Projects
              </MobileNavLink>
              <MobileNavLink href="/settings" active={pathname === "/settings"}>
                Settings
              </MobileNavLink>
              {showAdminLink && (
                <MobileNavLink href="/admin" active={pathname?.startsWith("/admin") ?? false}>
                  {isAdmin ? "Admin" : "Mod Queue"}
                </MobileNavLink>
              )}
            </>
          )}
        </div>

        {/* Auth section */}
        <div className="p-4 border-t-2 border-dashed border-border flex flex-col gap-3">
          {isPending ? (
            <span className="text-muted-foreground text-sm">Loading...</span>
          ) : session?.user ? (
            <>
              <span className="text-sm text-muted-foreground truncate">
                {session.user.username || "User"}
              </span>
              <Button
                variant="secondary"
                onClick={cycleTheme}
                className="w-full justify-between"
              >
                <span>Theme</span>
                <span className="text-[10px] uppercase tracking-wide">{themeLabel}</span>
              </Button>
              <Button
                variant="secondary"
                onClick={toggleSlop}
                className="w-full justify-between"
              >
                <span>Slop Mode</span>
                <span className="text-[10px] uppercase tracking-wide">{slopLabel}</span>
              </Button>
              <Button variant="secondary" onClick={() => signOut()} className="w-full">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                onClick={() => signIn.social({ provider: "github" })}
                className="w-full"
              >
                Sign in with GitHub
              </Button>
              <Button
                variant="secondary"
                onClick={() => signIn.social({ provider: "google" })}
                className="w-full"
              >
                Sign in with Google
              </Button>
            </>
          )}
        </div>
      </nav>
    </>
  );
}

function getThemeLabel(theme?: string) {
  if (theme === "light") return "Light";
  if (theme === "dark") return "Dark";
  return "System";
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
        "block px-4 py-2 font-mono text-sm uppercase tracking-wide transition-colors",
        "border-2 border-border bg-card",
        "no-underline hover:no-underline",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-primary"
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
