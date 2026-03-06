"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Droplet, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "@/lib/auth-client";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useLoginModal } from "@/hooks/useLoginModal";
import { useIsClient } from "@/hooks/useIsClient";
import { useSlopMode } from "@/lib/slop-mode";

export function AuthButtons() {
  const { data: session, isPending } = useSession();
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();
  const { enabled: slopEnabled, toggle: toggleSlop } = useSlopMode();
  const { openLoginModal } = useLoginModal();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const themeLabel = isClient ? getThemeLabel(theme) : "System";
  const slopLabel = slopEnabled ? "On" : "Off";
  const isRegisteredUser = Boolean(session?.user && !session.user.isAnonymous);

  if (isPending) {
    return (
      <div className="relative">
        <div className="w-8 h-8" />
      </div>
    );
  }

  if (isRegisteredUser && session?.user) {
    const isAdmin = session.user.role === "admin";
    const isMod = session.user.role === "mod";
    const showAdminLink = isAdmin || isMod;

    return (
      <div className="relative" ref={dropdownRef}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="px-2 py-1"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <Avatar
            src={session.user.image ?? null}
            alt={session.user.username ?? "User"}
            size="sm"
          />
          <ChevronIcon open={isDropdownOpen} />
        </Button>

        {isDropdownOpen && (
          <div className="absolute top-[calc(100%+0.5rem)] right-0 min-w-[180px] border-2 border-dashed border-border bg-card z-[1000]">
            <div className="flex flex-col">
              <Link
                href="/favorites"
                className="flex items-center gap-2 w-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground no-underline transition-colors hover:bg-muted hover:text-primary"
                onClick={() => setIsDropdownOpen(false)}
              >
                <HeartIcon />
                Favorites
              </Link>
              <Link
                href="/my/projects"
                className="flex items-center gap-2 w-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground no-underline transition-colors hover:bg-muted hover:text-primary"
                onClick={() => setIsDropdownOpen(false)}
              >
                <FolderIcon />
                My Projects
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 w-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground no-underline transition-colors hover:bg-muted hover:text-primary"
                onClick={() => setIsDropdownOpen(false)}
              >
                <SettingsIcon />
                Settings
              </Link>
              <button
                type="button"
                onClick={cycleTheme}
                className="flex items-center justify-between gap-2 w-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground bg-transparent border-none cursor-pointer transition-colors hover:bg-muted hover:text-primary"
              >
                <span className="flex items-center gap-2">
                  <ThemeIcon theme={theme} />
                  Theme
                </span>
                <span className="text-[10px]">{themeLabel}</span>
              </button>
              <button
                type="button"
                onClick={toggleSlop}
                className="flex items-center justify-between gap-2 w-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground bg-transparent border-none cursor-pointer transition-colors hover:bg-muted hover:text-primary"
              >
                <span className="flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  Slop Mode
                </span>
                <span className="text-[10px]">{slopLabel}</span>
              </button>
              {showAdminLink && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground no-underline transition-colors hover:bg-muted hover:text-primary"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <ShieldIcon />
                  {isAdmin ? "Admin" : "Mod Queue"}
                </Link>
              )}
              <div className="h-px bg-border" />
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground bg-transparent border-none cursor-pointer text-left transition-colors hover:bg-muted hover:text-primary"
                onClick={() => {
                  setIsDropdownOpen(false);
                  signOut();
                }}
              >
                <LogoutIcon />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button variant="primary" onClick={openLoginModal} className="cursor-pointer">
        Sign In
      </Button>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="currentColor"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
    >
      <path d="M2.5 4.5L6 8L9.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 13.5l-1.2-1.1C3.4 9.4 1.5 7.6 1.5 5.4 1.5 3.6 2.9 2 4.6 2c1 0 2 .5 2.6 1.2h.6C8.4 2.5 9.4 2 10.4 2c1.7 0 3.1 1.6 3.1 3.4 0 2.2-1.9 4-5.3 7L8 13.5z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" />
      <path fillRule="evenodd" d="M6.5 1.5a1.5 1.5 0 00-1.415 1H4a2 2 0 00-2 2v.085A1.5 1.5 0 001 6v4a1.5 1.5 0 001 1.415V12a2 2 0 002 2h1.085A1.5 1.5 0 006.5 15h3a1.5 1.5 0 001.415-1H12a2 2 0 002-2v-.585A1.5 1.5 0 0015 10V6a1.5 1.5 0 00-1-1.415V4.5a2 2 0 00-2-2h-.085A1.5 1.5 0 0010.5 1.5h-4zM4.5 4.5h7v7h-7v-7z" clipRule="evenodd" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.5 4A1.5 1.5 0 013 2.5h3l1.5 1.5H13A1.5 1.5 0 0114.5 5.5v6A1.5 1.5 0 0113 13H3A1.5 1.5 0 011.5 11.5v-7zM3 4a.5.5 0 00-.5.5v7a.5.5 0 00.5.5h10a.5.5 0 00.5-.5v-6a.5.5 0 00-.5-.5H6.5L5 3H3z" />
    </svg>
  );
}

function ThemeIcon({ theme }: { theme?: string }) {
  if (theme === "light") {
    return <Sun className="h-4 w-4" />;
  }
  if (theme === "dark") {
    return <Moon className="h-4 w-4" />;
  }
  return <Monitor className="h-4 w-4" />;
}

function getThemeLabel(theme?: string) {
  if (theme === "light") return "Light";
  if (theme === "dark") return "Dark";
  return "System";
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" d="M8 1l6 2v5c0 3.5-2.5 6-6 7-3.5-1-6-3.5-6-7V3l6-2zm0 1.5L3 4.2v4.3c0 2.8 2 4.8 5 5.7 3-.9 5-2.9 5-5.7V4.2L8 2.5z" clipRule="evenodd" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6 2a1 1 0 00-1 1v2a1 1 0 002 0V4h5v8H7v-1a1 1 0 00-2 0v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1H6z" />
      <path d="M4.854 5.146a.5.5 0 010 .708L3.207 7.5H9.5a.5.5 0 010 1H3.207l1.647 1.646a.5.5 0 01-.708.708l-2.5-2.5a.5.5 0 010-.708l2.5-2.5a.5.5 0 01.708 0z" />
    </svg>
  );
}
