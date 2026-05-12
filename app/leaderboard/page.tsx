"use client";

/**
 * Leaderboard Page  –  route: /leaderboard
 *
 * Design: GuesSBB v2 (dark hero + search + time-toggle + top-3 podium
 *                     + 6-col table with friend-request action).
 *   Tokens:  --gs-* in globals.css :root
 *   Classes: .leaderboard-* in globals.css
 *
 * Design only — no API/dummy data is rendered.
 *
 * State that is wired up (purely UI):
 *   - search query (filters visible rows by username)
 *   - time-period toggle ("Diese Woche" / "Allzeit")
 *   - friend-request set (per-row "sent" badge after click)
 *
 * TODO (Claude Stark): replace placeholders with API calls
 *   - fetch players list (range-aware)
 *   - POST /friends/request inside handleSendFriendRequest()
 *   - hide the friend button on the current user's own row
 *
 * Responsive: mobile (≤640) → tablet (≤1024) → laptop (≤1439)
 *             → desktop (≤1919) → ultrawide (≥1920).
 */

import React, { useState } from "react";
import { Search, X, UserPlus, Check } from "lucide-react";

type Range = "week" | "all";

const LeaderboardPage: React.FC = () => {
  const [range, setRange] = useState<Range>("week");
  const [search, setSearch] = useState("");
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  /**
   * TODO (Claude Stark): wire this to the friends API, e.g.
   *   await apiService.post(`/friends/request`, { targetUserId });
   * Keep the optimistic state update so the button flips to "sent" immediately.
   */
  const handleSendFriendRequest = (playerId: string) => {
    setSentRequests((prev) => {
      const next = new Set(prev);
      next.add(playerId);
      return next;
    });
  };

  // Both are consumed inside the row-render TODO template below.
  // Touched here so the linter doesn't flag them while Stark wires the API.
  void sentRequests;
  void handleSendFriendRequest;

  return (
    <div className="leaderboard-page-root">
      {/* ── Dark hero strip ──────────────────────────────────────────── */}
      <header className="leaderboard-hero">
        <div className="leaderboard-hero-inner">
          <span className="leaderboard-eyebrow">Rangliste / Leaderboard</span>
          <h1 className="leaderboard-hero-title">
            Die besten Bahnkenner der Schweiz
          </h1>
        </div>
      </header>

      {/* ── Cream content ─────────────────────────────────────────────── */}
      <div className="leaderboard-content">

        {/* Search + time-period toggle row */}
        <div className="leaderboard-controls">
          {/* Search pill */}
          <label className="leaderboard-search" htmlFor="leaderboard-search-input">
            <Search size={16} className="leaderboard-search-icon" aria-hidden="true" />
            <input
              id="leaderboard-search-input"
              className="leaderboard-search-input"
              placeholder="Spieler suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="leaderboard-search-clear"
                aria-label="Suche zurücksetzen"
                onClick={() => setSearch("")}
              >
                <X size={14} />
              </button>
            )}
          </label>

          {/* Time-period toggle */}
          <div
            className="leaderboard-toggle"
            role="tablist"
            aria-label="Zeitraum"
          >
            <button
              type="button"
              role="tab"
              aria-selected={range === "week"}
              className={
                "leaderboard-toggle-btn" +
                (range === "week" ? " leaderboard-toggle-btn--active" : "")
              }
              onClick={() => setRange("week")}
            >
              Diese Woche
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={range === "all"}
              className={
                "leaderboard-toggle-btn" +
                (range === "all" ? " leaderboard-toggle-btn--active" : "")
              }
              onClick={() => setRange("all")}
            >
              Allzeit
            </button>
          </div>
        </div>

        {/*
          ── Top-3 Podium ──────────────────────────────────────────────
          TODO (Claude Stark): take the first three fetched players and
          render one card each. Card variant must match the rank:
            rank 1 → leaderboard-podium-card--gold
            rank 2 → leaderboard-podium-card--silver
            rank 3 → leaderboard-podium-card--bronze

          Expected JSX per card:

            <div className="leaderboard-podium-card leaderboard-podium-card--gold">
              <div className="leaderboard-podium-rank">1</div>
              <div className="leaderboard-podium-name">{player.username}</div>
              <div className="leaderboard-podium-score">
                {player.total.toLocaleString("de-CH")}
              </div>
              <div className="leaderboard-podium-games">
                {player.games} Spiele
              </div>
            </div>

          Hide the entire <div.leaderboard-podium> when fewer than 3
          players exist, OR when `search` is non-empty (filtered view).
        */}

        {/* ── Full leaderboard table ─────────────────────────────────── */}
        <div className="leaderboard-list">
          {/* Dark column header row */}
          <div className="leaderboard-table-head">
            <div className="leaderboard-table-head-cell">#</div>
            <div className="leaderboard-table-head-cell">Spieler</div>
            <div className="leaderboard-table-head-cell leaderboard-table-head-cell--num">
              Punkte
            </div>
            <div className="leaderboard-table-head-cell leaderboard-table-head-cell--num leaderboard-hide-mob">
              Spiele
            </div>
            <div className="leaderboard-table-head-cell leaderboard-table-head-cell--num leaderboard-hide-tab leaderboard-hide-mob">
              Ø/Spiel
            </div>
            {/* Friend column has no label */}
            <div className="leaderboard-table-head-cell" aria-hidden="true" />
          </div>

          {/* Empty state — shown until the API is wired up */}
          <div className="leaderboard-empty">
            {search
              ? "No players match your search."
              : "No players to show yet."}
          </div>

          {/*
            TODO (Claude Stark): map over fetched players (rank 1 = first
            element). Filter by `search` (case-insensitive substring on
            player.username). Expected JSX per row:

              <div
                key={player.id}
                className={`leaderboard-row${isMe ? " leaderboard-row--you" : ""}`}
              >
                <div
                  className={
                    "leaderboard-rank" +
                    (rank === 1 ? " leaderboard-rank--gold"
                      : rank === 2 ? " leaderboard-rank--silver"
                      : rank === 3 ? " leaderboard-rank--bronze"
                      : "")
                  }
                >
                  {rank}
                </div>
                <div className="leaderboard-name">{player.username}</div>
                <div className="leaderboard-score">
                  {player.total.toLocaleString("de-CH")}
                </div>
                <div className="leaderboard-games leaderboard-hide-mob">
                  {player.games}
                </div>
                <div className="leaderboard-avg leaderboard-hide-tab leaderboard-hide-mob">
                  {player.avg}
                </div>

                {/ Friend-request action — hide on own row /}
                {isMe ? (
                  <div className="leaderboard-friend-cell leaderboard-friend-cell--self" />
                ) : (
                  <div className="leaderboard-friend-cell">
                    <FriendButton
                      playerId={player.id}
                      sent={sentRequests.has(player.id)}
                      onClick={() => handleSendFriendRequest(player.id)}
                    />
                  </div>
                )}
              </div>

            Use the `<FriendButton>` helper exported from this file.
          */}
        </div>
      </div>
    </div>
  );
};

/* ── Friend-request button (re-usable) ────────────────────────────────
 * Exposed for Claude Stark to drop into rendered rows.
 * Default state:    "+ user" outline, charcoal → red on hover
 * Sent state:       green check, disabled, no hover change           */
export const FriendButton: React.FC<{
  playerId: string;
  sent: boolean;
  onClick: () => void;
}> = ({ playerId, sent, onClick }) => (
  <button
    type="button"
    className={
      "leaderboard-friend-btn" + (sent ? " leaderboard-friend-btn--sent" : "")
    }
    aria-label={
      sent
        ? "Freundschaftsanfrage gesendet"
        : `Freundschaftsanfrage an Spieler ${playerId} senden`
    }
    title={sent ? "Anfrage gesendet" : "Freundschaftsanfrage senden"}
    onClick={sent ? undefined : onClick}
    disabled={sent}
  >
    {sent ? <Check size={15} strokeWidth={2.5} /> : <UserPlus size={15} strokeWidth={2} />}
  </button>
);

export default LeaderboardPage;
