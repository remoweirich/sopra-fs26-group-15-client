"use client";

/**
 * Lobby Overview Page  –  route: /lobbies
 *
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * Layout (inside page-content):
 *   .lobby-page-header     → title "🎮 Lobbies" + "New Lobby" button
 *   .lobby-list            → vertical stack of .lobby-row entries
 *     .lobby-row           → one lobby (name, status, host, rounds, visibility,
 *                            player count, Join button)
 *
 * Classnames (all in globals.css):
 *   page-root, page-content
 *   lobby-page-header, lobby-page-title, lobby-page-subtitle
 *   lobby-list
 *   lobby-row, lobby-row-left, lobby-row-right
 *   lobby-row-status-dot  (--open | --ingame)
 *   lobby-row-info, lobby-row-name, lobby-row-meta
 *   lobby-row-players
 *   badge  badge-open | badge-ingame | badge-public | badge-private
 
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Lobby, LobbyAccessDTO, LobbyCodeDTO } from "@/types/lobby";
import { Button, Spin } from "antd";

const LobbiesPage: React.FC = () => {
  const router     = useRouter();
  const apiService = useApi();
  //const { value: token } = useLocalStorage<string>("token", "");

  const [lobbies, setLobbies]   = useState<Lobby[]>([]);
  const [loading, setLoading]   = useState(true);
  const [emptyLobbyList, setEmptyLobbyList] = useState(false);

  // ── Fetch lobby list ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchLobbies = async () => {
      const lobby1: Lobby = {
        lobbyId: 1,
        lobbyName: "Lobby 1",
        lobbyCode: "ABC123",
        adminId: 123,
        rounds: 3,
        visibility: "PRIVATE",
        lobbyState: "IN_GAME",
        currentRound: 0,
        scores: [1, 2, 3],
        size: 5
      };
      const lobby2: Lobby = {
        lobbyId: 2,
        lobbyName: "Lobby 2",
        lobbyCode: "ABC123",
        adminId: 123,
        rounds: 3,
        visibility: "PRIVATE",
        lobbyState: "WAITING",
        currentRound: 0,
        scores: [1, 2, 3],
        size: 5
      };
      

      const response = await apiService.get<Lobby[]>("/lobbies");
      setLobbies(response);
      setLoading(false);
      if (response.length === 0) {
        setEmptyLobbyList(true);
      }
    };

    fetchLobbies();

  }, []);

  // ── Join lobby ──────────────────────────────────────────────────────────
  const handleJoin = async (lobbyId: number, userId: number, token: string, lobbyCodeDTO: LobbyCodeDTO) => {

    const lobbyAccessDTO = await apiService.post<LobbyAccessDTO>(`/lobbies/${lobbyId}`, { headers: { userId, token }, lobbyCodeDTO });
    const {set: setLobbyCode} = useLocalStorage<string>("lobbyCode", "");
    setLobbyCode(lobbyAccessDTO.lobbyCode);

    router.push(`/lobbies/${lobbyAccessDTO.lobbyId}`);

  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="page-root page-content card--wide">

      {/* Header row */}
      <div className="lobby-page-header">
        <div>
          <h1 className="lobby-page-title">
            Lobbies
          </h1>
          <p className="lobby-page-subtitle">Join a game or create your own.</p>
        </div>

        <Button
          type="primary"
          onClick={() => router.push("/lobbies/newlobby")}
        >
          + New Lobby
        </Button>
      </div>

      {/* Lobby list */}
      {loading ? (
        <Spin />
      ) : emptyLobbyList ? (
        <div className="lobby-list">
          <p>No lobbies available.</p>
        </div>
      ) : (
        <div className="lobby-list">
          {lobbies.map((lobby) => (
            <div key={lobby.lobbyId} className="lobby-row">
              <div className="lobby-row-left">
                <div className={`lobby-row-status-dot lobby-row-status-dot--${lobby.lobbyState === "WAITING" ? "open" : "ingame"}`} />
                <div className="lobby-row-info">
                  <div className="lobby-row-name">{lobby.lobbyName}</div>
                  <div className="lobby-row-meta">
                    Host: {lobby.adminId} | Rounds: {lobby.rounds} | Visibility: {lobby.visibility}
                  </div>
                </div>
              </div>
              <div className="lobby-row-right">
                <div className="lobby-row-players">
                  {lobby.size} player{lobby.size !== 1 && "s"}
                </div>
                <Button
                  type="primary"
                  onClick={() => handleJoin(lobby.lobbyId, lobby.adminId, "token", { lobbyCode: lobby.lobbyCode })}
                  disabled={lobby.lobbyState !== "WAITING"}
                >
                  Join
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default LobbiesPage;