"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import { LobbyAccessDTO, LobbyCodeDTO } from "@/types/lobby";
import { useApi } from "@/hooks/useApi";

function SBBCross({ size = 20 }: { size?: number }) {
  return (
      <svg width={size} height={size} viewBox="0 0 22 22" fill="#ffffff" aria-hidden="true">
        <rect x="7" y="0" width="8" height="22" rx="1" />
        <rect x="0" y="7" width="22" height="8" rx="1" />
      </svg>
  );
}

export default function Navbar() {
  // COMBINED: Only call useAuth once
  const { user, logout, isLoading, login, token } = useAuth();

  const pathname = usePathname();
  const router = useRouter();
  const apiService = useApi();

  const [menuOpen, setMenuOpen] = useState(false);
  const [code, setCode] = useState("");
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(null);

  const onGameScreen = pathname?.startsWith("/game/") && !pathname?.endsWith("/leaderboard");

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  async function performCodeJoin(joinCode: string, overrideCredentials?: { userId: number; token: string }) {
    const effectiveUserId = overrideCredentials?.userId ?? user?.userId ?? -1;
    const effectiveToken = overrideCredentials?.token ?? token ?? "";
    const lobbyCodeDTO: LobbyCodeDTO = { lobbyCode: joinCode };

    const response: LobbyAccessDTO = await apiService.post<LobbyAccessDTO>(
      `/lobbies/join/${joinCode}`,
      lobbyCodeDTO,
      {
        headers: {
          token: effectiveToken,
          userId: effectiveUserId.toString(),
        },
      }
    );

    await login(response.token, response.userId);
    router.push(`/lobbies/${response.lobbyId}`);
    setCode("");
  }

  async function handleCodeJoin() {
    const c = code.trim().toUpperCase();
    if (!c) return;

    if (!token) {
      setPendingJoinCode(c);
      setIsAuthModalVisible(true);
      return;
    }

    try {
      await performCodeJoin(c);
    } catch (error: unknown) {
      console.error("Failed to join lobby:", error);
    }
  }

  async function handleContinueAsGuest() {
    if (!pendingJoinCode) return;

    const codeToJoin = pendingJoinCode;
    setIsAuthModalVisible(false);
    setPendingJoinCode(null);

    try {
      await performCodeJoin(codeToJoin, { userId: -1, token: "" });
    } catch (error: unknown) {
      console.error("Guest join failed:", error);
    }
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
            <div className="navbar-col-left">
              <Link href="/" className="navbar-brand">
                <SBBCross size={20} />
                <span className="navbar-brand-text">
                Gues<span>SBB</span>
              </span>
              </Link>
            </div>

            <div className="navbar-col-center">
              <div className="sbb-pill-input">
               <span style={{ padding: "0 4px 0 14px", color: "var(--grey)", display: "flex" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20 L16.5 16.5" />
                </svg>
              </span>
                <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
                    onKeyDown={handleCodeKey}
                    placeholder="LOBBY-CODE"
                />
                <button type="button" onClick={handleCodeJoin}>Join</button>
              </div>
            </div>

            <div className="navbar-col-right">
              {!isLoading && (
                  <div className="navbar-nav">
                    <button className={`navbar-link ${isActive("/lobbies") ? "is-active" : ""}`} onClick={() => go("/lobbies")}>
                      Lobbies
                    </button>
                    <button className={`navbar-link ${isActive("/leaderboard") ? "is-active" : ""}`} onClick={() => go("/leaderboard")}>
                      Rangliste
                    </button>

                    {user ? (
                        <>
                          <button className={`navbar-link ${isActive(`/users/${user.userId}`) ? "is-active" : ""}`} onClick={() => go(`/users/${user.userId}`)}>
                            {user.username.length > 12 ? user.username.slice(0, 12) + "…" : user.username}
                          </button>
                          <button className="navbar-logout" onClick={logout}>Logout</button>
                        </>
                    ) : (
                        <button className="navbar-login" onClick={() => go("/login")}>Login</button>
                    )}
                  </div>
              )}

              <button
                  className={`navbar-burger ${menuOpen ? "is-open" : ""}`}
                  onClick={() => setMenuOpen((m) => !m)}
                  type="button"
              >
                <span /><span /><span />
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Drawer Logic follows the same cleanup... */}
        {menuOpen && (
            <div className="navbar-drawer">
              {/* ... Rest of your drawer code ... */}
            </div>
        )}

        {isAuthModalVisible && (
            <div className="sbb-modal-overlay" role="dialog" aria-modal="true" aria-label="Wie willst du spielen?">
              <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalVisible(false);
                    setPendingJoinCode(null);
                  }}
                  aria-label="Modal schliessen"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
              />
              <div className="sbb-modal" style={{ position: "relative", zIndex: 1 }}>
                <span className="label">Vor dem Start</span>
                <h2>Wie willst du spielen?</h2>
                <p className="sub">
                  Logg dich ein fur Statistiken & Rangliste - oder spring direkt als Gast rein.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                      type="button"
                      className="sbb-btn sbb-btn--primary sbb-btn--full"
                      onClick={() => {
                        setIsAuthModalVisible(false);
                        setPendingJoinCode(null);
                        router.push("/login");
                      }}
                  >
                    Einloggen
                  </button>
                  <button
                      type="button"
                      className="sbb-btn sbb-btn--secondary sbb-btn--full"
                      onClick={() => {
                        setIsAuthModalVisible(false);
                        setPendingJoinCode(null);
                        router.push("/register");
                      }}
                  >
                    Konto erstellen
                  </button>
                  <button
                      type="button"
                      onClick={handleContinueAsGuest}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--grey)",
                        background: "transparent",
                        border: "none",
                        padding: 12,
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginTop: 4,
                      }}
                  >
                    Als Gast weiterspielen
                  </button>
                </div>
              </div>
            </div>
        )}
      </>
  );
}