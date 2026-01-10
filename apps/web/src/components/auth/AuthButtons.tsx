"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useLoginModal } from "@/hooks/useLoginModal";

export function AuthButtons() {
  const { data: session, isPending } = useSession();
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

  if (isPending) {
    return (
      <div className="auth-buttons">
        <div className="auth-loading-placeholder" />
      </div>
    );
  }

  if (session?.user) {
    const isAdmin = session.user.role === "admin";
    const isMod = session.user.role === "mod";
    const showAdminLink = isAdmin || isMod;

    return (
      <div className="auth-buttons" ref={dropdownRef}>
        <button
          className="user-menu-trigger"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <Avatar
            src={session.user.image}
            alt={session.user.name}
            size="sm"
          />
          <span className="user-name">{session.user.name}</span>
          <ChevronIcon open={isDropdownOpen} />
        </button>

        {isDropdownOpen && (
          <div className="user-dropdown">
            <Link
              href="/favorites"
              className="user-dropdown-item"
              onClick={() => setIsDropdownOpen(false)}
            >
              <HeartIcon />
              Favorites
            </Link>
            <Link
              href="/settings"
              className="user-dropdown-item"
              onClick={() => setIsDropdownOpen(false)}
            >
              <SettingsIcon />
              Settings
            </Link>
            {showAdminLink && (
              <Link
                href="/admin"
                className="user-dropdown-item"
                onClick={() => setIsDropdownOpen(false)}
              >
                <ShieldIcon />
                {isAdmin ? "Admin" : "Mod Queue"}
              </Link>
            )}
            <div className="user-dropdown-divider" />
            <button
              className="user-dropdown-item"
              onClick={() => {
                setIsDropdownOpen(false);
                signOut();
              }}
            >
              <LogoutIcon />
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth-buttons">
      <Button variant="primary" onClick={openLoginModal}>
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
