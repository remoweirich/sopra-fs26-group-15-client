"use client";

/**
 * Lobby Wait Screen  –  route: /lobbies/[lobbyId]
 *
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * Layout (inside page-center):
 *   .card.card--lobby-wait
 *     .wait-header         →  lobby name  +  status badge ("Waiting…")
 *     .wait-meta           →  "5 rounds · Public"
 *     .wait-section-label  →  "PLAYERS (4/6)"
 *     .wait-player-list    →  .wait-player-row  ×N
 *     .u-divider
 *     .wait-section-label  →  "INVITE FRIENDS"
 *     .wait-invite-box     →  invite code + Copy button
 *     .wait-actions
 *       Button (primary, full)  →  "Start Game (N rounds)"   [host only]
 *       Button (ghost-muted)    →  "Leave lobby (host transfers)"
 *
 * Classnames for styling (all in globals.css):
 *   page-center
 *   card, card--lobby-wait
 *   wait-header, wait-lobby-name, wait-meta
 *   wait-section-label
 *   wait-player-list
 *   wait-player-row  (+ --host modifier for the host player)
 *   wait-player-avatar, wait-player-name, wait-player-status
 *   wait-invite-box, wait-invite-code
 *   wait-actions
 *   badge  badge-waiting | badge-public | badge-private | badge-host
 *   btn-full, btn-ghost-muted
 *   u-divider, u-section-label
 *
 */

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useWebSocket } from "@/context/WebSocketContext";
import { Lobby } from "@/types/lobby";
import { LobbyMessage } from "@/types/lobbyMessage";
import { Button } from "antd";
import {validateStyleMin} from "@maplibre/maplibre-gl-style-spec";
import state = validateStyleMin.state;

const LobbyWaitPage: React.FC = () => {
  const router     = useRouter();
  const lobbyId = Number(useParams().id);
  const apiService  = useApi();
  const webSocket = useWebSocket();

  //const token = JSON.parse(localStorage.getItem("token") || '""') as string;
  //const userId = JSON.parse(localStorage.getItem("userId") || '""') as number;
  const [userData, setUserData] = useState< {userId: number; token: string} | null>(null);
  const [lobby, setLobby]   = useState<Lobby | null>(null);

  useEffect(() => {
    const storedToken = JSON.parse(localStorage.getItem("token") || '""');
    const storedUserId = JSON.parse(localStorage.getItem("userId") || '0');
    setUserData({ userId: storedUserId, token: storedToken });
  }, []);


  // ── Initial fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lobbyId || !userData) return;

    const fetchLobby = async () => {
      try {
        const response = await apiService.get<Lobby>(
            `/lobbies/${lobbyId}`,
            {
              headers: {userId: userData.userId.toString(), token: userData.token},
            }
            );
        console.log(response); //to be removed
        setLobby(response);
      } catch (e) {
        console.error("Fetch error: ", e);
      }
    };
    fetchLobby();
  }, [lobbyId, userData]);


  // ── Websocket fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!webSocket.isConnected || !lobbyId) return;

    const subscription = webSocket.subscribe<LobbyMessage>(
        `/topic/lobby/${lobbyId}`,
        (message) => {
          if (message.type === "LOBBY_STATE") {
            console.log("WebSocket Update received", message.payload);
            setLobby(message.payload);
          }
          }
    );

    return () => subscription?.unsubscribe();
  }, [webSocket.isConnected, lobbyId]);


  // ── Actions ──────────────────────────────────────────────────────────────
  const handleStartGame = async () => {
    router.push(`/game/${lobbyId}`); // TODO
  };

  const handleLeave = async () => {
    router.push("/lobbies"); // TODO: send leave request to backend, 
  };

  const updateLobbySettings = async () => {

  }

  // Vor dem return in der Komponente:
  const isHost = lobby && userData ? lobby.adminId === userData.userId : false;

  if (!lobby) return <div className="page-center">Laden...</div>;
  

  

  // ── Render ───────────────────────────────────────────────────────────────

  return (
      <div className="page-center page-content">
        <div className="card card--lobby-wait card--wide">

          {/* Header: Name + Status */}
          <div className="wait-header">
            <h2 className="wait-lobby-name">{lobby.lobbyName}</h2>
            <span className="badge badge-waiting">Waiting...</span>
          </div>

          {/* Meta: Runden & Sichtbarkeit */}
          <div className="wait-meta">
            {lobby.rounds} rounds ·
            <span className={`badge ${lobby.visibility === 'PUBLIC' ? 'badge-public' : 'badge-private'}`}>
             {lobby.visibility}
          </span>
          </div>

          {/* Player List Section */}
          <div className="wait-section-label">
            PLAYERS ({lobby.players?.length || 0} / {lobby.size})
          </div>

          <div className="wait-player-list">
            {lobby.players?.map((playerId) => (
                <div key={playerId} className={`wait-player-row ${playerId === lobby.adminId ? 'wait-player-row--host' : ''}`}>
                  <div className="wait-player-avatar">
                    {/* Platzhalter für Avatar-Icon oder Initialen */}
                    {playerId.toString().substring(0, 1)}
                  </div>
                  <span className="wait-player-name">
                Player {playerId} {playerId === userData?.userId && " (You)"}
              </span>
                  {playerId === lobby.adminId && (
                      <span className="badge badge-host">Host</span>
                  )}
                </div>
            ))}
          </div>

          <div className="u-divider" />

          {/* Invite Section */}
          <div className="wait-section-label">INVITE FRIENDS</div>
          <div className="wait-invite-box">
            <code className="wait-invite-code">{lobby.lobbyCode}</code>
            <Button
                size="small"
                onClick={() => navigator.clipboard.writeText(lobby.lobbyCode)}
            >
              Copy
            </Button>
          </div>

          {/* Action buttons */}
          <div className="wait-actions">
            {isHost && (
                <Button
                    type="primary"
                    className="btn-full"
                    onClick={handleStartGame}
                    disabled={lobby.players && lobby.players.length < 2} // Optional: Start erst ab 2 Spielern
                >
                  Start Game ({lobby.rounds} Rounds)
                </Button>
            )}

            <Button
                className="btn-ghost-muted btn-full"
                onClick={handleLeave}
            >
              {isHost ? "Leave & Transfer Host" : "Leave Lobby"}
            </Button>
          </div>

        </div>
      </div>
  );
};

export default LobbyWaitPage;