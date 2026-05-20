"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { useApi } from "@/hooks/useApi";
import { Train } from "@/types/train";
import ResyncDTO  from "@/types/resyncDTO";
import "maplibre-gl/dist/maplibre-gl.css";
import { RMap, RMarker } from "maplibre-react-components";
import { MapLayerMouseEvent, MapLayerTouchEvent } from "maplibre-gl";
import RoundOverview from "./RoundOverview";
import LoadingScreen from "./LoadingScreen";
import { latLngToEpsg, epsgToLatLng } from "./coordinateConverter";
import { GameMessage, ResultDTO, RoundStartDTO } from "@/types/gameMessage";
import { UserResult } from "@/types/user";
import SBBClock from "./SBBClock";
import { playerColors } from "@/utils/colors";

type GameState = "ROUND_IN_PROGRESS" | "LOADING" | "BETWEEN_ROUNDS" | "GAME_ENDED";

const GamePage: React.FC = () => {
  const router = useRouter();
  const { id: gameId } = useParams<{ id: string }>();
  const { user: currentUser, token, login, logout, isLoading } = useAuth();
  const { subscribe, publish, isConnected } = useWebSocket();
  const apiService = useApi();

  const [gameState, setGameState] = useState<GameState | null>("LOADING");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45);
  const secondsRef = useRef<number>(45);
  const [guessSubmitted, setGuessSubmitted] = useState<boolean>(false);
  const [clickPosition, setClickPosition] = useState<null | [number, number]>(null);
  const [currentTrain, setCurrentTrain] = useState<Train | null>(null);
  const [departureTime, setDepartureTime] = useState<string | null>(null);
  const [arrivalTime, setArrivalTime] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [maxRounds, setMaxRounds] = useState<number | null>(null);
  const [results, setResults] = useState<{
    currentRound: number;
    userResults: UserResult[];
    train: Train;
  } | null>(null);
  const [stationPins, setStationPins] = useState<[[number, number], [number, number]] | null>(null);
  const [mounted] = useState(typeof window !== "undefined");

  const epochToTime = (epoch: number | null): string => {
    if (!epoch) return "";
    return new Date(epoch).toLocaleTimeString("de-CH", {
      timeZone: "Europe/Zurich",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const playerColorMap = useRef<Record<string, string>>({});

  const getPlayerColor = (userId: string) => {
    if (!results) return playerColors[0];
    if (!playerColorMap.current[userId]) {
      const userIdHashMap: (number | null)[] = Array(playerColors.length).fill(null);
      const sortedUserResults = [...results.userResults].sort((a, b) => a.userId - b.userId);
      for (const u of sortedUserResults) {
        let searchKey = u.userId % playerColors.length;
        while (userIdHashMap[searchKey] && sortedUserResults.length <= userIdHashMap.length) {
          searchKey += 1;
        }
        userIdHashMap[searchKey] = u.userId;
        playerColorMap.current[u.userId] = playerColors[searchKey];
      }
    }
    return playerColorMap.current[userId];
  };

  // ── Guess submission ────────────────────────────────────────────────────
  const handleSubmitGuess = async () => {
    if (!clickPosition) return;
    const [lon, lat] = clickPosition;
    const [x, y] = latLngToEpsg(lat, lon);
    const payload = {
      lobbyId: Number(gameId),
      userId: currentUser!.userId,
      xCoordinate: x,
      yCoordinate: y,
    };
    if (!isConnected) return;
    publish(`/app/game/${gameId}/guess`, payload);
    setGuessSubmitted(true);
  };

  const gameStateRef = useRef({ clickPosition, guessSubmitted, handleSubmitGuess });
  useEffect(() => {
    gameStateRef.current = { clickPosition, guessSubmitted, handleSubmitGuess };
  }, [clickPosition, guessSubmitted, handleSubmitGuess]);

  // ── Clock interval (live current time) ──────────────────────────────────
  useEffect(() => {
    const clock = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  // ── Round timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== "ROUND_IN_PROGRESS" || !timerActive) return;
    const timer = setInterval(() => {
      secondsRef.current -= 1;
      setSecondsRemaining(secondsRef.current);
      if (secondsRef.current <= 0 && !gameStateRef.current.guessSubmitted) {
        gameStateRef.current.handleSubmitGuess();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, timerActive]);

  const maxRoundsRef = useRef(maxRounds);
  // ── WebSocket handler ───────────────────────────────────────────────────
  const handleMessage = useCallback((message: GameMessage) => {
    const {
      clickPosition: currentClick,
      guessSubmitted: alreadySubmitted,
      handleSubmitGuess: submitFn,
    } = gameStateRef.current;

    switch (message.type) {
      case "ROUND_START":
        
        setGuessSubmitted(false);
        setClickPosition(null);
        setCurrentTrain(message.payload.train);
        setDepartureTime(epochToTime(message.payload.train.departureTime));
        setArrivalTime(epochToTime(message.payload.train.arrivalTime));
        {
          const origin = message.payload.train.lineOrigin;
          const destination = message.payload.train.lineDestination;
          const originCoords = epsgToLatLng(origin.xCoordinate, origin.yCoordinate);
          const destCoords = epsgToLatLng(destination.xCoordinate, destination.yCoordinate);
          setStationPins([originCoords, destCoords]);
        }
        setCurrentRound(message.payload.roundNumber);
        setMaxRounds(message.payload.maxRounds);
        maxRoundsRef.current = message.payload.maxRounds;
        setGameState("ROUND_IN_PROGRESS");
        if (reloadTimer.current) {
          setSecondsRemaining(reloadTimer.current);
          secondsRef.current = reloadTimer.current;
        }
        else {
          setSecondsRemaining(45);
          secondsRef.current = 45;
        }
        setTimerActive(true);
        break;

      case "ROUND_END":
        if (currentClick && !alreadySubmitted) submitFn();
        setTimerActive(false);
        break;

      case "SCORES":
        {
          const userResults = message.payload.userResults.map((result: UserResult) => {
            const [lat, lng] = epsgToLatLng(result.xCoordinate, result.yCoordinate);
            return { ...result, xCoordinate: lat, yCoordinate: lng };
          });
          setResults({ ...message.payload, userResults });
          const trainPayload = message.payload.train;
          const [trainLat, trainLon] = epsgToLatLng(trainPayload.currentX, trainPayload.currentY);
          const train = { ...trainPayload, currentX: trainLat, currentY: trainLon };
          setCurrentTrain(train);
          setCurrentRound(message.payload.currentRound);
          reloadTimer.current = null;
          setMaxRounds(maxRoundsRef.current); 
        }
        setGameState("BETWEEN_ROUNDS");
        break;
    }
  }, []);

  // ── WebSocket subscribe ─────────────────────────────────────────────────
  // Track whether ROUND_START has actually been received — controls whether
  // we keep re-publishing /ready on every (re)connect. Without this, a
  // WebSocket flicker after the initial /ready means we re-subscribe but
  // never re-announce, and the server has nothing pending to broadcast.
  const roundStarted = useRef(false);
  const isReload = useRef(false);
  
  //detecting reload
  useEffect(() => {
    const key = `game-${gameId}-visited`;
    isReload.current = sessionStorage.getItem(key) === "true";
    sessionStorage.setItem(key, "true");

    const handleBeforeUnload = () => {
        sessionStorage.setItem(key, "true");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [gameId]);

const reloadTimer = useRef<number | null>(null);

useEffect(() => {
    if (!isConnected) return;
    console.log(`[Game] Subscribing to /topic/game/${gameId}`);
    const subscription = subscribe<GameMessage>(`/topic/game/${gameId}`, (update) => {
      console.log("[Game] WS message received:", update);
      if (update.type === "ROUND_START") roundStarted.current = true;
      handleMessage(update);
    });

    if (!roundStarted.current) {
      const t = setTimeout(async () => {
        if (isReload.current) {
          isReload.current = false;
          try {
            const data = await apiService.get<ResyncDTO>(
              `/game/${gameId}/resync`,
              {
                headers: {
                  token: token ?? "",
                  userId: currentUser?.userId?.toString() ?? "",
                },
              }
            );
            if (data.type === "ROUND_START") {
              reloadTimer.current = data.remainingTime-3;
              roundStarted.current = true;
              handleMessage({
                type: "ROUND_START",
                payload: data.payload as RoundStartDTO,
              });
              
              
            } else if (data.type === "SCORES") {
              roundStarted.current = true;
              maxRoundsRef.current = data.maxRounds;
              setMaxRounds(data.maxRounds);
              handleMessage({
                type: "SCORES",
                payload: data.payload as ResultDTO,
              });
            }
          } catch (err) {
            console.error("[Game] Resync failed:", err);
            publish(`/app/game/${gameId}/ready`, {});
          }
        } else {
          console.log(`[Game] Publishing /ready to /app/game/${gameId}/ready`);
          publish(`/app/game/${gameId}/ready`, {});
        }
      }, 250);
      return () => {
        clearTimeout(t);
        if (subscription) subscription.unsubscribe();
      };
    }
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [isConnected, subscribe, publish, gameId, handleMessage]);


  // ── Map click handlers ──────────────────────────────────────────────────
  const handleMapClick = (e: MapLayerMouseEvent) => setClickPosition(e.lngLat.toArray());
  const handleMapClickTouch = (e: MapLayerTouchEvent) => setClickPosition(e.lngLat.toArray());

  const train = currentTrain;

  if (gameState === "BETWEEN_ROUNDS") {
    return (
      <RoundOverview
        train={currentTrain}
        results={results?.userResults || []}
        currentRound={currentRound}
        maxRounds={maxRoundsRef.current}
        publish={publish}
        getPlayerColor={getPlayerColor}
      />
    );
  }

  if (gameState !== "ROUND_IN_PROGRESS") {
    return <LoadingScreen />;
  }

  // Timer styling
  const timerCls =
    secondsRemaining <= 10 ? "is-danger" : secondsRemaining <= 20 ? "is-warn" : "";
  const timerBarPct = Math.max(0, (secondsRemaining / 45) * 100);
  const timerBarColor =
    secondsRemaining <= 10
      ? "var(--red)"
      : secondsRemaining <= 20
      ? "var(--gold)"
      : "var(--white)";

  return (
    <div className="game-screen" style={{ paddingTop: 0 }}>
      {/* Clue bar */}
      <div className="game-clue-bar">
        <div
          className="game-clue-timer"
          style={{ width: `${timerBarPct}%`, background: timerBarColor }}
        />
        <div className="game-clue-row">
          {/* Line badge */}
          <div className="game-clue-line">
            <div className="game-clue-line-label">LINIE</div>
            <div className="game-clue-line-v">{train?.line.name ?? "—"}</div>
          </div>

          {/* Route info */}
          <div className="game-clue-route">
            <div className="game-clue-route-label">VON → NACH</div>
            <div className="game-clue-route-v">
              {train?.lineOrigin.stationName}
              <span className="arrow">→</span>
              {train?.lineDestination.stationName}
            </div>
            <div className="game-clue-times">
              <span>
                <span style={{ color: "var(--grey-l)" }}>AB </span>
                {departureTime}
              </span>
              <span className="lobby-room-meta-sep">·</span>
              <span>
                <span style={{ color: "var(--grey-l)" }}>AN </span>
                {arrivalTime}
              </span>
            </div>
          </div>

          {/* Clock */}
          <div className="game-clue-clock">
            <SBBClock timeStr={currentTime} size={84} />
            <div>
              <div className="game-clue-clock-info-label">JETZT</div>
              <div className="game-clue-clock-info-v">{currentTime}</div>
              <div className="game-clue-clock-info-sub">SBB · CFF · FFS</div>
            </div>
          </div>

          {/* Timer */}
          <div className="game-clue-timer-cell">
            <div className="game-clue-timer-label">SEK</div>
            <div className={`game-clue-timer-v ${timerCls}`}>
              {secondsRemaining>=0 ? String(secondsRemaining).padStart(2, "0") : "00"}
            </div>
          </div>

          {/* Round */}
          <div className="game-clue-round-cell">
            <div className="game-clue-round-label">RUNDE</div>
            <div className="game-clue-round-v">
              {currentRound}
              <small>/{maxRounds}</small>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="game-map-wrap">
        <div className="map-container">
          {mounted && (
            <RMap
              minZoom={6}
              initialCenter={[7.4707, 46.95]}
              initialZoom={8}
              mapStyle="https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json"
              onClick={handleMapClick}
              onTouchEnd={handleMapClickTouch}
            >
              {clickPosition && (
                <RMarker
                  longitude={clickPosition[0]}
                  latitude={clickPosition[1]}
                  initialAnchor="bottom"
                >
                  {/* Red SBB teardrop for the user's pending guess.
                      Matches the post-round result style for continuity. */}
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
                      DU
                    </div>
                  </div>
                </RMarker>
              )}
              {stationPins?.map((station, idx) => (
                <RMarker
                  key={`station-${idx}-${station[0]}-${station[1]}`}
                  longitude={station[1]}
                  latitude={station[0]}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      backgroundColor: "var(--green)",
                      borderRadius: "50%",
                      border: "2px solid white",
                      cursor: "pointer",
                    }}
                  />
                </RMarker>
              ))}
            </RMap>
          )}
        </div>

        {/* Bottom overlay */}
        <div className="game-bottom-overlay">
          {!clickPosition && !guessSubmitted && (
            <div className="game-hint-pill">
              <span>📍</span>
              Klick auf die Karte, um deinen Tipp zu setzen
            </div>
          )}

          {clickPosition && !guessSubmitted && (
            <div className="game-confirm-wrap">
              <div className="game-coord-pill">
                <span style={{ fontSize: 17 }}>📍</span>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                  <span className="game-coord-pill-label">Dein Tipp</span>
                  <span className="game-coord-pill-v">
                    {clickPosition[1].toFixed(3)}°N · {clickPosition[0].toFixed(3)}°E
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="sbb-btn sbb-btn--primary sbb-btn--lg"
                onClick={handleSubmitGuess}
                style={{ boxShadow: "0 6px 20px rgba(235,0,0,0.5)" }}
              >
                ✓ Bestätigen
              </button>
            </div>
          )}

          {guessSubmitted && (
            <div className="game-submitted-pill">
              <span style={{ fontSize: 17 }}>✓</span>
              Abgegeben — berechne…
            </div>
          )}
        </div>

        {/* Exit button (top-left) */}
        <button
          type="button"
          className="sbb-btn sbb-btn--ghost sbb-btn--sm"
          onClick={() => router.push("/lobbies")}
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            zIndex: 1000,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(8px)",
            color: "var(--black)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          ← Exit
        </button>
      </div>
    </div>
  );
};

export default GamePage;
