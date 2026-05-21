"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { GameResultDTO } from "@/types/gameResult";

const MEDAL = ["🥇", "🥈", "🥉"];

// Verdict label shown next to each player on the ranking list — same
// thresholds as the design mockup so the tone matches.
const getVerdict = (pts: number): string => {
  if (pts >= 900) return "SBB-Insider 🚆";
  if (pts >= 600) return "Sehr gut!";
  if (pts >= 350) return "Solide.";
  return "Üben nicht vergessen.";
};

const EndLeaderboardPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const gameId = Number(params.id);

  const apiService = useApi();

  const [gameResult, setGameResult] = useState<GameResultDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user: currentUser, token, softLogout } = useAuth();

  useEffect(() => {
    if (!gameId || !currentUser || !token) return;

    const fetchLeaderboard = async () => {
      try {
        const response = await apiService.get<GameResultDTO>(`/game/${gameId}/leaderboard`, {
          headers: { userId: currentUser.userId.toString(), token },
        });
        setGameResult(response);
      } catch (e) {
        console.error("Leaderboard fetch error:", e);
        setErrorMessage("Rangliste konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [gameId, currentUser, token, apiService]);

  if (loading) return <div className="page-loading">Lade Rangliste…</div>;
  if (!gameResult) {
    return (
      <div className="page-center">
        <div className="sbb-card sbb-card--bordered sbb-card-pad-lg" style={{ maxWidth: 460 }}>
          <span className="label">Fehler</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            Keine Ergebnisse
          </h2>
          {errorMessage && <p style={{ marginTop: 8, color: "var(--grey)" }}>{errorMessage}</p>}
          <button
            type="button"
            className="sbb-btn sbb-btn--primary sbb-btn--md"
            style={{ marginTop: 22 }}
            onClick={() => router.push("/lobbies")}
          >
            Zurück zu den Lobbies
          </button>
        </div>
      </div>
    );
  }

  const totalScores = [...(gameResult.scores ?? [])].sort(
    (a, b) => (b.points ?? 0) - (a.points ?? 0)
  );
  const usernames = gameResult.usernames ?? {};
  const numRounds = gameResult.rounds?.length ?? 0;
  const getName = (userId: number) => usernames[userId] ?? `User ${userId}`;

  // Build the podium so the gold (winner) is always the tallest centre
  // step regardless of how many players actually exist. With one player
  // we show only the gold step; with two, silver + gold; with three+ the
  // classic silver | gold | bronze arrangement.
  type PodiumCell = {
    entry: typeof totalScores[number];
    rank: 1 | 2 | 3;
    height: number;
    color: string;
  };
  const podiumCells: PodiumCell[] = [];
  if (totalScores[1]) {
    podiumCells.push({ entry: totalScores[1], rank: 2, height: 120, color: "var(--grey-l)" });
  }
  if (totalScores[0]) {
    podiumCells.push({ entry: totalScores[0], rank: 1, height: 160, color: "var(--gold)" });
  }
  if (totalScores[2]) {
    podiumCells.push({ entry: totalScores[2], rank: 3, height: 96, color: "#CD7F32" });
  }

  const handleNavigate = (path: string) => {
    if (currentUser?.username?.startsWith("guest_")) {
      softLogout();
    }
    router.push(path);
  };

  return (
    <div className="end-root">
      <div className="end-shell">
        <div className="end-head">
          <span className="label">Spielende / Game Over</span>
          <h1>Rangliste</h1>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--grey-l)",
              letterSpacing: "0.14em",
              marginTop: 8,
              textTransform: "uppercase",
            }}
          >
            {numRounds} Runde{numRounds !== 1 ? "n" : ""}
          </div>
        </div>

        {/* Podium — order is silver | gold | bronze when all three exist;
            for 1–2 players we only render the cells that actually have
            entries, with gold (winner) always the tallest. */}
        {podiumCells.length > 0 && (
          <div className="end-podium">
            {podiumCells.map((cell) => (
              <div key={`podium-${cell.entry.userId}`} className="end-podium-col">
                <div className="end-podium-name">{getName(cell.entry.userId)}</div>
                <div className="end-podium-pts" style={{ color: cell.color }}>
                  {cell.entry.points}
                </div>
                <div
                  className="end-podium-step"
                  style={{ height: cell.height, background: cell.color }}
                >
                  <span>{cell.rank}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ranking list */}
        {totalScores.map((p, i) => {
          const isMe = currentUser && p.userId === currentUser.userId;
          return (
            <div
              key={`rank-${p.userId}`}
              className={`end-rank-row ${isMe ? "is-you" : ""}`}
            >
              <div
                className="end-rank-num"
                style={{
                  color:
                    i === 0
                      ? "var(--gold)"
                      : i === 1
                      ? "var(--grey-l)"
                      : i === 2
                      ? "#CD7F32"
                      : "var(--grey-l)",
                }}
              >
                {MEDAL[i] ?? `#${i + 1}`}
              </div>
              <div className="end-rank-name">
                {getName(p.userId)}
                {isMe && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--red)",
                      marginLeft: 8,
                      letterSpacing: "0.08em",
                    }}
                  >
                    · DU
                  </span>
                )}
              </div>
              <div className="end-rank-pts">{p.points}</div>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 11,
                  color: "var(--grey-l)",
                  flexShrink: 0,
                  minWidth: 120,
                  textAlign: "right",
                }}
              >
                {getVerdict(p.points ?? 0)}
              </div>
            </div>
          );
        })}

        {/* Per-round breakdown */}
        <div style={{ marginTop: 28, color: "var(--grey-l)" }}>
          {gameResult.rounds?.map((round) => (
            <div key={`round-${round.roundNumber}`} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--grey-l)",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Runde {round.roundNumber}
              </div>
              {round.scores ? (
                Object.entries(round.scores)
                  .sort(([, a], [, b]) => b - a)
                  .map(([uid, score]) => {
                    const dist = round.distances?.[Number(uid)];
                    return (
                      <div
                        key={`r${round.roundNumber}-${uid}`}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "8px 14px",
                          background: "#1A1714",
                          marginBottom: 2,
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          color: "var(--white)",
                        }}
                      >
                        <span>{getName(Number(uid))}</span>
                        <span style={{ display: "flex", gap: 18 }}>
                          {dist != null && (
                            <span style={{ color: "var(--grey-l)" }}>
                              {Math.round(dist)} km
                            </span>
                          )}
                          <span>{score} Pkt</span>
                        </span>
                      </div>
                    );
                  })
              ) : (
                <div style={{ fontStyle: "italic", color: "var(--grey)" }}>Keine Daten</div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="end-actions">
          <button
            type="button"
            className="sbb-btn sbb-btn--primary sbb-btn--lg"
            onClick={() => handleNavigate("/lobbies")}
          >
            Nochmal spielen
          </button>
          <button
            type="button"
            className="sbb-btn sbb-btn--outline sbb-btn--lg"
            onClick={() => handleNavigate("/leaderboard")}
          >
            Globale Rangliste
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndLeaderboardPage;
