"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge, Input } from "antd";
/*import {
  BookOpen,
  Trophy,
  User,
  LogOut,
  Bell,
  Search,
} from "lucide-react";

To Do: Add icons

*/
// ---------------------------------------------------------------------------
// GuessSBB SVG logo mark (simplified train-pin icon)
// ---------------------------------------------------------------------------
function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#E30613" />
      <path
        d="M16 4C12.134 4 9 7.134 9 11c0 5.25 7 14 7 14s7-8.75 7-14c0-3.866-3.134-7-7-7z"
        fill="white"
      />
      <circle cx="16" cy="11" r="3" fill="#E30613" />
    </svg>
  );
}

// ---------------------------------------------------------------------------

interface NavbarProps {
  /** Pass to highlight the active link */
  currentUser?: { id: number; username: string } | null;
  notificationCount?: number;
  onLogout?: () => void;
}

export default function Navbar({
  currentUser,
  notificationCount = 0,
  onLogout,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLobbySearch(e: React.KeyboardEvent<HTMLInputElement>) {
    const value = (e.target as HTMLInputElement).value.trim();
    if (e.key === "Enter" && value) {
      router.push(`/lobbies/${value}`);
    }
  }

  function linkClass(href: string) {
    const active = pathname === href || pathname.startsWith(href + "/");
    return `navbar-link${active ? " active" : ""}`;
  }

  return (
    <nav className="navbar">
      {/* Brand */}
      <Link href="/" className="navbar-brand">
        <LogoMark />
        <span className="navbar-brand-text">
          Guess<span>SBB</span>
        </span>
      </Link>

      {/* Primary links */}
      <div className="navbar-links">
        <Badge count={notificationCount} size="small" offset={[4, -2]}>
          <button className="navbar-link" aria-label="Notifications">
          </button>
        </Badge>

        <Link href="/lobbies" className={linkClass("/lobbies")}>
          Lobby
        </Link>

        <Link href="/leaderboard" className={linkClass("/leaderboard")}>
          Leaderboard
        </Link>

        {currentUser && (
          <Link
            href={`/users/${currentUser.id}`}
            className={linkClass(`/users/${currentUser.id}`)}
          >
            
            {currentUser.username}
          </Link>
        )}
      </div>

      {/* Right side */}
      <div className="navbar-right">
        {onLogout && (
          <button
            className="navbar-link"
            onClick={onLogout}
            aria-label="Logout"
          >
            
          </button>
        )}

        <label className="navbar-lobby-search" htmlFor="lobby-id-search">
          
          <input
            id="lobby-id-search"
            placeholder="Enter Lobby ID"
            onKeyDown={handleLobbySearch}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 13,
              color: "var(--sbb-mid-gray)",
              width: "100%",
            }}
          />
        </label>
      </div>
    </nav>
  );
}