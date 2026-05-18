"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useWebSocket } from "@/context/WebSocketContext";
import { MyLobbyDTO } from "@/types/lobby";
import { LobbyMessage } from "@/types/lobbyMessage";
import { useAuth } from "@/context/AuthContext";
import { UserAuthDTO } from "@/types/user";
import LobbyLoadingScreen from "./LobbyLoadingScreen";
import { playerColors } from "@/utils/colors";

// Pick a stable color from the playerColors palette for a given username.
// Same string always gets the same color across rerenders without needing
// server-side IDs.
const colorForUsername = (name: string): string => {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return playerColors[h % playerColors.length];
};

const LobbyWaitPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const lobbyId = Number(params.id);
  const apiService = useApi();
  const { isConnected, connect, subscribe, publish } = useWebSocket();

  const { user: currentUser, token } = useAuth();
  const [lobby, setLobby] = useState<MyLobbyDTO | null>(null);
  const intentionalDisconnect = useRef<boolean>(false);
  const [isLoadingGame, setIsLoadingGame] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [connectionWarning, setConnectionWarning] = useState<string | null>(null);
  const webSocket = useWebSocket();
  const [isSubscribed, setIsSubscribed] = useState(false);

  // ── Initial fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lobbyId || !token || !currentUser) return;
    const fetchLobby = async () => {
      try {
        const response = await apiService.get<MyLobbyDTO>(`/lobbies/${lobbyId}`, {
          headers: { userId: currentUser.userId.toString(), token: token },
        });
        setLobby(response);
      } catch (e) {
        console.error("[LobbyWait] Fetch error:", e);
        router.push("/lobbies");
      }
    };
    fetchLobby();
  }, [lobbyId, token, currentUser, router, apiService]);

  // ── Reconnect if needed ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected && token && currentUser) {
      setIsSubscribed(false);
      connect(currentUser.userId.toString(), token);
    }
  }, [isConnected, token, currentUser, connect]);

  // ── WebSocket subscribe ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected || !lobbyId) return;
    console.log(`[LobbyRoom] Subscribing to /topic/lobby/${lobbyId}`);
    setIsSubscribed(true);
    const subscription = subscribe<LobbyMessage>(`/topic/lobby/${lobbyId}`, (msg) => {
      console.log("[LobbyRoom] WS message:", msg);
      if (msg.type === "LOBBY_STATE") {
        setLobby(msg.payload);
      } else if (msg.type === "GAME_START") {
        console.log("[LobbyRoom] GAME_START — navigating to /game/", lobbyId);
        router.push(`/game/${lobbyId}`);
      }
    });
    return () => {
      subscription?.unsubscribe();
      setIsSubscribed(false);
    };
  }, [isConnected, lobbyId, router, subscribe]);

  // ── Actions ──────────────────────────────────────────────────────────────
  // The "smart start" confirmation pops up when the host clicks Start while
  // the lobby isn't full. Lets them either start with the current roster or
  // wait for the remaining slots. Mirrors the design mock.
  const [confirmStart, setConfirmStart] = useState(false);

  const publishStart = () => {
    if (!currentUser || !token) return;
    const payload: UserAuthDTO = { userId: currentUser.userId, token };
    const messageBody: LobbyMessage = { type: "START_GAME", payload };
    console.log(`[LobbyRoom] Publishing START_GAME to /app/lobby/${lobbyId}/start`, messageBody);
    webSocket.publish(`/app/lobby/${lobbyId}/start`, messageBody);
    setIsLoadingGame(true);
  };

  const handleStartGame = () => {
    if (!webSocket.isConnected) {
      setConnectionWarning("Verbindung wird noch aufgebaut...");
      setTimeout(() => setConnectionWarning(null), 2500);
      return;
    }
    if (!currentUser || !token || !lobby) return;
    // If the lobby still has empty slots, ask before starting. Full
    // lobby → start immediately.
    const playerCount = lobby.players?.length ?? 0;
    if (playerCount < lobby.maxPlayers) {
      setConfirmStart(true);
      return;
    }
    publishStart();
  };

  const handleLeave = () => {
    if (!currentUser || !token) return;
    intentionalDisconnect.current = true;
    publish(`/app/lobby/${lobbyId}/leave`, {});
    router.push("/lobbies");
  };

  const handleCopy = async () => {
    if (!lobby) return;
    try {
      await navigator.clipboard.writeText(lobby.lobbyCode);
    } catch {
      // Fallback silently
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const isHost = lobby && currentUser ? lobby.adminId === currentUser.userId : false;

  if (!lobby) {
    return <div className="page-loading">Laden…</div>;
  }

  if (isLoadingGame) return <LobbyLoadingScreen lobbyId={lobbyId} />;

  const playerCount = lobby.players?.length || 0;
  const emptySlots = Math.max(0, lobby.maxPlayers - playerCount);
  const emptySlotIds = Array.from({ length: emptySlots }, (_, i) => `slot-${i}`);
  const visLabel = lobby.visibility === "PRIVATE" ? "Privat" : "Öffentlich";

  return (
    <div className="lobby-room">
      {/* Header */}
      <div className="lobby-room-head">
        <div className="lobby-room-head-row">
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <span className="label">Warteraum</span>
            <h1 className="lobby-room-title">{lobby.lobbyName}</h1>
            <div className="lobby-room-meta">
              <span style={{ color: "var(--grey-l)", textTransform: "uppercase" }}>
                <span style={{ color: "var(--white)", fontWeight: 700 }}>{lobby.maxRounds}</span> Runden
              </span>
              <span className="lobby-room-meta-sep">·</span>
              <span
                style={{
                  color: lobby.visibility === "PRIVATE" ? "var(--gold)" : "var(--green)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {visLabel}
              </span>
              <span className="lobby-room-meta-sep">·</span>
              <span style={{ color: "var(--gold)", fontWeight: 700, textTransform: "uppercase" }}>
                Wartet
              </span>
            </div>
          </div>
          <div className="lobby-room-code">
            <div className="lobby-room-code-label">CODE</div>
            <div className="lobby-room-code-value">{lobby.lobbyCode}</div>
          </div>
        </div>
      </div>

      <div className="lobby-room-body">
        {/* Invite */}
        <div className="lobby-invite">
          <div className="lobby-invite-head">
            <span className="label label--grey">Freunde einladen</span>
            {copied && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--green)",
                  letterSpacing: "0.06em",
                }}
              >
                ✓ KOPIERT
              </span>
            )}
          </div>
          <div className="lobby-invite-pill">
            <div className="lobby-invite-code">{lobby.lobbyCode}</div>
            <button type="button" className="lobby-invite-btn" onClick={handleCopy}>
              Code kopieren
            </button>
          </div>
        </div>

        {/* Player list */}
        <div className="lobby-player-list">
          <div className="lobby-player-list-head">
            <span className="label label--black">Spieler</span>
            <span className="lobby-player-list-count">
              <span style={{ color: "var(--green)" }}>{playerCount}</span>
              <span style={{ color: "var(--grey)" }}> / {lobby.maxPlayers}</span>
            </span>
          </div>

          {lobby.players?.map((userDTO) => {
            const isMe = userDTO.username === currentUser?.username;
            const isPlayerHost = lobby.adminId === currentUser?.userId && isMe ||
              false; // adminId is numeric; player obj doesn't have id, so only "me" is reliably marked as host
            const showHostBadge = isPlayerHost;
            const avatarColor = colorForUsername(userDTO.username || "?");
            // The list only contains players who are present, so they're
            // connected. Until the backend exposes per-player connection
            // state, we render everyone as VERBUNDEN (green).
            return (
              <div key={userDTO.username} className="lobby-player-row">
                <div className="lobby-player-row-left">
                  <div
                    className="lobby-player-avatar"
                    style={{ background: avatarColor }}
                  >
                    {userDTO.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className="lobby-player-name">{userDTO.username}</span>
                  {showHostBadge && <span className="sbb-badge sbb-badge--host">HOST</span>}
                  {isMe && !showHostBadge && <span className="sbb-badge sbb-badge--you">DU</span>}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    flexShrink: 0,
                  }}
                  aria-label="Verbunden"
                >
                  {isMe && (
                  <>  
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: isSubscribed ? "var(--green)" : "var(--red)",
                      boxShadow: "0 0 0 2px rgba(45,106,79,0.22)",
                    }}
                  />
                  
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      fontWeight: 700,
                      color: isSubscribed ? "var(--green)" : "var(--red)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {isSubscribed ? "VERBUNDEN" : "NICHT VERBUNDEN"}
                  </span>
                </>)}
                </div>
              </div>
            );
          })}

          {emptySlotIds.map((id) => (
            <div key={id} className="lobby-empty-slot">
              <div className="lobby-empty-slot-avatar" />
              <span className="lobby-empty-slot-text">Wartet auf Spieler…</span>
            </div>
          ))}
        </div>

        {/* Actions — buttons share the row on tablet+, stack on mobile.
            See `.lobby-actions` in globals.css (flex-wrap + min-basis). */}
        {isHost ? (
          <div className="lobby-actions">
            <button
              type="button"
              className="sbb-btn sbb-btn--primary sbb-btn--lg"
              onClick={handleStartGame}
              disabled={!isConnected}
            >
              ▶ Spiel starten ({lobby.maxRounds} Runden)
            </button>
            <button
              type="button"
              className="sbb-btn sbb-btn--secondary sbb-btn--lg"
              onClick={handleLeave}
            >
              Verlassen
            </button>
          </div>
        ) : (
          <div className="lobby-wait-msg">
            <span className="lobby-wait-msg-dot" />
            WARTET AUF HOST
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={handleLeave}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--red)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "4px 8px",
                }}
              >
                Lobby verlassen
              </button>
            </div>
          </div>
        )}

        {connectionWarning && (
          <div className="sbb-field-error" style={{ marginTop: 16 }}>
            {connectionWarning}
          </div>
        )}
      </div>

      {/* Smart-start confirmation — only the host sees this, only when
          they clicked Start with empty slots remaining. Matches the
          "Nicht alle verbunden" mock. */}
      {confirmStart && lobby && (
        <div
          className="sbb-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Nicht alle verbunden"
        >
          <button
            type="button"
            onClick={() => setConfirmStart(false)}
            aria-label="Modal schliessen"
            style={{
              position: "absolute",
              inset: 0,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          />
          <div
            className="sbb-modal sbb-modal--gold"
            style={{ position: "relative", zIndex: 1 }}
          >
            <span className="label" style={{ color: "var(--gold)" }}>
              Achtung
            </span>
            <h2>Nicht alle verbunden</h2>
            <p className="sub">
              <strong style={{ color: "var(--green)" }}>
                {lobby.players?.length ?? 0}
              </strong>{" "}
              von <strong>{lobby.maxPlayers}</strong> Spielern sind verbunden.
              Trotzdem starten oder warten?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="button"
                className="sbb-btn sbb-btn--primary sbb-btn--md sbb-btn--full"
                onClick={() => {
                  setConfirmStart(false);
                  publishStart();
                }}
              >
                Trotzdem starten ({lobby.players?.length ?? 0} Spieler)
              </button>
              <button
                type="button"
                className="sbb-btn sbb-btn--secondary sbb-btn--md sbb-btn--full"
                onClick={() => setConfirmStart(false)}
              >
                Auf alle warten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LobbyWaitPage;
