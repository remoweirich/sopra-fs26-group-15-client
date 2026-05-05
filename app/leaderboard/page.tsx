"use client";

/**
 * Leaderboard Page — route: /leaderboard
 *
 * Design: SBB-styled black header with eyebrow + title, then a tab toggle
 * (Diese Woche / Allzeit), three medal cards for top players, and the
 * full ranking table below.
 *
 * Layout: outer wrapper uses inline minHeight/paddingTop (matches other
 * ported pages like Lobbies, Home, etc.). The black header escapes any
 * max-width constraint by being a direct child of the outer wrapper.
 *
 * Guest banner only renders when no user is authenticated.
 *
 * NOTE: Design only — no dummy player data included.
 * Claude Stark: fetch player list via API, then .map() rows where the
 * "TODO: player rows" comment is below.
 */

import React, { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const LeaderboardPage: React.FC = () => {
  const [tab, setTab] = useState<"weekly" | "alltime">("weekly");
  const { user } = useAuth();

  return (
    <div style={{ minHeight: "100vh", background: "var(--gs-cream)" }}>

      {/* ── Full-width black header ───────────────────────────────────── */}
      <div className="leaderboard-header">
        <div className="leaderboard-header-inner">
          <span className="leaderboard-eyebrow">RANGLISTE / LEADERBOARD</span>
          <h1 className="leaderboard-title">Die besten Bahnkenner der Schweiz</h1>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="leaderboard-wrapper">

        {/* ── Tab toggle ─────────────────────────────────────────────── */}
        <div className="leaderboard-tabs">
          <button
            type="button"
            className={"leaderboard-tab " + (tab === "weekly" ? "leaderboard-tab--active" : "")}
            onClick={() => setTab("weekly")}
          >
            Diese Woche
          </button>
          <button
            type="button"
            className={"leaderboard-tab " + (tab === "alltime" ? "leaderboard-tab--active" : "")}
            onClick={() => setTab("alltime")}
          >
            Allzeit
          </button>
        </div>

        {/* ── Search pill ────────────────────────────────────────────── */}
        <label className="leaderboard-search" htmlFor="leaderboard-search-input">
          <Search size={16} className="leaderboard-search-icon" />
          <input
            id="leaderboard-search-input"
            className="leaderboard-search-input"
            placeholder="Spieler suchen…"
          />
        </label>

        {/* ── Guest banner — only for non-authenticated users ──────── */}
        {!user && (
          <div className="leaderboard-guest-banner">
            Log dich ein, um auf der Rangliste zu erscheinen.{" "}
            <Link href="/register" className="leaderboard-guest-banner-link">
              Registrieren →
            </Link>
          </div>
        )}

        {/* ── Top 3 podium cards (filled by your .map() once data is wired) ──
            TODO (Claude Stark): render the first 3 players from fetched list as:

            <div className="leaderboard-top3">
              {players.slice(0, 3).map((p, i) => (
                <div key={p.username} className={`leaderboard-top-card leaderboard-top-card--${i + 1}`}>
                  <div className="leaderboard-top-rank">{i + 1}</div>
                  <div className="leaderboard-top-name">{p.username}</div>
                  <div className="leaderboard-top-score">
                    {p.total.toLocaleString("de-CH")}
                  </div>
                  <div className="leaderboard-top-meta">{p.games} Spiele</div>
                </div>
              ))}
            </div>

            Variants `--1`, `--2`, `--3` set the gold/silver/bronze top-border colour.
        */}

        {/* ── Player list ────────────────────────────────────────────── */}
        <div className="leaderboard-list">

          {/* Table header */}
          <div className="leaderboard-list-head">
            <div>#</div>
            <div>SPIELER</div>
            <div>PUNKTE</div>
            <div className="hide-mob">SPIELE</div>
            <div className="hide-mob hide-tab">Ø/SPIEL</div>
          </div>

          {/* Empty state — shown while the list is empty.
              Once the API is wired up, show this only when
              filtered.length === 0. */}
          <div className="leaderboard-empty">
            Noch keine Spieler auf der Rangliste.
          </div>

          {/*
            TODO (Claude Stark): map over fetched players
            Expected JSX per player (replace .leaderboard-empty above):

            <div className={"leaderboard-row " + (isMe ? "leaderboard-row--you" : "")}>
              <div className="leaderboard-rank leaderboard-rank--medal">🥇</div>
              <div className="leaderboard-player-info">
                <div className="leaderboard-name">
                  {player.username}
                  {isMe && <span className="badge badge-host">Du</span>}
                </div>
              </div>
              <div className="leaderboard-score">
                {player.total.toLocaleString("de-CH")}
              </div>
              <div className="hide-mob leaderboard-games">
                {player.games}
              </div>
              <div className="hide-mob hide-tab leaderboard-avg">
                {player.avg}
              </div>
            </div>

            - Use class `leaderboard-rank--medal` for ranks 1–3 (emoji 🥇🥈🥉)
            - Use class `leaderboard-rank` only for rank ≥ 4 (plain number)
            - Add class `leaderboard-row--you` on the row if player is current user
              (compare player.username to user?.username from useAuth above)
          */}

        </div>

      </div>
    </div>
  );
};

export default LeaderboardPage;