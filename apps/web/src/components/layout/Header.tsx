"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { MobileNav } from "./MobileNav";
import { useSlopMode } from "@/lib/slop-mode";

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const { enabled: slopEnabled } = useSlopMode();

  return (
    <header className="sticky top-0 z-50 border-b-2 border-dashed border-border bg-card">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="group flex items-baseline gap-0 no-underline hover:no-underline">
          <span
            className={cn(
              "font-display font-normal tracking-tight text-slop-green transition-transform group-hover:-rotate-2",
              "leading-[2.5rem]",
              slopEnabled ? "text-4xl" : "text-3xl"
            )}
          >
            slop
          </span>
          <span className="font-mono text-2xl font-black text-foreground">.</span>
          <span className="brick-text font-haus text-3xl font-normal tracking-tight">haus</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <nav className="hidden sm:flex items-center gap-6 pr-4">
            <NavLink href="/" active={pathname === "/"}>
              New
            </NavLink>
            <NavLink href="/submit" active={pathname === "/submit"}>
              Submit
            </NavLink>
          </nav>
          <div className="hidden sm:block">
            <AuthButtons />
          </div>
          <button
            onClick={() => setMobileNavOpen(true)}
            className={cn(
              "sm:hidden flex items-center justify-center",
              "h-10 w-10",
              "border-2 border-dashed border-border",
              "bg-muted text-foreground",
              "transition-transform active:translate-x-[1px] active:translate-y-[1px]"
            )}
            aria-label="Open navigation"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <MobileNav isOpen={mobileNavOpen} onClose={closeMobileNav} />
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
        "font-mono text-sm uppercase tracking-wide text-muted-foreground transition-colors",
        "no-underline hover:no-underline hover:text-primary",
        active && "text-primary"
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
