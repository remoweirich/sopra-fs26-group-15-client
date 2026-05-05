"use client";

/**
 * RoundOverview — shown between rounds (gameState === "BETWEEN_ROUNDS")
 *
 * Design: SBB-styled black header with line/route/round, full-bleed map
 * left, score+ranking sidebar right with sticky next-round footer button.
 * Stacks on mobile (map top, panels below).
 *
 * Map markers (MapLibre via maplibre-react-components):
 *   - Actual train position: green dot + pulsing dashed ring + TATSÄCHLICH label
 *   - User guess: red SBB teardrop + DU label (anchored at tip)
 *   - Other players: colored dot + username
 *   - Dashed red line connecting user guess → actual position
 *
 * Backend logic preserved 1:1:
 *   - publish(/app/game/{id}/ready, READY_FOR_NEXT_ROUND) on click
 *   - End-game branch when currentRound === maxRounds → /game/{id}/leaderboard
 *   - userId from useLocalStorage, gameId from useParams
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import "maplibre-gl/dist/maplibre-gl.css";
import { RMap, RMarker, RSource, RLayer } from "maplibre-react-components";
import { Train } from "@/types/train";
import { Message } from "@/types/message";
import { UserResult } from "@/types/user";

/* ── Funny German comments per 100-point step ─────────────────────────── */
const COMMENTS_BY_POINTS: [number, string][] = [
  [1000, "Volltreffer! Bist du SBB-Mitarbeiter? 🚨"],
  [900,  "Verdammt präzise. Hast du den Fahrplan auswendig?"],
  [800,  "Lokführer-verdächtig. Sehr stark."],
  [700,  "Stark! Du kennst die SBB-Strecken im Schlaf."],
  [600,  "Anständig! Pendler-Niveau."],
  [500,  "Solide. Im richtigen Kanton zumindest."],
  [400,  "Halbwegs orientiert. Halbwegs."],
  [300,  "Knapp daneben — aber wenigstens in der Schweiz."],
  [200,  "Naja... zumindest auf dem richtigen Kontinent."],
  [100,  "Echt? Bayern? Mutig."],
  [0,    "Das ist der Atlantik. Der Zug fährt in der Schweiz."],
];

const getComment = (pts: number): string => {
  for (const [t, msg] of COMMENTS_BY_POINTS) {
    if (pts >= t) return msg;
  }
  return COMMENTS_BY_POINTS[COMMENTS_BY_POINTS.length - 1][1];
};

const getStamp = (pts: number): { label: string; color: string } => {
  if (pts >= 800) return { label: "MEISTER",       color: "var(--gs-green)" };
  if (pts >= 500) return { label: "SOLIDE",        color: "var(--gs-gold)"  };
  if (pts >= 200) return { label: "VERSUCH",       color: "var(--gs-grey)"  };
  return            { label: "WO WARST DU?!", color: "var(--gs-red)"   };
};

interface RoundOverviewProps {
  train: Train | null;
  results: UserResult[];
  currentRound: number | null;
  maxRounds: number | null;
  publish: (destination: string, body: Message) => void;
  getPlayerColor: (userId: string) => string;
}

