"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type Tab = "weekly" | "alltime";

const LeaderboardInner: React.FC = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  // When the profile sends users here via "Freund hinzufügen", the URL has
  // ?addFriend=1. We use that to surface the request button more prominently.
  const addFriendMode = searchParams?.get("addFriend") === "1";

  const [tab, setTab] = useState<Tab>("weekly");
  const [search, setSearch] = useState("");
  const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({});

  // NOTE: leaderboard data is intentionally empty until the API is wired up.
  // The empty state below renders when no rows are available.
  const rows: { username: string; total: number; games: number; avg: number }[] = [];

  const filtered = rows.filter((r) =>
    r.username.toLowerCase().includes(search.toLowerCase())
  );
  const top3 = filtered.slice(0, 3);

  const podiumColors = ["var(--gold)", "var(--grey-l)", "#CD7F32"];

  // Local-only optimistic toggle; backend wiring lives in the friends endpoint
  // and will replace this when available.
  const handleSendRequest = (username: string) => {
    setSentRequests((prev) => ({ ...prev, [username]: true }));
  };

  return (
    <div className="page-root">
      <div className="section-head">
        <div className="section-head-row">
          <div>
            <span className="label">Rangliste / Leaderboard</span>
            <h1>
              {addFriendMode && user
                ? "Freund auf der Rangliste suchen"
                : "Die besten Bahnkenner der Schweiz"}
            </h1>
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
            placeholder={addFriendMode && user ? "Freund suchen…" : "Spieler suchen…"}
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
              <div key={p.username} className={`lb-podium-card is-${i + 1}`}>
                <div className="lb-podium-card-rank" style={{ color: podiumColors[i] }}>
                  {i + 1}
                </div>
                <div className="lb-podium-card-name">{p.username}</div>
                <div className="lb-podium-card-score">
                  {p.total.toLocaleString("de-CH")}
                </div>
                <div className="lb-podium-card-meta">{p.games} Spiele</div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="lb-table">
          <div className="lb-table-head">
            <span>#</span>
            <span>SPIELER</span>
            <span>PUNKTE</span>
            <span className="hide-md col-games">SPIELE</span>
            <span className="hide-md col-avg">{user ? "AKTION" : "Ø/SPIEL"}</span>
          </div>
          {filtered.length === 0 ? (
            <div className="lb-empty">
              Noch keine Daten verfügbar. Spiel jetzt und sichere dir den ersten Platz!
            </div>
          ) : (
            filtered.map((p, i) => {
              const isMe = user && user.username === p.username;
              const alreadySent = sentRequests[p.username];
              return (
                <div key={p.username} className="lb-row">
                  <div className={`lb-row-rank ${i < 3 ? "is-medal" : ""}`}>{i + 1}</div>
                  <div className="lb-row-name">{p.username}</div>
                  <div className="lb-row-score">
                    {p.total.toLocaleString("de-CH")}
                  </div>
                  <div className="lb-row-meta hide-md">{p.games}</div>
                  <div className="hide-md" style={{ display: "flex", justifyContent: "flex-end" }}>
                    {user && !isMe ? (
                      <button
                        type="button"
                        className={`sbb-btn ${alreadySent ? "sbb-btn--secondary" : "sbb-btn--primary"} sbb-btn--sm`}
                        onClick={() => handleSendRequest(p.username)}
                        disabled={alreadySent}
                        aria-label={`Freundschaftsanfrage an ${p.username}`}
                      >
                        {alreadySent ? "✓ Gesendet" : "+ Anfrage"}
                      </button>
                    ) : (
                      <span className="lb-row-avg">{p.avg}</span>
                    )}
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
