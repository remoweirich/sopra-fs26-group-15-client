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
import { Lobby } from "@/types";
import { Button, Spin } from "antd";

const LobbiesPage: React.FC = () => {
  const router     = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");

  const [lobbies, setLobbies]   = useState<Lobby[]>([]);
  const [loading, setLoading]   = useState(true);

  // ── Fetch lobby list ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchLobbies = async () => {
      //fetch the lobbies
    };

    fetchLobbies();

  }, []);

  // ── Join lobby ──────────────────────────────────────────────────────────
  const handleJoin = async (lobby: Lobby) => {
    //send REST request to join, then handle response and subscribe to websocket
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
          onClick={() => router.push("/lobbycreation")}
        >
          + New Lobby
        </Button>
      </div>

      {/* Lobby list */}
      {loading ? (
        <Spin />
      ) : (
        <div className="lobby-list">
          
        </div>
      )}

    </div>
  );
};

export default LobbiesPage;