const RoundOverview: React.FC<RoundOverviewProps> = ({
  train, results, currentRound, maxRounds, publish, getPlayerColor
}) => {
  const router = useRouter();
  const { value: userId } = useLocalStorage<string>("userId", "1");
  const { id: gameId } = useParams<{ id: string }>();

  const [mounted, setMounted] = useState(false);
  const [readyForNextRound, setReadyForNextRound] = useState(false);
  const [stampVisible, setStampVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setStampVisible(true), 250);
    return () => clearTimeout(t);
  }, []);

  // Sort results — fixed bug (originally cross-compared roundPoints and totalPoints)
  const sortedRoundResults = useMemo(
    () => [...results].sort((a, b) => b.roundPoints - a.roundPoints),
    [results]
  );
  const sortedTotalResults = useMemo(
    () => [...results].sort((a, b) => b.totalPoints - a.totalPoints),
    [results]
  );

  // Find current user's result for score panel
  const userIdNum = parseInt(userId);
  const myResult = results.find(r => r.userId === userIdNum);
  const myDistance = myResult?.distance ?? 0;
  const myRoundPts = myResult?.roundPoints ?? 0;
  const myTotalPts = myResult?.totalPoints ?? 0;
  const myCoordX = myResult?.xCoordinate;
  const myCoordY = myResult?.yCoordinate;

  const comment = getComment(myRoundPts);
  const stamp = getStamp(myRoundPts);

  const isFinal = currentRound !== null && currentRound === maxRounds;
  const medals = ["🥇", "🥈", "🥉"];

  const handleReadyForNextRound = () => {
    if (readyForNextRound) return;
    setReadyForNextRound(true);
    publish(`/app/game/${gameId}/ready`, {
      type: "READY_FOR_NEXT_ROUND",
      payload: {
        userId: userId,
        isReady: true
      }
    });
  };

  const handleEndGame = () => {
    router.push(`/game/${gameId}/leaderboard`);
  };

  // ── Dashed line (user guess → actual position) as GeoJSON ──
  const dashLineGeoJson = useMemo(() => {
    if (
      myCoordX === undefined || myCoordY === undefined ||
      train?.currentX === undefined || train?.currentY === undefined ||
      train?.currentX === null || train?.currentY === null
    ) return null;
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [myCoordY, myCoordX],
          [train.currentY, train.currentX]
        ]
      }
    };
  }, [myCoordX, myCoordY, train?.currentX, train?.currentY]);

  return (
    <div className="round-result-page">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="round-result-header">
        <div className="round-result-header-line">{train?.line?.name ?? "—"}</div>
        <div className="round-result-header-info">
          <div className="round-result-header-route">
            {train?.lineOrigin?.stationName ?? "—"}
            <span className="round-result-header-arrow">→</span>
            {train?.lineDestination?.stationName ?? "—"}
          </div>
          <div className="round-result-header-meta">
            <span className="round-result-header-meta-label">JETZT</span>
            <span> · Zwischen {train?.lastLeavingStation?.stationName ?? "—"} &amp; {train?.nextPendingStation?.stationName ?? "—"}</span>
          </div>
        </div>
        <div className="round-result-header-round">
          RUNDE
          <span className="round-result-header-round-num">
            {currentRound ?? "—"}/{maxRounds ?? "—"}
          </span>
        </div>
      </header>

      {/* ── Body: map + sidebar ───────────────────────────────────── */}
      <div className="round-result-body">
        {/* Map */}
        <div className="round-result-map">
          {/* Legend (top-left overlay) */}
          <div className="round-result-legend">
            <div className="round-result-legend-item">
              <span className="round-result-legend-dot round-result-legend-dot--actual" aria-hidden="true" />
              Tatsächlich
            </div>
            <div className="round-result-legend-item">
              <span className="round-result-legend-dot round-result-legend-dot--you" aria-hidden="true" />
              Du
            </div>
            <div className="round-result-legend-item">
              <span className="round-result-legend-dot round-result-legend-dot--others" aria-hidden="true" />
              Mitspieler
            </div>
          </div>

          {mounted && (
            <RMap
              minZoom={6}
              initialCenter={[
                train?.currentY ?? 7.4707,
                train?.currentX ?? 46.95
              ]}
              initialZoom={9}
              mapStyle="https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json"
            >
              {/* Dashed line: user guess → actual position */}
              {dashLineGeoJson && (
                <>
                  <RSource
                    id="round-result-dashline-src"
                    type="geojson"
                    data={dashLineGeoJson}
                  />
                  <RLayer
                    id="round-result-dashline"
                    source="round-result-dashline-src"
                    type="line"
                    paint={{
                      "line-color": "#EB0000",
                      "line-width": 2.5,
                      "line-dasharray": [3, 2],
                      "line-opacity": 0.75
                    }}
                  />
                </>
              )}

              {/* Actual position — green pulsing marker */}
              {train?.currentX != null && train?.currentY != null && (
                <RMarker
                  longitude={train.currentY}
                  latitude={train.currentX}
                  initialAnchor="center"
                >
                  <div className="round-result-actual-marker">
                    <div className="round-result-actual-ring" />
                    <div className="round-result-actual-dot" />
                    <div className="round-result-actual-label">TATSÄCHLICH</div>
                  </div>
                </RMarker>
              )}

              {/* Player guesses */}
              {sortedRoundResults.map((result) => {
                const isMe = result.userId === userIdNum;
                if (isMe) {
                  return (
                    <RMarker
                      key={`guess-${result.userId}`}
                      longitude={result.yCoordinate}
                      latitude={result.xCoordinate}
                      initialAnchor="bottom"
                    >
                      <div className="round-result-you-pin">
                        <div className="round-result-you-label">DU</div>
                        <svg width="28" height="38" viewBox="0 0 28 38" aria-hidden="true">
                          <path
                            d="M14 1 C 6.5 1, 1 6.5, 1 14 C 1 23.5, 14 37, 14 37 C 14 37, 27 23.5, 27 14 C 27 6.5, 21.5 1, 14 1 Z"
                            fill="#EB0000"
                            stroke="white"
                            strokeWidth="2.5"
                          />
                          <circle cx="14" cy="14" r="4.2" fill="white" />
                        </svg>
                      </div>
                    </RMarker>
                  );
                }
                const playerColor = getPlayerColor(result.userId.toString());
                return (
                  <RMarker
                    key={`guess-${result.userId}`}
                    longitude={result.yCoordinate}
                    latitude={result.xCoordinate}
                    initialAnchor="center"
                  >
                    <div className="round-result-other-pin">
                      <div
                        className="round-result-other-label"
                        style={{ color: playerColor }}
                      >
                        {/* TODO: switch to username once UserResult exposes it */}
                        {result.userId}
                      </div>
                      <div
                        className="round-result-other-dot"
                        style={{ background: playerColor }}
                      />
                    </div>
                  </RMarker>
                );
              })}
            </RMap>
          )}
        </div>

        {/* Sidebar */}
        <aside className="round-result-sidebar">
          <div className="round-result-sidebar-scroll">
            {/* Score panel */}
            <section className="round-result-score">
              <div className="round-result-score-row">
                <div className="round-result-score-cell">
                  <div className="round-result-score-label">DISTANZ</div>
                  <div className="round-result-score-value">
                    {Math.round(myDistance)}
                    <span className="round-result-score-unit"> km</span>
                  </div>
                </div>
                <div className="round-result-score-cell">
                  <div className="round-result-score-label">PUNKTE</div>
                  <div className={
                    "round-result-score-value " +
                    (myRoundPts >= 700 ? "round-result-score-value--good"
                      : myRoundPts >= 300 ? "round-result-score-value--ok"
                      : "round-result-score-value--bad")
                  }>
                    +{myRoundPts}
                  </div>
                </div>
                <div className="round-result-score-cell">
                  <div className="round-result-score-label">TOTAL</div>
                  <div className="round-result-score-value">{myTotalPts}</div>
                </div>
              </div>

              <div className="round-result-score-comment-row">
                <div className="round-result-score-comment">„{comment}"</div>
                {stampVisible && (
                  <div
                    className="round-result-score-stamp"
                    style={{ borderColor: stamp.color, color: stamp.color }}
                  >
                    {stamp.label}
                  </div>
                )}
              </div>

              <div className="round-result-score-coords">
                <span aria-hidden="true">📍</span>
                {myCoordX !== undefined && myCoordY !== undefined
                  ? <>{myCoordX.toFixed(2)}°N, {myCoordY.toFixed(2)}°E</>
                  : "—"}
                <span className="round-result-score-coords-arrow">→</span>
                <span className="round-result-score-coords-target">
                  Zwischen {train?.lastLeavingStation?.stationName ?? "—"} &amp; {train?.nextPendingStation?.stationName ?? "—"}
                </span>
              </div>
            </section>

            {/* Ranking */}
            <section className="round-result-ranking">
              <div className="round-result-ranking-header">
                <span className="round-result-ranking-title">ZWISCHENSTAND</span>
                <span className="round-result-ranking-sub">
                  NACH RUNDE {currentRound ?? "—"}
                </span>
              </div>
              {sortedTotalResults.map((result, i) => {
                const isMe = result.userId === userIdNum;
                const playerColor = getPlayerColor(result.userId.toString());
                return (
                  <div
                    key={`total-row-${result.userId}`}
                    className={"round-result-ranking-row " + (isMe ? "round-result-ranking-row--you" : "")}
                  >
                    <div className={"round-result-ranking-rank " + (i < 3 ? "round-result-ranking-rank--medal" : "")}>
                      {i < 3 ? medals[i] : `${i + 1}`}
                    </div>
                    <div
                      className="round-result-ranking-dot"
                      style={{ background: playerColor }}
                      aria-hidden="true"
                    />
                    <div className="round-result-ranking-name">
                      {isMe ? "Du" : `${result.userId}`}
                      {isMe && (
                        <span className="round-result-ranking-name-tag"> · DU</span>
                      )}
                    </div>
                    <div className="round-result-ranking-score">
                      {result.totalPoints}
                    </div>
                  </div>
                );
              })}
            </section>
          </div>

          {/* Sticky footer button */}
          <footer className="round-result-footer">
            {isFinal ? (
              <button
                type="button"
                onClick={handleEndGame}
                className="sbb-btn-home sbb-btn-home--primary round-result-btn"
              >
                Endabrechnung →
              </button>
            ) : !readyForNextRound ? (
              <button
                type="button"
                onClick={handleReadyForNextRound}
                className="sbb-btn-home sbb-btn-home--primary round-result-btn"
              >
                Runde {(currentRound ?? 0) + 1} →
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="sbb-btn-home sbb-btn-home--primary round-result-btn round-result-btn--waiting"
              >
                Warte auf andere Spieler…
              </button>
            )}
          </footer>
        </aside>
      </div>
    </div>
  );
};

export default RoundOverview;