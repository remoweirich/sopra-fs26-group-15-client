"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";

// ─── SBB Cross logo ──────────────────────────────────────────────────────────
function SBBCross({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="#ffffff" aria-hidden="true">
      <rect x="7" y="0" width="8" height="22" rx="1" />
      <rect x="0" y="7" width="22" height="8" rx="1" />
    </svg>
  );
}

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [code, setCode] = useState("");

  // Hide navbar entirely on the in-game screen for a fullscreen experience
  const onGameScreen = pathname?.startsWith("/game/") && !pathname?.endsWith("/leaderboard");
  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function handleCodeJoin() {
    const c = code.trim();
    if (!c) return;
    // Try to navigate — the lobby room page handles 404 / invalid codes itself.
    router.push(`/lobbies/${c}`);
    setCode("");
  }

  function handleCodeKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleCodeJoin();
  }

  function isActive(href: string) {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function go(href: string) {
    setMenuOpen(false);
    router.push(href);
  }

  if (onGameScreen) return null;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-shell">
          {/* Left: brand */}
          <div className="navbar-col-left">
            <Link href="/" className="navbar-brand">
              <SBBCross size={20} />
              <span className="navbar-brand-text">
                Gues<span>SBB</span>
              </span>
            </Link>
          </div>

          {/* Center: lobby-code pill (desktop only) */}
          <div className="navbar-col-center">
            <div
              className="sbb-pill-input"
                          >
              <span
                aria-hidden="true"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px 0 14px",
                  color: "var(--grey)",
                  flexShrink: 0,
                }}
              >
                {/* Magnifier — inline SVG so it scales independently of
                    the surrounding font-size and renders crisply. */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20 L16.5 16.5" />
                </svg>
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
                onKeyDown={handleCodeKey}
                placeholder="LOBBY-CODE"
                aria-label="Lobby code"
              />
              <button type="button" onClick={handleCodeJoin}>
                Join
              </button>
            </div>
          </div>

          {/* Right: nav + auth */}
          <div className="navbar-col-right">
            {!isLoading && (
              <div className="navbar-nav">
                <button
                  className={`navbar-link ${isActive("/lobbies") ? "is-active" : ""}`}
                  onClick={() => go("/lobbies")}
                >
                  Züge
                </button>
                <button
                  className={`navbar-link ${isActive("/leaderboard") ? "is-active" : ""}`}
                  onClick={() => go("/leaderboard")}
                >
                  Rangliste
                </button>

                {user ? (
                  <>
                    <button
                      className={`navbar-link ${isActive(`/users/${user.userId}`) ? "is-active" : ""}`}
                      onClick={() => go(`/users/${user.userId}`)}
                    >
                      {user.username.length > 12
                        ? user.username.slice(0, 12) + "…"
                        : user.username}
                    </button>
                    <button className="navbar-logout" onClick={logout}>
                      Logout
                    </button>
                  </>
                ) : (
                  <button className="navbar-login" onClick={() => go("/login")}>
                    Login
                  </button>
                )}
              </div>
            )}

            <button
              className={`navbar-burger ${menuOpen ? "is-open" : ""}`}
              aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((m) => !m)}
              type="button"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="navbar-drawer">
          <button
            type="button"
            className="navbar-drawer-backdrop"
            onClick={() => setMenuOpen(false)}
            aria-label="Menü schließen"
          />
          <div className="navbar-drawer-panel">
            {/* Lobby code search */}
            <div className="navbar-drawer-section">
              <div className="navbar-drawer-label">Lobby-Code eingeben</div>
              <div className="sbb-pill-input">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
                  onKeyDown={handleCodeKey}
                  placeholder="A1B2"
                  style={{ width: "auto", flex: 1 }}
                />
                <button type="button" onClick={handleCodeJoin}>
                  Join
                </button>
              </div>
            </div>

            <button
              className={`navbar-drawer-link ${isActive("/lobbies") ? "is-active" : ""}`}
              onClick={() => go("/lobbies")}
            >
              Züge
            </button>
            <button
              className={`navbar-drawer-link ${isActive("/leaderboard") ? "is-active" : ""}`}
              onClick={() => go("/leaderboard")}
            >
              Rangliste
            </button>

            <div className="navbar-drawer-divider" />

            {!isLoading && user && (
              <>
                <button
                  className={`navbar-drawer-link ${isActive(`/users/${user.userId}`) ? "is-active" : ""}`}
                  onClick={() => go(`/users/${user.userId}`)}
                >
                  {user.username}
                </button>
                <button
                  className="navbar-drawer-link navbar-drawer-link--muted"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  Logout
                </button>
              </>
            )}

            {!isLoading && !user && (
              <>
                <button
                  className="navbar-drawer-link"
                  onClick={() => go("/login")}
                >
                  Login
                </button>
                <button
                  className="navbar-drawer-link navbar-drawer-link--primary"
                  onClick={() => go("/register")}
                >
                  Registrieren
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
