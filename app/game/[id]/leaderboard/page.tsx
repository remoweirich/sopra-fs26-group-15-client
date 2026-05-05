"use client";

/**
 * Final-results page — shown after all rounds of a game finish.
 * Route: /game/[id]/leaderboard
 *
 * Backend wiring 1:1 preserved from the original implementation:
 *   - useApi() hook for the API client
 *   - useAuth() for currentUser + token
 *   - App.useApp() for antd toast messages
 *   - GET /game/${gameId}/leaderboard with userId+token headers
 *   - GameResultDTO shape: { rounds[], scores[], usernames }
 *
 * Design ported to the SBB prototype look (black bg, podium, dark ranking
 * cards). The per-round breakdown is kept and re-styled to match.
 */

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { App } from "antd";

interface Score {
    userId: number;
    points: number;
}

interface GuessMessageDTO {
    lat: number;
    lng: number;
}

interface UserGameStatus {
    isReady: boolean;
}

interface Round {
    roundNumber: number;
    train: Record<string, unknown>;
    guessMessages: Record<string, GuessMessageDTO>;
    allUserGameStatuses: Record<string, UserGameStatus>;
    scores: Record<string, Score>;
    distances: Record<string, number>;
}

interface GameResultDTO {
    gameId: number;
    rounds: Round[];
    scores: Score[];
    usernames: Record<string, string>; // userId -> username
}

