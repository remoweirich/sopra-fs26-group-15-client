"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useWebSocket } from "@/context/WebSocketContext";
import { Lobby } from "@/types/lobby";
import { LobbyMessage } from "@/types/lobbyMessage";
import { useAuth } from "@/context/AuthContext";
import { UserAuthDTO } from "@/types/user";

type ConnStatus = "connected" | "connecting" | "disconnected";

/* Deterministic colour assignment for player avatars — same username always
   maps to the same colour across all clients viewing the lobby. */
const AVATAR_COLORS = [
  "#EB0000", "#3B7DD8", "#2D8C5C", "#D8932F",
  "#7B2CBF", "#16A085", "#B8336A", "#5D5C61",
];
const colorForName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const LobbyWaitPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const lobbyId = Number(params.id);
  const apiService = useApi();
  const webSocket = useWebSocket();
  const { user: currentUser, token, isLoading } = useAuth();

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const intentionalDisconnect = useRef<boolean>(false);

  // ── New UI state ─────────────────────────────────────────────────────
  const [cd, setCd] = useState<number | null>(null);          // countdown 3 → 2 → 1 → 0
  const [smartStart, setSmartStart] = useState(false);         // "not all connected" warning
  const [leaveConf, setLeaveConf] = useState(false);           // "transfer host" confirmation
  const [copied, setCopied] = useState(false);

  /* Per-player connection status keyed by username.
     CURRENT LIMITATION: UserDTO has only `username`, and the backend doesn't
     yet broadcast per-player connection status. Everyone defaults to
     "connected"; the current user's status is read live from `webSocket.isConnected`.
     When the backend starts including a status field on each user in the
     LOBBY_STATE payload, populate this map from there. */
  const [connStatus] = useState<Record<string, ConnStatus>>({});

  // ── Initial fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!lobbyId || !token || !currentUser) return;
    const fetchLobby = async () => {
      try {
        const response = await apiService.get<Lobby>(
          `/lobbies/${lobbyId}`,
          { headers: { userId: currentUser.userId.toString(), token } }
        );
        setLobby(response);
      } catch (e) {
        console.error("Fetch error:", e);
        router.push("/lobbies");
      }
    };
    fetchLobby();
  }, [lobbyId, token, currentUser, router, apiService]);

  // ── WebSocket connect ────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    if (!webSocket.isConnected && token && currentUser) {
      console.log("WebSocket nicht verbunden - starte Reconnect...");
      webSocket.connect(currentUser.userId.toString(), token);
    }
  }, [isLoading, webSocket.isConnected, token, currentUser, webSocket]);

  // ── WebSocket subscribe ──────────────────────────────────────────────
  useEffect(() => {
    if (!webSocket.isConnected || !lobbyId) return;
    const subscription = webSocket.subscribe<LobbyMessage>(
      `/topic/lobby/${lobbyId}`,
      (message) => {
        if (message.type === "LOBBY_STATE") {
          setLobby(message.payload as Lobby);
        } else if (message.type === "GAME_START") {
          router.push(`/game/${lobbyId}`);
        } else if ((message.type as unknown as string) === "COUNTDOWN_START") {
          /* Future-friendly: when the backend broadcasts COUNTDOWN_START
             before GAME_START, all players see a synchronized countdown.
             Until then, only the host (who triggered the countdown
             locally) sees the 3-2-1-LOS — other players just see the
             page transition when GAME_START arrives. */
          setCd(3);
        }
      }
    );
    return () => subscription?.unsubscribe();
  }, [webSocket.isConnected, lobbyId, router, webSocket]);

  // ── Countdown ticker ─────────────────────────────────────────────────
  useEffect(() => {
    if (cd === null) return;
    if (cd === 0) {
      publishStartGame();
      return;
    }
    const t = setTimeout(
      () => setCd((c) => (c !== null ? c - 1 : null)),
      1000
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cd]);

  // ── Derived state ────────────────────────────────────────────────────
  const isHost = lobby && currentUser
    ? lobby.admin?.userId === currentUser.userId
    : false;

  /* Match host badges by username when the backend provides admin.username.
     Otherwise fall back to "only the current user can be marked as host". */
  const adminUsername: string | undefined = (lobby?.admin as { username?: string } | undefined)?.username;
  const isPlayerHost = (username: string): boolean => {
    if (adminUsername) return adminUsername === username;
    return username === currentUser?.username && isHost;
  };

  const getConnStatus = (username: string): ConnStatus => {
    if (username === currentUser?.username) {
      return webSocket.isConnected ? "connected" : "connecting";
    }
    return connStatus[username] || "connected";
  };

  const players = lobby?.users || [];
  const playerCount = players.length;
  const maxPlayers = lobby?.size || 0;
  const connectedCount = players.filter(
    (u) => getConnStatus(u.username) === "connected"
  ).length;
  const allConnected = connectedCount === playerCount && playerCount > 0;
  const emptySlotsCount = Math.max(0, maxPlayers - playerCount);

  const visLabel = lobby?.visibility === "PRIVATE" ? "Privat" : "Öffentlich";
  const code = lobby?.lobbyCode || "—";
  const nextHostName =
    players.find(
      (u) => !isPlayerHost(u.username) && getConnStatus(u.username) === "connected"
    )?.username || "einem anderen Spieler";

  // ── Actions ──────────────────────────────────────────────────────────
  const publishStartGame = () => {
    if (!currentUser || !token) return;
    const destination = `/app/lobby/${lobbyId}/start`;
    const payload: UserAuthDTO = { userId: currentUser.userId, token };
    const messageBody: LobbyMessage = { type: "START_GAME", payload };
    webSocket.publish(destination, messageBody);
  };

  const handleStart = () => {
    if (!webSocket.isConnected) return;
    if (allConnected) {
      setCd(3);
    } else {
      setSmartStart(true);
    }
  };

  const startAnyway = () => {
    setSmartStart(false);
    setCd(3);
  };

  const handleLeave = () => {
    if (!currentUser || !token) return;
    const destination = `/app/lobby/${lobbyId}/leave`;
    const payload: UserAuthDTO = { userId: currentUser.userId, token };
    const messageBody: LobbyMessage = { type: "LEAVE_LOBBY", payload };
    webSocket.publish(destination, messageBody);
    intentionalDisconnect.current = true;
    router.push("/lobbies");
    webSocket.disconnect();
  };

  const confirmLeave = () => {
    setLeaveConf(false);
    handleLeave();
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard unavailable (e.g. non-secure context) — still flash the indicator */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // ── Loading state ────────────────────────────────────────────────────
  if (!lobby) {
    return <div className="lobbyroom-loading">Laden…</div>;
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="lobbyroom-page">
      {/* Black title header */}
      <div className="lobbyroom-header">
        <div className="lobbyroom-header-inner">
          <div className="lobbyroom-title-block">
            <span className="eyebrow eyebrow--red">Warteraum</span>
            <h1 className="lobbyroom-name">{lobby.lobbyName}</h1>
            <div className="lobbyroom-meta-row">
              <span className="lobbyroom-meta-rounds">
                <strong>{lobby.maxRounds || 0}</strong> Runden
              </span>
              <span className="lobbyroom-meta-sep">·</span>
              <span
                className={
                  "lobbyroom-meta-vis " +
                  (lobby.visibility === "PRIVATE"
                    ? "lobbyroom-meta-vis--private"
                    : "lobbyroom-meta-vis--public")
                }
              >
                {visLabel}
              </span>
              <span className="lobbyroom-meta-sep">·</span>
              <span
                className={
                  "lobbyroom-meta-status " +
                  (allConnected
                    ? "lobbyroom-meta-status--ready"
                    : "lobbyroom-meta-status--wait")
                }
              >
                <span className="lobbyroom-meta-status-dot" />
                {allConnected ? "Bereit" : "Wartet"}
              </span>
            </div>
          </div>
          <div className="lobbyroom-code-box">
            <div className="lobbyroom-code-label">CODE</div>
            <div className="lobbyroom-code-value">{code}</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lobbyroom-content">
        {/* Invite */}
        <div className="lobbyroom-panel lobbyroom-panel--invite">
          <div className="lobbyroom-invite-header">
            <span className="eyebrow eyebrow--grey">Freunde einladen</span>
            {copied && <span className="lobbyroom-copied">✓ KOPIERT</span>}
          </div>
          <div className="lobbyroom-invite-pill">
            <div className="lobbyroom-invite-code">{code}</div>
            <button
              type="button"
              className="lobbyroom-invite-copy-btn"
              onClick={copyCode}
            >
              Code kopieren
            </button>
          </div>
        </div>

        {/* Player list */}
        <div className="lobbyroom-panel lobbyroom-panel--players">
          <div className="lobbyroom-players-header">
            <span className="eyebrow eyebrow--black">Spieler</span>
            <span className="lobbyroom-players-count">
              <span className="num-online">{connectedCount}</span>
              <span className="num-total"> / {playerCount}</span>
              <span className="max-info">· max {maxPlayers}</span>
            </span>
          </div>

          {players.map((u) => {
            const conn = getConnStatus(u.username);
            const host = isPlayerHost(u.username);
            const connLabel =
              conn === "connected"
                ? "Verbunden"
                : conn === "connecting"
                ? "Verbindet…"
                : "Getrennt";
            return (
              <div
                key={u.username}
                className={
                  "lobbyroom-player-row" +
                  (conn === "disconnected" ? " lobbyroom-player-row--disconnected" : "")
                }
              >
                <div className="lobbyroom-player-info">
                  <div
                    className="lobbyroom-player-avatar"
                    style={{ background: colorForName(u.username) }}
                  >
                    {u.username[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="lobbyroom-player-name-block">
                    <span className="lobbyroom-player-name">{u.username}</span>
                    {host && <span className="lobbyroom-host-badge">HOST</span>}
                  </div>
                </div>
                <div className={"lobbyroom-conn lobbyroom-conn--" + conn} title={connLabel}>
                  <span className="lobbyroom-conn-dot" />
                  <span className="lobbyroom-conn-label">{connLabel}</span>
                </div>
              </div>
            );
          })}

          {Array.from({ length: emptySlotsCount }).map((_, i) => (
            <div key={`empty-${i}`} className="lobbyroom-empty-slot">
              <div className="lobbyroom-empty-avatar" />
              <span className="lobbyroom-empty-text">Wartet auf Spieler…</span>
            </div>
          ))}
        </div>

        {/* Action area: countdown / host buttons / non-host banner */}
        {cd !== null ? (
          <div className="lobbyroom-countdown">
            <div className="lobbyroom-countdown-number">{cd || "LOS!"}</div>
            <div className="lobbyroom-countdown-label">Spiel startet…</div>
          </div>
        ) : isHost ? (
          <div className="lobbyroom-actions">
            <button
              type="button"
              className="sbb-btn-home sbb-btn-home--primary"
              onClick={handleStart}
              disabled={!webSocket.isConnected}
              title={!webSocket.isConnected ? "Verbindung wird aufgebaut…" : ""}
            >
              ▶ Spiel starten
              {!allConnected && playerCount > 0 && (
                <span className="lobbyroom-start-meta">
                  ({connectedCount}/{playerCount})
                </span>
              )}
            </button>
            <button
              type="button"
              className="sbb-btn-home sbb-btn-home--secondary"
              onClick={() => setLeaveConf(true)}
            >
              Verlassen
            </button>
          </div>
        ) : (
          <div className="lobbyroom-nonhost-banner">
            <span className="lobbyroom-nonhost-banner-dot" />
            WARTET AUF HOST
            {adminUsername && (
              <>
                {" · "}
                <span className="lobbyroom-nonhost-banner-host">{adminUsername}</span>
              </>
            )}
            <div>
              <button
                type="button"
                className="lobbyroom-nonhost-leave-btn"
                onClick={handleLeave}
              >
                Lobby verlassen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Smart-start warning modal */}
      {smartStart && (
        <div
          className="auth-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSmartStart(false);
          }}
        >
          <div className="auth-modal auth-modal--gold">
            <span className="eyebrow eyebrow--gold">Achtung</span>
            <h2 className="auth-title">Nicht alle verbunden</h2>
            <p className="auth-subtitle">
              <strong style={{ color: "var(--gs-green)" }}>{connectedCount}</strong>
              {" "}von{" "}
              <strong style={{ color: "var(--gs-black)" }}>{playerCount}</strong>
              {" "}Spielern sind verbunden. Trotzdem starten oder warten?
            </p>
            <div className="auth-modal-actions">
              <button
                type="button"
                className="sbb-btn-home sbb-btn-home--primary"
                onClick={startAnyway}
              >
                Trotzdem starten ({connectedCount} {connectedCount === 1 ? "Spieler" : "Spieler"})
              </button>
              <button
                type="button"
                className="sbb-btn-home sbb-btn-home--secondary"
                onClick={() => setSmartStart(false)}
              >
                Auf alle warten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave & transfer host confirmation modal */}
      {leaveConf && (
        <div
          className="auth-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLeaveConf(false);
          }}
        >
          <div className="auth-modal">
            <span className="eyebrow eyebrow--red">Lobby verlassen</span>
            <h2 className="auth-title">Host übergeben?</h2>
            <p className="auth-subtitle">
              Du bist der Host dieser Lobby. Wenn du gehst, wird{" "}
              <strong style={{ color: "var(--gs-black)" }}>{nextHostName}</strong>
              {" "}der neue Host.
            </p>
            <div className="auth-modal-actions">
              <button
                type="button"
                className="sbb-btn-home sbb-btn-home--primary"
                onClick={confirmLeave}
              >
                Verlassen
              </button>
              <button
                type="button"
                className="sbb-btn-home sbb-btn-home--secondary"
                onClick={() => setLeaveConf(false)}
              >
                Bleiben
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LobbyWaitPage;