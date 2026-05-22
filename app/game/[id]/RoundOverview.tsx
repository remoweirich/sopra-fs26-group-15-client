"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import "maplibre-gl/dist/maplibre-gl.css";
import { RMap, RMarker, RSource, RLayer } from "maplibre-react-components";
import { Train } from "@/types/train";
import { Message } from "@/types/message";
import { UserResult, MyUserDTO, UserDTO } from "@/types/user";
import { useAuth } from "@/context/AuthContext";
import { COMMENTS } from "@/utils/comments";

interface RoundOverviewProps {
  readonly train: Train | null;
  readonly results: UserResult[];
  readonly currentRound: number | null;
  readonly maxRounds: number | null;
  readonly publish: (destination: string, body: Message) => void;
  readonly getPlayerColor: (userId: string) => string;
}

// ── Stamp verdict based on round points ────────────────────────────────────
const getStamp = (pts: number): { label: string; cls: string } => {
  if (pts >= 800) return { label: "MEISTER", cls: "is-master" };
  if (pts >= 500) return { label: "SOLIDE", cls: "is-solid" };
  if (pts >= 200) return { label: "VERSUCH", cls: "is-solid" };
  return { label: "WO WARST DU?!", cls: "is-bad" };
};

const RoundOverview: React.FC<RoundOverviewProps> = ({
  train,
  results,
  currentRound,
  maxRounds,
  publish,
  getPlayerColor,
}) => {
  const { token } = useAuth();
  const apiService = useApi();
  const router = useRouter();
  const { value: userId } = useLocalStorage<string>("userId", "1");
  const { id: gameId } = useParams();

  const [mounted, setMounted] = useState(false);
  const [readyForNextRound, setReadyForNextRound] = useState(false);
  const [usernamesMap, setUsernamesMap] = useState<{ [userId: number]: string }>({});

  // Derive sorted lists from props — no setState in effect needed.
  const sortedRoundResults = useMemo(
    () => [...results].sort((a, b) => b.roundPoints - a.roundPoints),
    [results]
  );
  const sortedTotalResults = useMemo(
    () => [...results].sort((a, b) => b.totalPoints - a.totalPoints),
    [results]
  );

  useEffect(() => {
    // SSR-only guard for map mount — read from window inside the effect's
    // callback rather than setting state synchronously.
    if (typeof window !== "undefined") setMounted(true);
  }, []);

  useEffect(() => {
    const fetchUsernames = async () => {
      if (!token) return;
      for (const result of sortedRoundResults) {
        try {
          const data = await apiService.get<MyUserDTO | UserDTO>(`/users/${result.userId}`, {
            headers: { token },
          });
          setUsernamesMap((prev) => ({ ...prev, [result.userId]: data.username }));
        } catch (err) {
          //console.log("Failed to fetch username for userId " + result.userId, err);
        }
      }
    };
    fetchUsernames();
  }, [sortedRoundResults, token, apiService]);

  const handleReadyForNextRound = () => {
    if (readyForNextRound) return;
    setReadyForNextRound(true);
    publish(`/app/game/${gameId}/ready`, {
      type: "READY_FOR_NEXT_ROUND",
      payload: {
        userId: userId,
        isReady: true,
      },
    });
  };

  const handleEndGame = () => {
    router.push(`/game/${gameId}/leaderboard`);
  };

  const loadComment = () => {
    const result = sortedRoundResults.find((r) => r.userId === parseInt(userId));
    if (!result) return "";
    const comment = COMMENTS.find(
      (c) => c[0] <= result.distance && result.distance <= c[1]
    );
    return comment ? comment[2] : "";
  };

  // ── Compute "my" cell values for top score panel ─────────────────────────
  const myResult = sortedRoundResults.find((r) => r.userId === parseInt(userId));
  const myDistance = myResult?.distance;
  const myRoundPts = myResult?.roundPoints ?? 0;
  const myTotalPts = myResult?.totalPoints ?? 0;
  const stamp = getStamp(myRoundPts);
  const isFinal = currentRound === maxRounds;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="result-layout">
      {/* Compact header strip */}
      <div className="result-head">
        <div className="result-head-row">
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <div className="result-head-line">{train?.line.name ?? "—"}</div>
            <div style={{ minWidth: 0 }}>
              <div className="result-head-route">
                {train?.lineOrigin?.stationName} → {train?.lineDestination?.stationName}
              </div>
              <div className="result-head-sub">
                {train?.lastLeavingStation?.stationName} → {train?.nextPendingStation?.stationName}
              </div>
            </div>
          </div>
          <div className="result-head-round">
            RUNDE <span>{currentRound}/{maxRounds}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="result-body">
        {/* Map */}
        <div className="result-map">
          {mounted && (
            <RMap
              minZoom={6}
              initialCenter={[train?.currentY ?? 7.4707, train?.currentX ?? 46.95]}
              initialZoom={9}
              mapStyle="https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json"
            >
              {/* Dashed line from MY guess to the train's actual position.
                  Only rendered once both endpoints exist. The line uses
                  maplibre's GeoJSON source + line layer with dash pattern. */}
              {myResult && train?.currentX != null && train?.currentY != null && (
                <>
                  <RSource
                    id="guess-to-train-src"
                    type="geojson"
                    data={{
                      type: "Feature",
                      properties: {},
                      geometry: {
                        type: "LineString",
                        coordinates: [
                          [myResult.yCoordinate, myResult.xCoordinate],
                          [train.currentY, train.currentX],
                        ],
                      },
                    }}
                  />
                  <RLayer
                    id="guess-to-train-layer"
                    type="line"
                    source="guess-to-train-src"
                    paint={{
                      "line-color": "#EB0000",
                      "line-width": 2.5,
                      "line-dasharray": [3, 2],
                      "line-opacity": 0.75,
                    }}
                  />
                </>
              )}

              {/* Train's actual position — solid green dot with a halo
                  and a "TATSÄCHLICH" label below. */}
              {train?.currentX != null && train?.currentY != null && (
                <RMarker
                  longitude={train.currentY}
                  latitude={train.currentX}
                  initialAnchor="center"
                >
                  <div style={{ position: "relative", pointerEvents: "none" }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#2D8C5C",
                        border: "3.5px solid white",
                        boxShadow: "0 0 0 2px #2D8C5C, 0 3px 8px rgba(0,0,0,0.35)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 30,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#2D8C5C",
                        color: "white",
                        fontFamily: "var(--font-mono)",
                        fontSize: 9.5,
                        fontWeight: 800,
                        padding: "3px 9px",
                        letterSpacing: "0.14em",
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                      }}
                    >
                      TATSÄCHLICH
                    </div>
                  </div>
                </RMarker>
              )}

              {/* Per-player guess markers. The current user gets the red
                  SBB teardrop with a "DU" label; everyone else gets a
                  colored circle with their name above. */}
              {sortedRoundResults.map((result) => {
                const isMe = result.userId === Number.parseInt(userId);
                const color = getPlayerColor(result.userId.toString());
                const label = isMe ? "DU" : usernamesMap[result.userId] ?? `User ${result.userId}`;
                return (
                  <RMarker
                    key={`guess-${result.userId}-${result.xCoordinate}-${result.yCoordinate}`}
                    longitude={result.yCoordinate}
                    latitude={result.xCoordinate}
                    initialAnchor={isMe ? "bottom" : "center"}
                  >
                    {isMe ? (
                      // Red SBB teardrop for the current player
                      <div style={{ position: "relative", pointerEvents: "none" }}>
                        <svg
                          width="28"
                          height="38"
                          viewBox="0 0 28 38"
                          style={{
                            filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.45))",
                            display: "block",
                          }}
                        >
                          <path
                            d="M14 1 C 6.5 1, 1 6.5, 1 14 C 1 23.5, 14 37, 14 37 C 14 37, 27 23.5, 27 14 C 27 6.5, 21.5 1, 14 1 Z"
                            fill="#EB0000"
                            stroke="white"
                            strokeWidth="2.5"
                          />
                          <circle cx="14" cy="14" r="4.2" fill="white" />
                        </svg>
                        <div
                          style={{
                            position: "absolute",
                            top: -22,
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "#EB0000",
                            color: "white",
                            fontFamily: "var(--font-mono)",
                            fontSize: 9,
                            fontWeight: 800,
                            padding: "3px 8px",
                            letterSpacing: "0.14em",
                            whiteSpace: "nowrap",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                          }}
                        >
                          {label}
                        </div>
                      </div>
                    ) : (
                      // Coloured circle for competitors
                      <div style={{ position: "relative", pointerEvents: "none" }}>
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: color,
                            border: "2.5px solid white",
                            boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: -22,
                            left: "50%",
                            transform: "translateX(-50%)",
                            color,
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            fontWeight: 700,
                            textShadow:
                              "0 0 3px white, 0 0 3px white, 0 0 3px white, 1px 1px 0 white, -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {label}
                        </div>
                      </div>
                    )}
                  </RMarker>
                );
              })}
            </RMap>
          )}

          {/* Legend overlay */}
          <div style={{ position: "absolute", top: 14, left: 14, zIndex: 5 }}>
            <div className="result-legend">
              <div className="result-legend-item">
                <span
                  className="result-legend-dot"
                  style={{ background: "var(--green)" }}
                />
                <span>Tatsächlich</span>
              </div>
              <div className="result-legend-item">
                <span
                  className="result-legend-dot"
                  style={{ background: "var(--red)" }}
                />
                <span>Du</span>
              </div>
              <div className="result-legend-item">
                <span
                  className="result-legend-dot"
                  style={{ background: "var(--grey-l)", borderColor: "var(--white)" }}
                />
                <span>Mitspieler</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right aside */}
        <div className="result-aside">
          <div className="result-aside-scroll">
            {/* Score panel */}
            <div className="result-score-panel">
              <div className="result-score-grid">
                <div className="result-score-cell">
                  <div className="result-score-cell-l">DISTANZ</div>
                  <div className="result-score-cell-v">
                    {myDistance != null && myDistance<9999? `${Math.round(myDistance)} km` : "—"}
                  </div>
                </div>
                <div className="result-score-cell">
                  <div className="result-score-cell-l">PUNKTE</div>
                  <div
                    className={`result-score-cell-v ${
                      myRoundPts >= 700 ? "is-good" : myRoundPts >= 300 ? "is-mid" : "is-bad"
                    }`}
                  >
                    +{myRoundPts}
                  </div>
                </div>
                <div className="result-score-cell">
                  <div className="result-score-cell-l">TOTAL</div>
                  <div className="result-score-cell-v">{myTotalPts}</div>
                </div>
              </div>

              <div className="result-comment">
                <div style={{ flex: 1 }}>“{loadComment()}”</div>
                <div className={`result-stamp ${stamp.cls}`}>{stamp.label}</div>
              </div>

              <div className="result-actual">
                <b>{train?.lastLeavingStation?.stationName}</b>
                {" "}→{" "}
                <b>{train?.nextPendingStation?.stationName}</b>
              </div>
            </div>

            {/* Ranking */}
            <div className="result-ranking-panel">
              <div className="result-ranking-head">
                <span className="result-ranking-head-l">ZWISCHENSTAND</span>
                <span className="result-ranking-head-r">NACH RUNDE {currentRound}</span>
              </div>
              {sortedTotalResults.map((p, i) => {
                const isMe = p.userId === parseInt(userId);
                const name = isMe ? "DU" : usernamesMap[p.userId] ?? `User ${p.userId}`;
                return (
                  <div
                    key={`total-${p.userId}`}
                    className={`result-ranking-row ${isMe ? "is-you" : ""}`}
                  >
                    <div
                      className={`result-ranking-row-rank ${i >= 3 ? "is-rest" : ""}`}
                    >
                      {i < 3 ? medals[i] : `${i + 1}`}
                    </div>
                    <div
                      className="result-ranking-row-color"
                      style={{ background: getPlayerColor(p.userId.toString()) }}
                    />
                    <div className="result-ranking-row-name">{name}</div>
                    <div className="result-ranking-row-pts">{p.totalPoints}</div>
                  </div>
                );
              })}
            </div>

            {/* This round breakdown */}
            <div className="result-ranking-panel">
              <div className="result-ranking-head">
                <span className="result-ranking-head-l">DIESE RUNDE</span>
              </div>
              {sortedRoundResults.map((r) => {
                const isMe = r.userId === parseInt(userId);
                const name = isMe ? "DU" : usernamesMap[r.userId] ?? `User ${r.userId}`;
                return (
                  <div
                    key={`round-${r.userId}`}
                    className={`result-ranking-row ${isMe ? "is-you" : ""}`}
                  >
                    <div
                      className="result-ranking-row-color"
                      style={{ background: getPlayerColor(r.userId.toString()) }}
                    />
                    <div className="result-ranking-row-name">
                      {name}
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          color: "var(--grey)",
                          marginLeft: 8,
                        }}
                      >
                        {r.distance<9999 ? Math.round(r.distance):"-"} km
                      </span>
                    </div>
                    <div className="result-ranking-row-pts">+{r.roundPoints}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer next-button */}
          <div className="result-aside-footer">
            {isFinal ? (
              <button
                type="button"
                className="sbb-btn sbb-btn--dark sbb-btn--lg sbb-btn--full"
                onClick={handleEndGame}
              >
                Rangliste →
              </button>
            ) : !readyForNextRound ? (
              <button
                type="button"
                className="sbb-btn sbb-btn--primary sbb-btn--lg sbb-btn--full"
                onClick={handleReadyForNextRound}
              >
                Bereit für Runde {(currentRound ?? 0) + 1} →
              </button>
            ) : (
              <button
                type="button"
                className="sbb-btn sbb-btn--secondary sbb-btn--lg sbb-btn--full"
                disabled
              >
                Warte auf andere Spieler…
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundOverview;
