"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import { LobbyAccessDTO, LobbyCodeDTO } from "@/types/lobby";
import { useApi } from "@/hooks/useApi";
import { useNotifications } from "@/context/NotificationContext";
import type { AppNotification } from "@/context/NotificationContext";
import { App as AntdApp, Image } from "antd";
import { getApiDomain } from "@/utils/domain";

const backendBase = getApiDomain();

function SBBCross({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="#ffffff" aria-hidden="true">
      <rect x="7" y="0" width="8" height="22" rx="1" />
      <rect x="0" y="7" width="22" height="8" rx="1" />
    </svg>
  );
}

export default function Navbar() {
  const { user, logout, isLoading, login, token } = useAuth();
  const isLoggedIn = !!user;
  const pathname = usePathname();
  const router = useRouter();
  const apiService = useApi();
  const { notification } = AntdApp.useApp();

  const [menuOpen, setMenuOpen] = useState(false);
  const [code, setCode] = useState("");
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  const { notifications, unreadCount, dismiss: dismissNotif, clearInfoNotifications, bumpFriendsVersion, } = useNotifications();

  const handleAcceptFriend = async (notif: AppNotification) => {
    if (notif.type !== "friend_request") return;
    try {
      await apiService.post(
        `/friends/accept/${notif.fromId}`,
        {},
        { headers: { userId: user?.userId.toString() ?? "", token: token ?? "" } }
      );

      dismissNotif(notif.id);
      notification.destroy(notif.id);
      bumpFriendsVersion();
    } catch (error) {
      console.error("Error when accepting request from bell:", error);
    }
  };

  const handleRejectFriend = async (notif: AppNotification) => {
    if (notif.type !== "friend_request") return;

    try {
      await apiService.post(
        `/friends/reject/${notif.fromId}`,
        {},
        { headers: { userId: user?.userId.toString() ?? "", token: token ?? "" } }
      );

      dismissNotif(notif.id);
      notification.destroy(notif.id);
      bumpFriendsVersion();
    } catch (error) {
      console.error("Error when rejecting request from bell:", error);
    }
  };

  const formatTime = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "gerade eben";
    if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`;
    if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`;
    return date.toLocaleDateString("de-CH", { day: "numeric", month: "short" });
  };

  const onGameScreen = pathname?.startsWith("/game/") && !pathname?.endsWith("/leaderboard");

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  async function performCodeJoin(joinCode: string, overrideCredentials?: { userId: number; token: string }) {
    const effectiveUserId = overrideCredentials?.userId ?? user?.userId ?? -1;
    const effectiveToken = overrideCredentials?.token ?? token ?? "";
    const lobbyCodeDTO: LobbyCodeDTO = { lobbyCode: joinCode };

    try {
      const response: LobbyAccessDTO = await apiService.post<LobbyAccessDTO>(
        `/lobbies/join/${joinCode}`, lobbyCodeDTO,
        { headers: { token: effectiveToken, userId: effectiveUserId.toString() } }
      );
      await login(response.token, response.userId);
      router.push(`/lobbies/${response.lobbyId}`);
      setCode("");
    } catch (error: unknown) {
      console.error(error);
      notification.error({
        title: "Lobby Not Found",
        description: `Bitte überprüfe den Code und versuche es erneut.`,
        placement: "topRight",
        duration: 4,
      });
    }
  }

  async function handleCodeJoin() {
    const c = code.trim().toUpperCase();
    if (!c) return;
    if (!isLoggedIn) { setPendingJoinCode(c); setIsAuthModalVisible(true); return; }
    try { await performCodeJoin(c); } catch (error: unknown) { console.error("Failed to join lobby:", error); }
  }

  async function handleContinueAsGuest() {
    if (!pendingJoinCode) return;
    const codeToJoin = pendingJoinCode;
    setIsAuthModalVisible(false);
    setPendingJoinCode(null);
    try { await performCodeJoin(codeToJoin, { userId: -1, token: "" }); } catch (error: unknown) { console.error("Guest join failed:", error); }
  }

  function handleCodeKey(e: React.KeyboardEvent<HTMLInputElement>) { if (e.key === "Enter") handleCodeJoin(); }
  function isActive(href: string) { if (!pathname) return false; return pathname === href || pathname.startsWith(href + "/"); }
  function go(href: string) { setMenuOpen(false); setNotifOpen(false); router.push(href); }

  if (onGameScreen) return null;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-shell">
          <div className="navbar-col-left">
            <Link href="/" className="navbar-brand">
              <SBBCross size={20} />
              <span className="navbar-brand-text">Gues<span>SBB</span></span>
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
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))} onKeyDown={handleCodeKey} placeholder="LOBBY-CODE" />
              <button type="button" onClick={handleCodeJoin}>Join</button>
            </div>
          </div>

          <div className="navbar-col-right">
            {!isLoading && (
              <div className="navbar-nav">

                {/* ── Notification bell ─────────────────────────────── */}
                {user && (
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      className="navbar-notif-btn"
                      onClick={() => {
                        setNotifOpen((o) => {
                          if (o) clearInfoNotifications();
                          return !o;
                        });
                      }}
                      aria-label="Benachrichtigungen"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                      {unreadCount > 0 && <span className="navbar-notif-badge">{unreadCount}</span>}
                    </button>

                    {notifOpen && (
                      <>
                        <button
                          type="button"
                          className="navbar-notif-backdrop"
                          onClick={() => {
                            clearInfoNotifications();
                            setNotifOpen(false);
                          }}
                          aria-label="Schliessen"
                        />
                        <div className="navbar-notif-dropdown">
                          <div className="navbar-notif-head">
                            <span className="navbar-notif-head-title">Benachrichtigungen</span>
                            {unreadCount > 0 && <span className="navbar-notif-count">{unreadCount}</span>}
                          </div>

                          {notifications.length === 0 ? (
                            <div className="navbar-notif-empty">Keine Benachrichtigungen</div>
                          ) : (
                            notifications.map((n) => (
                              <div key={n.id} className="navbar-notif-item">

                                {n.type === "friend_request" && (
                                  <>
                                    <div className="navbar-notif-icon navbar-notif-icon--friend">👤</div>
                                    <div className="navbar-notif-info">
                                      <div className="navbar-notif-text" onClick={() => { go(`/users/${user?.userId}?tab=friends`); }} style={{ cursor: "pointer" }}>
                                        <strong>{n.from}</strong> möchte dein Freund sein
                                      </div>
                                      <div className="navbar-notif-actions">
                                        <button type="button" className="navbar-notif-accept" aria-label="Annehmen" onClick={() => handleAcceptFriend(n as AppNotification & { type: "friend_request" })}>✓</button>
                                        <button type="button" className="navbar-notif-reject" aria-label="Ablehnen" onClick={() => handleRejectFriend(n as AppNotification & { type: "friend_request" })}>✕</button>
                                      </div>
                                      <div className="navbar-notif-time">{formatTime(n.time)}</div>
                                    </div>
                                  </>
                                )}

                                {n.type === "friend_accepted" && (
                                  <>
                                    <div className="navbar-notif-icon navbar-notif-icon--info">✓</div>
                                    <div className="navbar-notif-info" onClick={() => go(`/users/${user?.userId}?tab=friends`)} style={{ cursor: "pointer" }}>
                                      <div className="navbar-notif-text"><strong>{n.from}</strong> hat deine Freundschaftsanfrage angenommen</div>
                                      <div className="navbar-notif-time">{formatTime(n.time)}</div>
                                    </div>
                                  </>
                                )}

                                {n.type === "friend_rejected" && (
                                  <>
                                    <div className="navbar-notif-icon navbar-notif-icon--info">–</div>
                                    <div className="navbar-notif-info" onClick={() => go(`/users/${user?.userId}?tab=friends`)} style={{ cursor: "pointer" }}>
                                      <div className="navbar-notif-text"><strong>{n.from}</strong> hat deine Freundschaftsanfrage abgelehnt</div>
                                      <div className="navbar-notif-time">{formatTime(n.time)}</div>
                                    </div>
                                  </>
                                )}

                                {n.type === "achievement" && (
                                  <>
                                    <Image src={`${backendBase}${n.iconUrl}`} alt={n.name} style={{ width: 24, height: 24 }} />
                                    <div className="navbar-notif-info" onClick={() => go(`/users/${user?.userId}?tab=achievements`)} style={{ cursor: "pointer" }}>
                                      <div className="navbar-notif-text">Achievement freigeschaltet: <strong>{n.name}</strong></div>
                                      <div className="navbar-notif-time">{formatTime(n.time)}</div>
                                    </div>
                                  </>
                                )}
                                
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <button className={`navbar-link ${isActive("/lobbies") ? "is-active" : ""}`} onClick={() => go("/lobbies")}>Lobbies</button>
                <button className={`navbar-link ${isActive("/leaderboard") ? "is-active" : ""}`} onClick={() => go("/leaderboard")}>Rangliste</button>

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

            <button className={`navbar-burger ${menuOpen ? "is-open" : ""}`} onClick={() => setMenuOpen((m) => !m)} type="button">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="navbar-drawer">
          <button type="button" className="navbar-drawer-backdrop" onClick={() => setMenuOpen(false)} />
          <div className="navbar-drawer-panel">
            <div className="navbar-drawer-section">
              <button className="navbar-drawer-link" onClick={() => go("/lobbies")}>Lobbies</button>
              <button className="navbar-drawer-link" onClick={() => go("/leaderboard")}>Rangliste</button>
              {user && <button className="navbar-drawer-link" onClick={() => go(`/users/${user.userId}`)}>Profil</button>}
            </div>
            <div className="navbar-drawer-section">
              {user ? (
                <button className="navbar-drawer-link navbar-drawer-link--muted" onClick={logout}>Logout</button>
              ) : (
                <button className="navbar-drawer-link--primary navbar-drawer-link" onClick={() => go("/login")}>Login</button>
              )}
            </div>
          </div>
        </div>
      )}

      {isAuthModalVisible && (
        <div className="sbb-modal-overlay" role="dialog" aria-modal="true" aria-label="Wie willst du spielen?">
          <button type="button" onClick={() => { setIsAuthModalVisible(false); setPendingJoinCode(null); }} aria-label="Modal schliessen" style={{ position: "absolute", inset: 0, background: "transparent", border: "none", cursor: "pointer" }} />
          <div className="sbb-modal" style={{ position: "relative", zIndex: 1 }}>
            <span className="label">Vor dem Start</span>
            <h2>Wie willst du spielen?</h2>
            <p className="sub">Logg dich ein für Statistiken & Rangliste — oder spring direkt als Gast rein.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button type="button" className="sbb-btn sbb-btn--primary sbb-btn--full" onClick={() => { setIsAuthModalVisible(false); setPendingJoinCode(null); router.push("/login"); }}>Einloggen</button>
              <button type="button" className="sbb-btn sbb-btn--secondary sbb-btn--full" onClick={() => { setIsAuthModalVisible(false); setPendingJoinCode(null); router.push("/register"); }}>Konto erstellen</button>
              <button type="button" onClick={handleContinueAsGuest} style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--grey)", background: "transparent", border: "none", padding: 12, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>Als Gast weiterspielen</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}