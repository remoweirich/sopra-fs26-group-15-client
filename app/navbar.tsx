"use client";

/**
 * Navbar — fixed-top SBB-style red bar.
 *
 * Three states:
 *   1) Logged out          → Login + Registrieren CTA
 *   2) Guest (temporary)   → username + Registrieren CTA + Logout
 *   3) Registered          → username + Logout
 *
 * Guest detection: relies on `user.isGuest === true`. If your AuthContext
 * uses a different flag (e.g. discriminating via `"email" in user`), update
 * the `isGuest` line below.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "antd";
import { Bell, LogOut, Search, Menu, X } from "lucide-react";
import { useAuth } from "./context/AuthContext";

// ── SBB-style cross logo (white) ─────────────────────────────────────
function SBBCross({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="#FFFFFF" aria-hidden="true">
      <rect x="7" y="0" width="8" height="22" rx="1" />
      <rect x="0" y="7" width="22" height="8" rx="1" />
    </svg>
  );
}

export default function Navbar() {
  const [notificationCount] = useState(0); // TODO: wire to real notification source
  const [menuOpen, setMenuOpen] = useState(false);
  const [lobbyCode, setLobbyCode] = useState("");

  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  // Guest detection — adjust this if your AuthContext uses a different flag.
  const isGuest = (user as { isGuest?: boolean } | null)?.isGuest === true;

  // ── Effects ─────────────────────────────────────────────────────────
  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // ── Handlers ────────────────────────────────────────────────────────
  function handleLobbyJoin() {
    const code = lobbyCode.trim().toUpperCase();
    if (!code) return;
    setLobbyCode("");
    setMenuOpen(false);
    router.push(`/lobbies/${code}`);
  }

  function handleLobbySearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleLobbyJoin();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  function go(href: string) {
    setMenuOpen(false);
    router.push(href);
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <>
      <nav className="gs-topbar">
        <div className="gs-topbar-inner">

          {/* ── Left: Brand ── */}
          <div className="gs-topbar-col gs-topbar-col--left">
            <Link href="/" className="gs-topbar-brand">
              <SBBCross size={20} />
              <span className="gs-topbar-brand-text">
                Gues<span>SBB</span>
              </span>
            </Link>
          </div>

          {/* ── Center: Lobby code search ── */}
          <div className="gs-topbar-col gs-topbar-col--center">
            <div className="gs-topbar-search">
              <span className="gs-topbar-search-icon" aria-hidden="true">🔍</span>
              <input
                className="gs-topbar-search-input"
                placeholder="LOBBY-CODE"
                value={lobbyCode}
                onChange={e => setLobbyCode(e.target.value.toUpperCase().slice(0, 6))}
                onKeyDown={handleLobbySearchKey}
                aria-label="Lobby code"
              />
              <button
                type="button"
                className="gs-topbar-search-btn"
                onClick={handleLobbyJoin}
              >
                Join
              </button>
            </div>
          </div>

          {/* ── Right: Actions ── */}
          {!isLoading && (
            <div className="gs-topbar-col gs-topbar-col--right">
              <div className="gs-topbar-actions">

                {/* Notifications bell — only for logged-in users */}
                {user && (
                  <Badge count={notificationCount} size="small" offset={[4, -2]}>
                    <button
                      type="button"
                      className="gs-topbar-iconbtn"
                      aria-label="Benachrichtigungen"
                    >
                      <Bell size={18} />
                    </button>
                  </Badge>
                )}

                <Link
                  href="/lobbies"
                  className={"gs-topbar-link " + (isActive("/lobbies") ? "gs-topbar-link--active" : "")}
                >
                  Züge
                </Link>

                <Link
                  href="/leaderboard"
                  className={"gs-topbar-link " + (isActive("/leaderboard") ? "gs-topbar-link--active" : "")}
                >
                  Rangliste
                </Link>

                {user ? (
                  <>
                    <Link
                      href={`/users/${user.userId}`}
                      className={"gs-topbar-link " + (isActive(`/users/${user.userId}`) ? "gs-topbar-link--active" : "")}
                      title={user.username}
                    >
                      {user.username.length > 12 ? user.username.slice(0, 12) + "…" : user.username}
                    </Link>

                    {/* Guest sees Registrieren CTA — encourages account upgrade */}
                    {isGuest && (
                      <Link href="/register" className="gs-topbar-cta">
                        Registrieren
                      </Link>
                    )}

                    <button
                      type="button"
                      className="gs-topbar-iconbtn"
                      onClick={logout}
                      aria-label="Logout"
                      title="Abmelden"
                    >
                      <LogOut size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className={"gs-topbar-link " + (isActive("/login") ? "gs-topbar-link--active" : "")}
                    >
                      Login
                    </Link>
                    <Link href="/register" className="gs-topbar-cta">
                      Registrieren
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Burger button (visible on mobile) ── */}
          <button
            type="button"
            className="gs-topbar-burger"
            aria-label={menuOpen ? "Menü schliessen" : "Menü öffnen"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu overlay ─────────────────────────────────────── */}
      {menuOpen && (
        <div className="gs-mobile-menu">

          {/* Mobile lobby search */}
          <div className="gs-mobile-menu-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="text"
              placeholder="LOBBY-CODE"
              value={lobbyCode}
              onChange={e => setLobbyCode(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={handleLobbySearchKey}
              aria-label="Lobby code"
            />
            <button type="button" onClick={handleLobbyJoin}>Join</button>
          </div>

          <button type="button" className="gs-mobile-menu-link" onClick={() => go("/lobbies")}>
            🚂 Züge
          </button>
          <button type="button" className="gs-mobile-menu-link" onClick={() => go("/leaderboard")}>
            🏆 Rangliste
          </button>

          <div className="gs-mobile-menu-divider" />

          {!isLoading && user && (
            <>
              <button
                type="button"
                className="gs-mobile-menu-link"
                onClick={() => go(`/users/${user.userId}`)}
              >
                👤 {user.username}
              </button>
              {isGuest && (
                <button
                  type="button"
                  className="gs-mobile-menu-link gs-mobile-menu-link--cta"
                  onClick={() => go("/register")}
                >
                  Registrieren
                </button>
              )}
              <button
                type="button"
                className="gs-mobile-menu-link gs-mobile-menu-link--muted"
                onClick={() => { setMenuOpen(false); logout(); }}
              >
                Logout
              </button>
            </>
          )}

          {!isLoading && !user && (
            <>
              <button
                type="button"
                className="gs-mobile-menu-link"
                onClick={() => go("/login")}
              >
                Login
              </button>
              <button
                type="button"
                className="gs-mobile-menu-link gs-mobile-menu-link--cta"
                onClick={() => go("/register")}
              >
                Registrieren
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}