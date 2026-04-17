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
import useLocalStorage from "@/hooks/useLocalStorage";
//import { useWebSocket } from "@/hooks/useWebSocket";
import { Lobby } from "@/types/lobby";
import { Button } from "antd";

const LobbyWaitPage: React.FC = () => {
  const router     = useRouter();
  const lobbyId = Number(useParams().id);
  const apiService  = useApi();

  const [lobby, setLobby]   = useState<Lobby | null>(null);


  // ── Initial fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("token") || '""') as string;
    const userId = JSON.parse(localStorage.getItem("userId") || '""') as number;

    console.log("LobbyPage before fetch: ", userId, lobbyId, token);
    const fetchLobby = async () => {
      try {
        const response = await apiService.get<Lobby>(
            `/lobbies/${lobbyId}`,
            {
              headers: {userId: userId.toString(), token: token},
            }
            );
        console.log(response);
        setLobby(response);
      } catch (e) {
        throw e;
      }
    };

    fetchLobby();
  }, [router]);

  // ── WebSocket – live lobby updates ───────────────────────────────────────
  

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleStartGame = async () => {
    router.push(`/game/${lobbyId}`); // TODO
  };

  const handleLeave = async () => {
    router.push("/lobbies"); // TODO: send leave request to backend, 
  };

  const updateLobbySettings = async () => {

  }

  

  

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="page-center page-content">
      <div className="card card--wide">

        {/* Header row: lobby name + status badge */}
        <div className="wait-header">
          <h2>Lobby Name
          </h2>
          {/* TODO: badge-waiting "Waiting…" */}
        </div>

        

        <div className="u-divider" />

        

        {/* Action buttons */}
        <div className="wait-actions">
          
            <Button
              type="primary"
              className="btn-full"
              onClick={handleStartGame}
            >
              Start Game 
            </Button>
          

          <Button
            className="btn-ghost-muted btn-full"
            onClick={handleLeave}
          >
            Leave lobby 
          </Button>
        </div>

      </div>
    </div>
  );
};

export default LobbyWaitPage;