const LeaderboardPage: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const gameId = Number(params.id);

    const apiService = useApi();
    const { user: currentUser, token } = useAuth();
    const { message } = App.useApp();

    const [gameResult, setGameResult] = useState<GameResultDTO | null>(null);
    const [loading, setLoading] = useState(true);

    // ── Fetch leaderboard (logic identical to original) ─────────────
    useEffect(() => {
        if (!gameId || !currentUser || !token) return;

        const fetchLeaderboard = async () => {
            try {
                const response = await apiService.get<GameResultDTO>(
                    `/game/${gameId}/leaderboard`,
                    {
                        headers: {
                            userId: currentUser.userId.toString(),
                            token: token,
                        },
                    }
                );
                setGameResult(response);
            } catch (e) {
                console.error("Leaderboard fetch error:", e);
                message.error("Endabrechnung konnte nicht geladen werden.");
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [gameId, currentUser, token, apiService, message]);

    // ── Derived data ────────────────────────────────────────────────
    const totalScores = (gameResult?.scores ?? [])
        .slice()
        .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
    const usernames = gameResult?.usernames ?? {};
    const numRounds = gameResult?.rounds?.length ?? 0;
    const numPlayers = totalScores.length;
    const getName = (userId: string | number): string =>
        usernames[userId.toString()] ?? `User ${userId}`;

    // ── Podium: order top-3 as [silver, gold, bronze] ───────────────
    const top3 = totalScores.slice(0, 3);
    const hasFullPodium = top3.length === 3;

    const podiumLayout = hasFullPodium
        ? [
            { score: top3[1], rank: 2, height: 120, color: "var(--gs-grey-light)" },
            { score: top3[0], rank: 1, height: 160, color: "var(--gs-gold)" },
            { score: top3[2], rank: 3, height: 96,  color: "#CD7F32" },
        ]
        : top3.map((s, i) => ({
            score: s,
            rank: i + 1,
            height: 120,
            color:
                i === 0 ? "var(--gs-gold)" :
                i === 1 ? "var(--gs-grey-light)" :
                          "#CD7F32",
        }));

    // ── Loading state ───────────────────────────────────────────────
    if (loading) {
        return (
            <div className="game-end-page">
                <div className="game-end-shell">
                    <div className="game-end-state">Lade Endabrechnung …</div>
                </div>
            </div>
        );
    }

    // ── Empty state ─────────────────────────────────────────────────
    if (!gameResult || totalScores.length === 0) {
        return (
            <div className="game-end-page">
                <div className="game-end-shell">
                    <div className="game-end-header">
                        <span className="game-end-eyebrow">SPIELENDE / GAME OVER</span>
                        <h1 className="game-end-title">Endabrechnung</h1>
                    </div>
                    <div className="game-end-state">Keine Ergebnisse gefunden.</div>
                    <div className="game-end-actions">
                        <Link href="/lobbies" className="game-end-btn game-end-btn--primary">
                            Zurück zu Lobbies
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Render ──────────────────────────────────────────────────────
    return (
        <div className="game-end-page">
            <div className="game-end-shell">

                {/* Header */}
                <div className="game-end-header">
                    <span className="game-end-eyebrow">SPIELENDE / GAME OVER</span>
                    <h1 className="game-end-title">Endabrechnung</h1>
                    <div className="game-end-subtitle">
                        {numRounds} {numRounds === 1 ? "Runde" : "Runden"} · {numPlayers} Spieler
                    </div>
                </div>

                {/* Podium */}
                {top3.length > 0 && (
                    <div className="game-end-podium">
                        {podiumLayout.map((slot, i) => {
                            const isMe = currentUser && slot.score.userId === currentUser.userId;
                            return (
                                <div key={i} className="game-end-podium-col">
                                    <div className="game-end-podium-name" title={getName(slot.score.userId)}>
                                        {getName(slot.score.userId)}
                                        {isMe && <span className="game-end-podium-you"> · DU</span>}
                                    </div>
                                    <div className="game-end-podium-score" style={{ color: slot.color }}>
                                        {(slot.score.points ?? 0).toLocaleString("de-CH")}
                                    </div>
                                    <div
                                        className="game-end-podium-block"
                                        style={{ height: `${slot.height}px`, background: slot.color }}
                                    >
                                        <span>{slot.rank}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Total ranking */}
                <div className="game-end-section-label">Gesamtrangliste</div>
                <div className="game-end-list">
                    {totalScores.map((score, i) => {
                        const isMe = currentUser && score.userId === currentUser.userId;
                        return (
                            <div
                                key={score.userId}
                                className={"game-end-row " + (isMe ? "game-end-row--me" : "")}
                                style={{ animationDelay: `${0.15 + i * 0.05}s` }}
                            >
                                <div className={
                                    "game-end-row-rank " +
                                    (i === 0 ? "game-end-row-rank--1" :
                                     i === 1 ? "game-end-row-rank--2" :
                                     i === 2 ? "game-end-row-rank--3" : "")
                                }>
                                    {i + 1}
                                </div>
                                <div className="game-end-row-name">
                                    <span className="game-end-row-name-text">{getName(score.userId)}</span>
                                    {isMe && <span className="game-end-row-you">DU</span>}
                                </div>
                                <div className="game-end-row-score">
                                    {(score.points ?? 0).toLocaleString("de-CH")}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Per-round breakdown */}
                {gameResult.rounds && gameResult.rounds.length > 0 && (
                    <>
                        <div className="game-end-section-label" style={{ marginTop: "32px" }}>
                            Runden-Details
                        </div>
                        <div className="game-end-rounds">
                            {gameResult.rounds.map((round) => {
                                const roundScores = round.scores
                                    ? Object.entries(round.scores)
                                        .sort(([, a], [, b]) => (b.points ?? 0) - (a.points ?? 0))
                                    : [];
                                return (
                                    <div key={round.roundNumber} className="game-end-round">
                                        <div className="game-end-round-head">
                                            <span className="game-end-round-num">RUNDE {round.roundNumber}</span>
                                        </div>
                                        {roundScores.length > 0 ? (
                                            <div className="game-end-round-list">
                                                {roundScores.map(([userId, score], i) => {
                                                    const dist = round.distances?.[userId];
                                                    const isMe = currentUser && Number(userId) === currentUser.userId;
                                                    return (
                                                        <div
                                                            key={userId}
                                                            className={"game-end-round-row " + (isMe ? "game-end-round-row--me" : "")}
                                                        >
                                                            <span className="game-end-round-row-rank">{i + 1}</span>
                                                            <span className="game-end-round-row-name">{getName(userId)}</span>
                                                            {dist != null ? (
                                                                <span className="game-end-round-row-dist">
                                                                    {Math.round(dist)} km
                                                                </span>
                                                            ) : (
                                                                <span className="game-end-round-row-dist">—</span>
                                                            )}
                                                            <span className="game-end-round-row-score">
                                                                {(score.points ?? 0).toLocaleString("de-CH")}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="game-end-round-empty">Keine Daten</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Actions */}
                <div className="game-end-actions">
                    <button
                        type="button"
                        className="game-end-btn game-end-btn--primary"
                        onClick={() => router.push("/lobbies")}
                    >
                        Nochmal spielen
                    </button>
                    <Link href="/leaderboard" className="game-end-btn game-end-btn--outline">
                        Rangliste
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default LeaderboardPage;