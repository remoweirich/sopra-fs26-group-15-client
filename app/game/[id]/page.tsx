"use client";

/**
 * Game Screen — route: /game/[id]
 *
 * Design: SBB-styled dark header with line badge + clock + countdown +
 * round counter. Full-bleed map below with floating bottom UI for tip
 * placement / coordinate display / submit, plus exit-button overlay.
 *
 * WebSocket: subscribes to /topic/game/{gameId}; handles ROUND_START,
 * ROUND_END, SCORES (renders RoundOverview during BETWEEN_ROUNDS).
 * Sends GUESS_MESSAGE via /app/game/{gameId}/guess and
 * READY_FOR_NEXT_ROUND right after subscription.
 *
 * Map (MapLibre via maplibre-react-components) and station markers
 * for origin/destination remain unchanged. Only the surrounding UI
 * (header, exit button, hint pill, user-guess pin) is restyled.
 *
 * ── BUG FIX (2026-05-06) ──
 * Previous timer implementation hung the deps on `[handleSubmitGuess,
 * guessSubmitted]`. `handleSubmitGuess` was not memoized, so every
 * render produced a new reference → the useEffect re-ran → the
 * setInterval was cleared and recreated every render. If renders
 * happened faster than 1000ms (any incoming WebSocket frame triggers
 * a render via setMessages), the interval was killed before it ever
 * fired and the timer froze.
 *
 * Fix: memoize handleSubmitGuess with useCallback, hang the timer
 * useEffect on `[gameState, timerActive]` only, and split the
 * auto-submit-on-timer-0 into its own effect.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useWebSocket } from "@/context/WebSocketContext";
import { useAuth } from "@/context/AuthContext";
import { Message } from "@/types/message";
import { Train, Station } from "@/types/train";
import { Round } from "@/types/round";
import type { MessageType } from "@/types/messageType";

import "maplibre-gl/dist/maplibre-gl.css";
import { RMap, RMarker } from "maplibre-react-components";
import { MapLayerMouseEvent, MapLayerTouchEvent } from "maplibre-gl";
import RoundOverview from "./RoundOverview";
import LoadingScreen from "./LoadingScreen";
import { latLngToEpsg, epsgToLatLng } from "./coordinateConverter";
import { GameMessage, ResultDTO } from "@/types/gameMessage";
import { UserResult } from "@/types/user";

/* ── SBB-Uhr (unchanged) ───────────────────────────────────────────── */
const SBBClock: React.FC<{ timeStr: string; size?: number }> = ({ timeStr, size = 84 }) => {
  const [h, m] = (timeStr || "10:00").split(":").map(Number);
  const [sec, setSec] = useState<number>(() => new Date().getSeconds());

  useEffect(() => {
    const t = setInterval(() => setSec(s => (s + 1) % 60), 1000);
    return () => clearInterval(t);
  }, []);

  const hAng = ((h % 12) * 30) + (m * 0.5);
  const mAng = (m || 0) * 6;
  const sAng = sec * 6;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }} aria-hidden="true">
      <circle cx="50" cy="50" r="49" fill="#fff" stroke="#1C1917" strokeWidth="0.8" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={`h${i}`} x="48.5" y="2" width="3" height="11" fill="#1C1917" transform={`rotate(${i * 30} 50 50)`} />
      ))}
      <g transform={`rotate(${hAng} 50 50)`}>
        <rect x="46.8" y="22" width="6.4" height="32" fill="#1C1917" />
      </g>
      <g transform={`rotate(${mAng} 50 50)`}>
        <rect x="47.7" y="8" width="4.6" height="46" fill="#1C1917" />
      </g>
      <g transform={`rotate(${sAng} 50 50)`}>
        <rect x="49.3" y="13" width="1.4" height="42" fill="#EB0000" />
        <circle cx="50" cy="20" r="5.2" fill="#EB0000" />
      </g>
      <circle cx="50" cy="50" r="2.4" fill="#1C1917" />
    </svg>
  );
};

const ROUND_DURATION_S = 45;

