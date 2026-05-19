"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { UserDTO } from "@/types/user";

type Tab = "weekly" | "alltime";
type SortKey = "totalPoints" | "playedGames" | "guessingPrecision";

const LeaderboardInner: React.FC = () => {
  const { user, token } = useAuth();
  const apiService = useApi();

  const [tab, setTab] = useState<Tab>("weekly");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<UserDTO[]>([]);
  const [top3, setTop3] = useState<UserDTO[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("totalPoints");
  const [friends, setFriends] = useState<number[]>([]);

  const podiumColors = ["var(--gold)", "var(--grey-l)", "#CD7F32"];

  // Einmalig beim Mount: Top 3 laden und einfrieren
  useEffect(() => {
    const fetchTop3 = async () => {
      try {
        const data = await apiService.get<UserDTO[]>(`/users/search?username=`);
        setTop3(
            [...(data ?? [])]
                .sort((a, b) => (b.userScoreboard?.totalPoints ?? 0) - (a.userScoreboard?.totalPoints ?? 0))
                .slice(0, 3)
        );
      } catch (err) {
        console.error("Top 3 fetch failed", err);
      }
    };
    fetchTop3();
  }, []);

  // Suche + Tab
  useEffect(() => {
    const debounce = setTimeout(async () => {
      try {
        const data = await apiService.get<UserDTO[]>(
            `/users/search?username=${encodeURIComponent(search)}`
        );
        setRows(data ?? []);
        console.log(data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsLoading(false);
      }
    }, search.trim() === "" ? 0 : 400);

    return () => clearTimeout(debounce);
  }, [search, tab, apiService]);

  useEffect(() => {
    if (!user || !token) return;
    const getFriends = async () => {
    try {
      const data = await apiService.get<UserDTO[]>(
          `/friends/${user?.userId}`,
          {
            headers : { userId: user.userId.toString() ?? "", token: token ?? ""}
          }
      );
      const friendIdList: number[] = [];
      for (let i = 0; i<data.length; i++) {
        const friend = data.at(i)
        if (friend != null) {
          friendIdList.push(friend.userId);
        }
      }
      setFriends(friendIdList);
      console.log("Friends: ", friendIdList);
    } catch (e) {
      console.log(e, "Error while fetching friends")
    }}
    getFriends();
  }, [user, token, apiService]);

  const filtered = [...(rows ?? [])].sort(
      (a, b) => (b.userScoreboard?.[sortBy] ?? 0) - (a.userScoreboard?.[sortBy] ?? 0)
  );

  const handleFriendRequest = async (receivingUserId: number) => {
    try {
      await apiService.post(`/friends/request/${receivingUserId}`, {},
          {
            headers: { userId: user?.userId.toString() ?? "", token: token ?? "" }
          });
    } catch (e) {
      console.error("Error while sending friend request", e);
    }
  }

  return (
      <div className="page-root">
        {/* Header */}
        <div className="section-head">
          <div className="section-head-row">
            <div>
              <span className="label">Rangliste / Leaderboard</span>
              <h1>Die besten Bahnkenner der Schweiz</h1>
            </div>
          </div>
        </div>

        <div className="lb-shell">
          {/* Tab toggle */}
          <div className="lb-tabs">
            <button
                type="button"
                className={`lb-tab ${tab === "weekly" ? "is-active" : ""}`}
                onClick={() => setTab("weekly")}
            >
              Diese Woche
            </button>
            <button
                type="button"
                className={`lb-tab ${tab === "alltime" ? "is-active" : ""}`}
                onClick={() => setTab("alltime")}
            >
              Allzeit
            </button>
          </div>

          {/* Search */}
          <div className="lb-search">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--grey)" }}>
            ⌕
          </span>
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
                        {p.userScoreboard?.totalPoints?.toLocaleString("de-CH") ?? "–"}
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
              <span>#</span>
              <span>SPIELER</span>
              <button
                  type="button"
                  className={`lb-sort-btn ${sortBy === "totalPoints" ? "is-active" : ""}`}
                  onClick={() => setSortBy("totalPoints")}
              >
                PUNKTE {sortBy === "totalPoints" ? "↓" : ""}
              </button>
              <button
                  type="button"
                  className={`lb-sort-btn hide-md col-games ${sortBy === "playedGames" ? "is-active" : ""}`}
                  onClick={() => setSortBy("playedGames")}
              >
                SPIELE {sortBy === "playedGames" ? "↓" : ""}
              </button>
              <button
                  type="button"
                  className={`lb-sort-btn hide-md col-games ${sortBy === "guessingPrecision" ? "is-active" : ""}`}
                  onClick={() => setSortBy("guessingPrecision")}
              >
                GENAUIGKEIT {sortBy === "guessingPrecision" ? "↓" : ""}
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
                  return (
                      <div key={p.userId} className="lb-row">
                        <div className={`lb-row-rank ${i < 3 ? "is-medal" : ""}`}>{i + 1}</div>
                        <div
                            className="lb-row-name"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              width: "100%"
                            }}
                        >
                          {/* Schützt das Layout vor zu langen Namen */}
                          <span style={{ flexGrow: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {p.username}
                          </span>

                          {user && !isMe && !(friends.includes(p.userId)) ? (
                              <button
                                  type="button"
                                  className="sbb-btn sbb-btn--primary sbb-btn--sm"
                                  style={{ marginLeft: "12px", flexShrink: 0 }}
                                  aria-label={`Freundschaftsanfrage an ${p.username}`}
                                  onClick={() => handleFriendRequest(p.userId)}
                              >
                                + Freund
                              </button>

                          ) : user && friends.includes(p.userId) ? (
                              <span
                                  className="lb-row-avg"
                                  style={{
                                    backgroundColor: "#f3f4f6",
                                    color: "#4b5563",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    fontSize: "0.75rem",
                                    fontWeight: "500",
                                    marginLeft: "12px",
                                    display: "inline-block",
                                    flexShrink: 0 // Verhindert das Stauchen des Badges bei langen Namen
                                  }}
                              >
                                Freund
                              </span>
                          ) : user ? (
                              <span
                                  className="lb-row-avg"
                                  style={{
                                    backgroundColor: "#f3f4f6",
                                    color: "#4b5563",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    fontSize: "0.75rem",
                                    fontWeight: "500",
                                    marginLeft: "12px",
                                    display: "inline-block",
                                    flexShrink: 0 // Verhindert das Stauchen des Badges bei langen Namen
                                  }}
                              >
                                Du
                              </span>): (<span></span>)
                          }
                        </div>

                        <div className="lb-row-score">
                          {p.userScoreboard?.totalPoints?.toLocaleString("de-CH") ?? "–"}
                        </div>
                        <div className="lb-row-meta hide-md">
                          {p.userScoreboard?.playedGames ?? "–"}
                        </div>
                        <div className="lb-row-meta hide-md">
                          {(p.userScoreboard?.guessingPrecision*100).toLocaleString("de-CH") ?? "–"}
                          %
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