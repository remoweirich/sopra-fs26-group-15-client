"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { UserDTO } from "@/types/user";
import { App as AntdApp } from "antd";
import { useNotifications } from "@/context/NotificationContext";

type SortKey =
  | "rank"
  | "leaderboardPoints"
  | "totalPoints"
  | "playedGames"
  | "guessingPrecision";

const LeaderboardInner: React.FC = () => {
  const { user, token } = useAuth();
  const apiService = useApi();
  const { notification } = AntdApp.useApp();
  const { friendsVersion, bumpFriendsVersion } = useNotifications();

  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<UserDTO[]>([]);
  const [top3, setTop3] = useState<UserDTO[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("leaderboardPoints");
  const [friends, setFriends] = useState<number[]>([]);
  const [friendRequestSent, setFriendRequestSent] = useState<Set<number>>(new Set());

  const podiumColors = ["var(--gold)", "var(--grey-l)", "#CD7F32"];

  useEffect(() => {
    const fetchTop3 = async () => {
      try {
        const data = await apiService.get<UserDTO[]>(`/users/search?username=`);
        setTop3(
          [...(data ?? [])]
            .sort((a, b) => (b.userScoreboard?.leaderboardPoints ?? 0) - (a.userScoreboard?.leaderboardPoints ?? 0))
            .slice(0, 3)
        );
      } catch (err) {
        console.error("Top 3 fetch failed", err);
      }
    };
    fetchTop3();
  }, [apiService]);

  useEffect(() => {
    setIsLoading(true);

    const debounce = setTimeout(async () => {
      try {
        const data = await apiService.get<UserDTO[]>(
          `/users/search?username=${encodeURIComponent(search)}`
        );
        setRows(data ?? []);
        console.log("Leaderboard data:", data);
        console.log("First scoreboard:", data?.[0]?.userScoreboard);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsLoading(false);
      }
    }, search.trim() === "" ? 0 : 400);

    return () => clearTimeout(debounce);
  }, [search, apiService]);

  useEffect(() => {
    if (!user?.userId || !token) {
      setFriends([]);
      setFriendRequestSent(new Set());
      return;
    }

    const getFriendState = async () => {
      try {
        const [friendsData, pendingSentData] = await Promise.all([
          apiService.get<UserDTO[]>(`/friends/${user.userId}`, {
            headers: { userId: user.userId.toString(), token },
          }),
          apiService.get<UserDTO[]>(`/friends/${user.userId}/pendingSent`, {
            headers: { userId: user.userId.toString(), token },
          }),
        ]);

        setFriends((friendsData ?? []).map((f) => f.userId));
        setFriendRequestSent(new Set((pendingSentData ?? []).map((p) => p.userId)));
      } catch (e) {
        console.log(e, "Error while fetching friend state");
      }
    };

    getFriendState();
  }, [user?.userId, token, apiService, friendsVersion]);

  // Feste Ränge basierend auf Punkte (bleibt immer gleich)
  const rankMap = new Map<number, number>();
  [...(rows ?? [])]
    .sort((a, b) => (b.userScoreboard?.leaderboardPoints ?? 0) - (a.userScoreboard?.leaderboardPoints ?? 0))
    .forEach((u, i) => rankMap.set(u.userId, i + 1));

  // Sortierung nach gewählter Spalte
  const filtered = [...(rows ?? [])].sort((a, b) => {
    if (sortBy === "rank") {
      return (rankMap.get(a.userId) ?? 0) - (rankMap.get(b.userId) ?? 0);
    }
    return (b.userScoreboard?.[sortBy as keyof typeof a.userScoreboard] ?? 0)
      - (a.userScoreboard?.[sortBy as keyof typeof a.userScoreboard] ?? 0);
  });

  const handleFriendRequest = async (receivingUserId: number) => {
    if (!user?.userId || !token) return;

    try {
      await apiService.post(`/friends/request/${receivingUserId}`, {}, {
        headers: { userId: user.userId.toString(), token },
      });

      setFriendRequestSent((prev) => new Set(prev).add(receivingUserId));
      bumpFriendsVersion();
    } catch (e: unknown) {
      const msg = String(e);
      if (msg.includes("409")) {
        setFriendRequestSent((prev) => new Set(prev).add(receivingUserId));
        notification.warning({
          title: "Anfrage existiert bereits",
          description: "Es besteht bereits eine offene Freundschaftsanfrage zwischen euch.",
          placement: "topRight",
          duration: 4,
        });
      } else {
        notification.error({
          title: "Fehler",
          description: "Freundschaftsanfrage konnte nicht gesendet werden.",
          placement: "topRight",
          duration: 4,
        });
      }
    }
  };

  return (
    <div className="page-root">
      <div className="section-head">
        <div className="section-head-row">
          <div>
            <span className="label">Rangliste / Leaderboard</span>
            <h1>Die besten Bahnkenner der Schweiz</h1>
          </div>
        </div>
      </div>

      <div className="lb-shell">
        {/* Search */}
        <div className="lb-search">
          <svg className="lb-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Spieler suchen…"
            aria-label="Spieler suchen"
          />
        </div>

        {/* Guest banner */}
        {!user && (
          <div className="lb-guest-banner">
            Logg dich ein, um in der Rangliste aufzutauchen und Freunde hinzuzufügen.{" "}
            <Link href="/register" className="sbb-link">
              Registrieren →
            </Link>
          </div>
        )}

        {/* Podium */}
        {top3.length > 0 && (
          <div className="lb-podium">
            {top3.map((p, i) => (
              <div key={p.userId} className={`lb-podium-card is-${i + 1}`}>
                <div className="lb-podium-card-rank" style={{ color: podiumColors[i] }}>
                  {i + 1}
                </div>
                <div className="lb-podium-card-name">{p.username}</div>
                <div className="lb-podium-card-score">
                  {p.userScoreboard?.leaderboardPoints?.toLocaleString("de-CH") ?? "–"}
                </div>
                <div className="lb-podium-card-meta">
                  {p.userScoreboard?.playedGames ?? "–"} Spiele
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="lb-table">
          <div className="lb-table-head">
            <button
              type="button"
              className={`lb-col-sort lb-col-sort--rank ${sortBy === "rank" ? "is-active" : ""}`}
              onClick={() => setSortBy("rank")}
            >
              # {sortBy === "rank" && "↓"}
            </button>
            <span>SPIELER</span>
            <button
              type="button"
              className={`lb-col-sort ${sortBy === "leaderboardPoints" ? "is-active" : ""}`}
              onClick={() => setSortBy("leaderboardPoints")}
            >
              <span className="lb-col-sort-full">RANGPUNKTE</span>
              <span className="lb-col-sort-short">RPKT</span>
              {sortBy === "leaderboardPoints" && " ↓"}
            </button>
            <button
              type="button"
              className={`lb-col-sort ${sortBy === "totalPoints" ? "is-active" : ""}`}
              onClick={() => setSortBy("totalPoints")}
            >
              <span className="lb-col-sort-full">TOTAL PUNKTE</span>
              <span className="lb-col-sort-short">T PKT</span>
              {sortBy === "totalPoints" && " ↓"}
            </button>
            <button
              type="button"
              className={`lb-col-sort lb-col-extra ${sortBy === "playedGames" ? "is-active" : ""}`}
              onClick={() => setSortBy("playedGames")}
            >
              <span className="lb-col-sort-full">SPIELE</span>
              <span className="lb-col-sort-short">SP</span>
              {sortBy === "playedGames" && " ↓"}
            </button>
            <button
              type="button"
              className={`lb-col-sort lb-col-extra lb-col-precision ${sortBy === "guessingPrecision" ? "is-active" : ""}`}
              onClick={() => setSortBy("guessingPrecision")}
            >
              <span className="lb-col-sort-full">GENAUIGKEIT</span>
              <span className="lb-col-sort-short">GEN</span>
              {sortBy === "guessingPrecision" && " ↓"}
            </button>
          </div>
          {isLoading ? (
            <div className="lb-empty">Lade…</div>
          ) : filtered.length === 0 ? (
            <div className="lb-empty">
              Noch keine Daten verfügbar. Spiel jetzt und sichere dir den ersten Platz!
            </div>
          ) : (
            filtered.map((p, i) => {
              const isMe = user?.username === p.username;
              const isFriend = friends.includes(p.userId);
              return (
                <div key={p.userId} className={`lb-row ${isMe ? "lb-row--you" : ""}`}>
                  <div className={`lb-row-rank ${(rankMap.get(p.userId) ?? i + 1) <= 3 ? "is-medal" : ""}`}>
                    {rankMap.get(p.userId) ?? i + 1}
                  </div>
                  <div className="lb-row-player">
                    <Link href={`/users/${p.userId}`} className="lb-row-name">
                      {p.username}
                    </Link>
                    {user && isMe && (
                      <span className="lb-badge lb-badge--you">Du</span>
                    )}
                    {user && !isMe && isFriend && (
                      <span className="lb-badge lb-badge--friend">✓ Freund</span>
                    )}
                    {user && !isMe && !isFriend && !friendRequestSent.has(p.userId) && (
                      <button
                        type="button"
                        className="lb-add-friend"
                        aria-label={`Freundschaftsanfrage an ${p.username}`}
                        onClick={() => handleFriendRequest(p.userId)}
                      >
                        +
                      </button>
                    )}
                    {user && !isMe && !isFriend && friendRequestSent.has(p.userId) && (
                      <span className="lb-badge" style={{ background: "rgba(200,150,12,0.12)", color: "var(--gold)" }}>Gesendet</span>
                    )}
                  </div>
                  <div className={`lb-row-score ${sortBy === "leaderboardPoints" ? "is-sort-active" : ""}`}>
                    {p.userScoreboard?.leaderboardPoints?.toLocaleString("de-CH") ?? "–"}
                  </div>
                  <div className={`lb-row-score ${sortBy === "totalPoints" ? "is-sort-active" : ""}`}>
                    {p.userScoreboard?.totalPoints?.toLocaleString("de-CH") ?? "–"}
                    </div>
                    <div className={`lb-row-meta lb-col-extra ${sortBy === "playedGames" ? "is-sort-active" : ""}`}>
                      {p.userScoreboard?.playedGames ?? "–"}
                    </div>
                    <div className={`lb-row-meta lb-col-extra lb-col-precision ${sortBy === "guessingPrecision" ? "is-sort-active" : ""}`}>
                      {(p.userScoreboard?.guessingPrecision ?? 0).toFixed(1)}%
                    </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const LeaderboardPage: React.FC = () => (
  <Suspense fallback={<div className="page-loading">Lade Rangliste…</div>}>
    <LeaderboardInner />
  </Suspense>
);

export default LeaderboardPage;
