"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useWebSocket } from "@/context/WebSocketContext";
import { MyLobbyDTO } from "@/types/lobby";
import { LobbyMessage } from "@/types/lobbyMessage";
import { App, Button } from "antd";
import { useAuth } from "@/context/AuthContext";
import { UserAuthDTO } from "@/types/user";
import LobbyLoadingScreen from "./LobbyLoadingScreen";

const LobbyWaitPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const lobbyId = Number(params.id);
  const apiService = useApi();
  const { isConnected, connect, subscribe, publish } = useWebSocket();
  const { message } = App.useApp();

  const { user: currentUser, token } = useAuth();
  const [lobby, setLobby] = useState<MyLobbyDTO | null>(null);
  const intentionalDisconnect = useRef<boolean>(false);
  const [isLoadingGame, setIsLoadingGame] = useState<boolean>(false);
  const webSocket = useWebSocket();

  // ── Initial fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lobbyId || !token || !currentUser) return;

    const fetchLobby = async () => {
      try {
        console.log(`[LobbyWait] Fetching lobby ${lobbyId}...`);
        const response = await apiService.get<MyLobbyDTO>(
          `/lobbies/${lobbyId}`,
          { headers: { userId: currentUser.userId.toString(), token: token } }
        );
        console.log(`[LobbyWait] Lobby fetched:`, response);
        setLobby(response);
      } catch (e) {
        console.error("[LobbyWait] Fetch error:", e);
        router.push("/lobbies");
      }
    };

    fetchLobby();
  }, [lobbyId, token, currentUser, router, apiService]);

  // ── Reconnect bei Bedarf ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected && token && currentUser) {
      console.log("[LobbyWait] WebSocket not connected, reconnecting...");
      connect(currentUser.userId.toString(), token);
    }
  }, [isConnected, token, currentUser, connect]);

  // ── WebSocket subscribe ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected || !lobbyId) {
      console.log(
        `[LobbyWait] Not subscribing — isConnected: ${isConnected}, lobbyId: ${lobbyId}`
      );
      return;
    }

    console.log(`[LobbyWait] Subscribing to /topic/lobby/${lobbyId}`);
    const subscription = subscribe<LobbyMessage>(
      `/topic/lobby/${lobbyId}`,
      (msg) => {
        console.log(`[LobbyWait] WS message received:`, msg);

        if (msg.type === "LOBBY_STATE") {
          console.log(`[LobbyWait] Lobby state updated:`, msg.payload);
          setLobby(msg.payload);
        } else if (msg.type === "GAME_START") {
          console.log(
            `[LobbyWait] Game started! Navigating to /game/${lobbyId}`
          );
          router.push(`/game/${lobbyId}`);
        }
      }
    );

    return () => {
      console.log(`[LobbyWait] Unsubscribing from /topic/lobby/${lobbyId}`);
      subscription?.unsubscribe();
    };
  }, [isConnected, lobbyId, router, subscribe]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleStartGame = async () => {
    if (!webSocket.isConnected) {
      message.warning("Verbindung wird noch aufgebaut...");
      return;
    }

    console.log("Starting game");

    const destination = `/app/lobby/${lobbyId}/start`;

    if (!currentUser || !token) return;

    const payload: UserAuthDTO = {
      userId: currentUser.userId,
      token: token,
    };

    const messageBody: LobbyMessage = {
      type: "START_GAME",
      payload: payload,
    };

    webSocket.publish(destination, messageBody);
    setIsLoadingGame(true);
  };

  const handleLeave = () => {
    if (!currentUser || !token) return;
    console.log(`[LobbyWait] Leaving lobby ${lobbyId}`);
    publish(`/app/lobby/${lobbyId}/leave`, {});
    router.push("/lobbies");
  };

  const isHost = lobby && currentUser ? lobby.adminId === currentUser.userId : false;

  if (!lobby) return <div className="page-center">Laden...</div>;
  if (isLoadingGame) return <LobbyLoadingScreen lobbyId={lobbyId} />;

  const playerCount = lobby.players?.length || 0;
  const emptySlots = Math.max(0, lobby.maxPlayers - playerCount);
  const visibilityLabel = lobby.visibility === "PUBLIC" ? "Öffentlich" : "Privat";

  return (
    <div className="gs-room-page">
      <section className="gs-room-hero">
        <div className="gs-room-hero-inner">
          <div className="gs-room-hero-copy">
            <div className="gs-room-eyebrow">Warteraum</div>

            <h1 className="gs-room-title">{lobby.lobbyName}</h1>

            <div className="gs-room-meta">
              <span className="gs-room-meta-item">{lobby.maxRounds || 0} Runden</span>
              <span className="gs-room-meta-sep">•</span>
              <span
                className={`gs-room-meta-item ${
                  lobby.visibility === "PUBLIC"
                    ? "gs-room-meta-item--public"
                    : "gs-room-meta-item--private"
                }`}
              >
                {visibilityLabel}
              </span>
              <span className="gs-room-meta-sep">•</span>
              <span className="gs-room-meta-item gs-room-meta-item--waiting">
                Wartet
              </span>
            </div>
          </div>

          <div className="gs-room-code-card">
            <span className="gs-room-code-label">Code</span>
            <span className="gs-room-code-value">{lobby.lobbyCode}</span>
          </div>
        </div>
      </section>

      <section className="gs-room-main">
        <div className="gs-room-panel">
          <div className="gs-room-invite">
            <div className="gs-room-block-label">Freunde einladen</div>

            <div className="gs-room-invite-row">
              <div className="gs-room-invite-code">{lobby.lobbyCode}</div>

              <Button
                size="small"
                className="gs-room-copy-btn"
                onClick={() => navigator.clipboard.writeText(lobby.lobbyCode)}
              >
                Code kopieren
              </Button>
            </div>
          </div>

          <div className="gs-room-players">
            <div className="gs-room-players-head">
              <span className="gs-room-block-label gs-room-block-label--dark">
                Spieler
              </span>

              <span className="gs-room-players-count">
                <strong>{playerCount}</strong> / {lobby.maxPlayers}
                <span className="gs-room-players-max"> · max {lobby.maxPlayers}</span>
              </span>
            </div>

            <div className="gs-room-player-list">
              {lobby.players?.map((userDTO, index) => {
                const isMe = userDTO.username === currentUser?.username;
                const isPlayerHost = isMe && isHost;

                return (
                  <div
                    key={userDTO.username}
                    className={`gs-room-player-row ${
                      isPlayerHost ? "gs-room-player-row--host" : ""
                    }`}
                  >
                    <div
                      className={`gs-room-player-avatar ${
                        isPlayerHost
                          ? "gs-room-player-avatar--host"
                          : `gs-room-player-avatar--${index % 5}`
                      }`}
                    >
                      {userDTO.username?.[0]?.toUpperCase() ?? "?"}
                    </div>

                    <div className="gs-room-player-main">
                      <div className="gs-room-player-name-wrap">
                        <span className="gs-room-player-name">{userDTO.username}</span>

                        {isPlayerHost && (
                          <span className="gs-room-inline-badge gs-room-inline-badge--host">
                            Host
                          </span>
                        )}

                        {isMe && !isPlayerHost && (
                          <span className="gs-room-inline-badge gs-room-inline-badge--you">
                            Du
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="gs-room-player-status">
                      <span className="gs-room-player-status-dot" />
                      <span className="gs-room-player-status-text">Verbunden</span>
                    </div>
                  </div>
                );
              })}

              {Array.from({ length: emptySlots }).map((_, index) => (
                <div
                  key={`empty-slot-${index}`}
                  className="gs-room-player-row gs-room-player-row--empty"
                >
                  <div className="gs-room-player-avatar gs-room-player-avatar--empty" />
                  <div className="gs-room-player-empty-text">Wartet auf Spieler…</div>
                </div>
              ))}
            </div>
          </div>

          <div className="gs-room-actions">
            {isHost ? (
              <>
                <Button
                  type="primary"
                  className="gs-room-start-btn"
                  onClick={handleStartGame}
                  disabled={!isConnected}
                >
                  <span aria-hidden="true">▶</span> Spiel starten
                  <span className="gs-room-start-meta">
                    ({playerCount}/{lobby.maxPlayers})
                  </span>
                </Button>

                <Button className="gs-room-leave-btn" onClick={handleLeave}>
                  Verlassen
                </Button>
              </>
            ) : (
              <>
                <div className="gs-room-waiting-box">
                  <span className="gs-room-waiting-dot" />
                  Wartet auf Host
                </div>

                <Button className="gs-room-leave-btn" onClick={handleLeave}>
                  Lobby verlassen
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LobbyWaitPage;