const GamePage: React.FC = () => {
  const router = useRouter();
  const { id: gameId } = useParams<{ id: string }>();
  const apiService = useApi();
  const { user: currentUser, token, isLoading } = useAuth();
  const { connect, disconnect, subscribe, publish, isConnected } = useWebSocket();

  type GameState =
    | "ROUND_IN_PROGRESS"
    | "LOADING"
    | "BETWEEN_ROUNDS"
    | "GAME_ENDED";

  type GuessMessagePayload = {
    lobbyId: string;
    userId: string;
    token: string;
    Xcoordinate: number;
    Ycoordinate: number;
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const PLAYER_COLORS = ["#3357FF", "#ffdd00", "#33FF57", "#F333FF", "#FF33A1"];
  const [gameState, setGameState] = useState<GameState | null>("ROUND_IN_PROGRESS");
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(ROUND_DURATION_S);
  const [guessCoords, setGuessCoords] = useState<[number, number] | null>(null);
  const [guessSubmitted, setGuessSubmitted] = useState<boolean>(false);
  const [clickPosition, setClickPosition] = useState<null | [number, number]>(null); // [long, lat]
  const [currentTrain, setCurrentTrain] = useState<Train | null>(null);
  const [departureTime, setDepartureTime] = useState<string | null>(null);
  const [arrivalTime, setArrivalTime] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [maxRounds, setMaxRounds] = useState<number | null>(null);
  const [results, setResults] = useState<{ roundNumber: number; userResults: UserResult[]; train: Train } | null>(null);
  const [totalResults, setTotalResults] = useState<[{ userId: string; score: number }] | null>(null);
  const [stationPins, setStationPins] = useState<[[number, number], [number, number]] | null>(null);

  const playerColorMap = useRef<Record<string, string>>({});

  const getPlayerColor = (userId: string) => {
    if (!playerColorMap.current[userId]) {
      const colorIndex = Object.keys(playerColorMap.current).length % PLAYER_COLORS.length;
      playerColorMap.current[userId] = PLAYER_COLORS[colorIndex];
    }
    return playerColorMap.current[userId];
  };

  const epochToTime = (epoch: number | null): string => {
    if (!epoch) return "";
    return new Date(epoch).toLocaleTimeString('de-CH', {
      timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit'
    });
  };

  // Prevent hydration error
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── WebSocket connection ─────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    if (!token || !currentUser) return;
    if (isConnected) return;

    console.log("Game page: WebSocket not connected - initiating connection...");
    connect(currentUser.userId.toString(), token);
  }, [isLoading, token, currentUser, isConnected, connect]);

  // ── Submit guess (memoized — stable reference across renders) ───────
  // CRITICAL: must be useCallback. Earlier this was a regular function,
  // which made the timer effect's deps churn every render and broke
  // the countdown. Do NOT remove the useCallback wrapping.
  const handleSubmitGuess = useCallback(async () => {
    if (!clickPosition) return;
    if (!isConnected) {
      console.warn("WebSocket not connected yet");
      return;
    }

    const [lon, lat] = clickPosition;
    const [x, y] = latLngToEpsg(lat, lon);

    const payload: GuessMessagePayload = {
      lobbyId: gameId!,
      userId: currentUser?.userId.toString() || "",
      token: token || "",
      Xcoordinate: x,
      Ycoordinate: y
    };

    publish(`/app/game/${gameId}/guess`, {
      type: "GUESS_MESSAGE",
      payload: payload
    });
    setGuessCoords([lat, lon]);
    setGuessSubmitted(true);
  }, [clickPosition, isConnected, gameId, currentUser, token, publish]);

  // ── Ref pattern: fresh state inside long-lived callbacks ────────────
  // Used by handleMessage (subscribed once) and the timer auto-submit.
  const gameStateRef = useRef({
    clickPosition,
    guessSubmitted,
    handleSubmitGuess
  });
  useEffect(() => {
    gameStateRef.current = {
      clickPosition,
      guessSubmitted,
      handleSubmitGuess
    };
  }, [clickPosition, guessSubmitted, handleSubmitGuess]);

  // ── Countdown timer ─────────────────────────────────────────────────
  // FIXED: deps reduced to [gameState, timerActive] so the interval
  // is created once per round and ticks reliably every 1000ms.
  // Previously deps included a non-memoized function reference, causing
  // the interval to be cleared+recreated on every render → timer froze
  // whenever renders happened faster than 1Hz (any WebSocket traffic).
  useEffect(() => {
    if (gameState !== "ROUND_IN_PROGRESS" || !timerActive) return;

    const interval = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, timerActive]);

  // ── Auto-submit when the timer hits 0 ───────────────────────────────
  // Separate effect so the timer above isn't perturbed by submit-state
  // changes. handleSubmitGuess is memoized → this effect runs at most
  // once per (secondsRemaining, guessSubmitted, gameState) transition.
  useEffect(() => {
    if (
      secondsRemaining === 0 &&
      !guessSubmitted &&
      gameState === "ROUND_IN_PROGRESS"
    ) {
      handleSubmitGuess();
    }
  }, [secondsRemaining, guessSubmitted, gameState, handleSubmitGuess]);

  // ── handleMessage (memoized via empty deps + ref pattern) ───────────
  // Captures fresh state through gameStateRef so we don't need the
  // subscription useEffect to re-run on every render.
  const handleMessage = useCallback((message: GameMessage) => {
    const {
      clickPosition: currentClick,
      guessSubmitted: alreadySubmitted,
      handleSubmitGuess: submitFn
    } = gameStateRef.current;

    switch (message.type) {
      case "ROUND_START":
        setGuessCoords(null);
        setGuessSubmitted(false);
        setClickPosition(null);
        setCurrentTrain(message.payload.train);
        setDepartureTime(epochToTime(message.payload.train.departureTime));
        setArrivalTime(epochToTime(message.payload.train.arrivalTime));
        const origin = message.payload.train.lineOrigin;
        const destination = message.payload.train.lineDestination;
        const originCoords = epsgToLatLng(origin.xCoordinate, origin.yCoordinate);
        const destCoords = epsgToLatLng(destination.xCoordinate, destination.yCoordinate);
        setStationPins([originCoords, destCoords]);

        setCurrentRound(message.payload.roundNumber);
        setMaxRounds(message.payload.maxRounds);
        setGameState("ROUND_IN_PROGRESS");
        setSecondsRemaining(ROUND_DURATION_S);
        setTimerActive(true);
        break;

      case "ROUND_END":
        if (currentClick && !alreadySubmitted) {
          submitFn();
        }
        setTimerActive(false);
        break;

      case "SCORES":
        const userResults = message.payload.userResults.map((result: UserResult) => {
          const [lat, lng] = epsgToLatLng(result.xCoordinate, result.yCoordinate);
          return {
            ...result,
            xCoordinate: lat,
            yCoordinate: lng,
          };
        });

        setResults({
          ...message.payload,
          userResults,
        });

        const train = message.payload.train;
        const [lat, lon] = epsgToLatLng(train.currentX, train.currentY);
        train.currentX = lat;
        train.currentY = lon;

        setCurrentTrain(train);
        setGameState("BETWEEN_ROUNDS");
        break;

      /*
      case "GAME_END":
        setGameState("GAME_ENDED");
        router.push(`/game/${gameId}/leaderboard`);
        break;
      */
    }
  }, []);

  // Ref to handleMessage so subscription doesn't restart on every render
  const handleMessageRef = useRef(handleMessage);
  useEffect(() => {
    handleMessageRef.current = handleMessage;
  }, [handleMessage]);

  // ── WebSocket subscription ──────────────────────────────────────────
  useEffect(() => {
    if (!isConnected) return;

    const subscription = subscribe<GameMessage>(`/topic/game/${gameId}`, (update) => {
      setMessages((prev) => [...prev, update]);
      handleMessageRef.current(update);
    });

    publish(`/app/game/${gameId}/ready`, {
      type: "READY_FOR_NEXT_ROUND",
      payload: {
        userId: currentUser?.userId.toString(),
        isReady: true
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
        console.log("Unsubscribed from websockets topic");
      }
    };
  }, [isConnected, subscribe, publish, gameId, currentUser]);

  // ── Map click handlers ──────────────────────────────────────────────
  const handleMapClick = (e: MapLayerMouseEvent) => {
    setClickPosition(e.lngLat.toArray() as [number, number]);
  };
  const handleMapClickTouch = (e: MapLayerTouchEvent) => {
    setClickPosition(e.lngLat.toArray() as [number, number]);
  };

  // ── Render ──────────────────────────────────────────────────────────
  const train = currentTrain;

  if (gameState === "ROUND_IN_PROGRESS") {
    const _now = new Date();
    const jetztTime =
      `${String(_now.getHours()).padStart(2, "0")}:${String(_now.getMinutes()).padStart(2, "0")}`;

    const progressPct = Math.max(0, Math.min(100, (secondsRemaining / ROUND_DURATION_S) * 100));

    const sekClass = secondsRemaining <= 10
      ? "gamepage-sek-num gamepage-sek-num--urgent"
      : secondsRemaining <= 20
        ? "gamepage-sek-num gamepage-sek-num--warning"
        : "gamepage-sek-num";

    return (
      <div className="gamepage-page">
        <header className="gamepage-header">
          <div className="gamepage-line-box">
            <span className="gamepage-eyebrow">LINIE</span>
            <span className="gamepage-line-name">{train?.line?.name ?? "—"}</span>
          </div>

          <div className="gamepage-route">
            <span className="gamepage-eyebrow gamepage-eyebrow--grey">VON → NACH</span>
            <div className="gamepage-route-title">
              {train?.lineOrigin?.stationName ?? "—"}
              <span className="gamepage-route-arrow">→</span>
              {train?.lineDestination?.stationName ?? "—"}
            </div>
            <div className="gamepage-route-times">
              <span>
                <span className="gamepage-route-times-label">AB</span>
                {departureTime ?? "—"}
              </span>
              <span className="gamepage-route-times-sep">·</span>
              <span>
                <span className="gamepage-route-times-label">AN</span>
                {arrivalTime ?? "—"}
              </span>
            </div>
          </div>

          <div className="gamepage-clock-box">
            <SBBClock timeStr={jetztTime} size={84} />
            <div>
              <div className="gamepage-eyebrow gamepage-eyebrow--red">JETZT</div>
              <div className="gamepage-clock-time">{jetztTime}</div>
              <div className="gamepage-clock-sub">SBB · CFF · FFS</div>
            </div>
          </div>

          <div className="gamepage-sek-box">
            <span className="gamepage-eyebrow">SEK</span>
            <span className={sekClass}>{String(secondsRemaining).padStart(2, "0")}</span>
          </div>

          <div className="gamepage-runde-box">
            <span className="gamepage-eyebrow">RUNDE</span>
            <span className="gamepage-runde-num">
              {currentRound ?? "—"}
              <span className="gamepage-runde-max">/{maxRounds ?? "—"}</span>
            </span>
          </div>

          <div
            className="gamepage-progress"
            style={{ width: `${progressPct}%` }}
            aria-hidden="true"
          />
        </header>

        <div className="gamepage-map-wrap">
          <button
            className="gamepage-exit"
            onClick={() => router.push("/lobbies")}
            type="button"
          >
            Exit Game
          </button>

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
                  <div className="gamepage-pin">
                    <div className="gamepage-pin-label">DU</div>
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
              )}

              {stationPins?.map((station, idx) => (
                <RMarker
                  initialColor={"#E30613"}
                  key={`station-${idx}-${station[0]}-${station[1]}`}
                  longitude={station[1]}
                  latitude={station[0]}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#E30613',
                    borderRadius: '50%',
                    border: '2px solid white',
                    cursor: 'pointer'
                  }} />
                </RMarker>
              ))}
            </RMap>
          )}

          {!clickPosition && !guessSubmitted && (
            <div className="gamepage-hint-pill">
              <span className="gamepage-hint-icon">📍</span>
              Klick auf die Karte, um deinen Tipp zu setzen
            </div>
          )}

          {clickPosition && !guessSubmitted && (
            <div className="gamepage-confirm-row">
              <div className="gamepage-coord-pill">
                <span className="gamepage-hint-icon">📍</span>
                <div>
                  <div className="gamepage-coord-eyebrow">DEIN TIPP</div>
                  <div className="gamepage-coord-value">
                    {clickPosition[1].toFixed(3)}°N · {clickPosition[0].toFixed(3)}°E
                  </div>
                </div>
              </div>
              <button
                className="sbb-btn-home sbb-btn-home--primary gamepage-confirm-btn"
                onClick={handleSubmitGuess}
                type="button"
              >
                ✓ Bestätigen
              </button>
            </div>
          )}

          {guessSubmitted && (
            <div className="gamepage-submitted">
              <span aria-hidden="true">✓</span>
              Abgegeben — warte auf Mitspieler…
            </div>
          )}
        </div>
      </div>
    );
  }

  else if (gameState === "BETWEEN_ROUNDS") {
    return <RoundOverview
      train={currentTrain}
      results={results?.userResults || []}
      currentRound={currentRound}
      maxRounds={maxRounds}
      publish={publish}
      getPlayerColor={getPlayerColor} />;
  }
  else {
    return <LoadingScreen />;
  }
};

export default GamePage;