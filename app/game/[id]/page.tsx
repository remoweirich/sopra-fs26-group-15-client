"use client";

/**
 * Game Screen  –  route: /game/[gameId]
 *
 * Design ref: image5.png
 * ─────────────────────────────────────────────────────────────────────────────
 * Layout (no standard navbar – uses compact game navbar):
 *
 *   <nav className="navbar navbar--game">
 *     brand logo  |  (centre: hidden by design)  |  "Exit Game" link
 *   </nav>
 *
 *   <div className="train-bar">
 *     .train-bar-line-badge   →  "S12"
 *     .train-bar-route        →  "From Brugg AG → To Zürich HB"
 *     .train-bar-times        →  "Dep 12:02 · Arr 12:38"
 *     .train-bar-round        →  "Round 1/5"  +  .train-bar-timer "28s"
 *   </div>
 *
 *   <div className="game-question-bar">
 *     .game-question-bar-dot   (pulsing red dot)
 *     "Current time: 12:21 – Where is the train NOW?"
 *   </div>
 *
 *   <div className="page-game">          ← fills remaining viewport height
 *     <div className="map-container">   ← React-Leaflet / Google Maps mounts here
 *       <div className="game-hint-bar">Click on the map to place your guess</div>
 *     </div>
 *   </div>
 *
 * Classnames (all in globals.css):
 *   navbar, navbar--game
 *   train-bar, train-bar-line-badge, train-bar-route, train-bar-route-arrow,
 *   train-bar-times, train-bar-round, train-bar-timer
 *   game-question-bar, game-question-bar-dot
 *   page-game, map-container, game-hint-bar
 *
 * WebSocket:
 *   Subscribe to /topic/game/{gameId}  (via LobbyService per activity diagram)
 *   Expected message types (WsMessageType):
 *     "ROUND_START"   →  new round begins; update train info + reset timer
 *     "ROUND_END"     →  show result overlay; display scores
 *     "SCORE_UPDATE"  →  live leaderboard update mid-round (optional)
 *     "GAME_END"      →  navigate to final leaderboard / back to lobby
 *
 * Data flow:
 *   GET /game/{gameId}              →  initial game state (round, train, timer)
 *   POST /game/{gameId}/guess       →  submit lat/lng after map click
 *   User clicks map                 →  capture coordinates, show pin, enable submit
 *
 * Timer:
 *   Driven by secondsRemaining from WS "ROUND_START" message.
 *   Local setInterval counts down; sync again on next ROUND_START.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
//import { useWebSocket } from "@/hooks/useWebSocket";
import { GameState, WsMessage } from "@/types";
import { Button } from "antd";

const GamePage: React.FC = () => {
  const router    = useRouter();
  const { id: gameId } = useParams<{ id: string }>();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");

  const [gameState,         setGameState]         = useState<GameState | null>(null);
  const [secondsRemaining,  setSecondsRemaining]  = useState<number>(0);
  const [guessCoords,      setGuessCoords]      = useState<{ lat: number; lng: number } | null>(null);
    const [guessSubmitted,   setGuessSubmitted]   = useState<boolean>(false);


  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Initial fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchGame = async () => {
      
    };

    if (gameId) fetchGame();
  }, [gameId]);

  // ── Local countdown timer ────────────────────────────────────────────────
  useEffect(() => {
    
  }, [secondsRemaining]);

  // ── WebSocket – real-time game events ────────────────────────────────────
  

  // ── Guess submission ─────────────────────────────────────────────────────
  const handleSubmitGuess = async () => {
    
  };

  // ── Map click handler (passed down to map component) ─────────────────────
  const handleMapClick = (lat: number, lng: number) => {
    
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const train = gameState?.currentTrain;

  return (
    <>
      {/* ── Compact game navbar ─────────────────────────────────────────── */}
      <nav className="navbar navbar--game">
        {/* TODO: logo mark (white variant) */}
        <span style={{ marginLeft: "auto" }}>
          <Button
            className="btn-ghost-muted"
            onClick={() => router.push("/lobbies")}
          >
            Exit Game
          </Button>
        </span>
      </nav>

      {/* ── Red train-info bar ──────────────────────────────────────────── */}
      <div className="train-bar">
        {/* Line badge e.g. "S12" */}
        <span className="train-bar-line-badge">
          {train?.lineId ?? "—"}
        </span>

        {/* Route */}
        <span className="train-bar-route">
          From {train?.fromStation}
          <span className="train-bar-route-arrow"> → </span>
          To {train?.toStation}
        </span>

        {/* Times */}
        <span className="train-bar-times">
          Dep {train?.departureTime} · Arr {train?.arrivalTime}
        </span>

        {/* Round indicator + countdown */}
        <div className="train-bar-round">
          <span>
            Round {gameState?.currentRound}/{gameState?.totalRounds}
          </span>
          <span className="train-bar-timer">{secondsRemaining}s</span>
        </div>
      </div>

      {/* ── Question bar ────────────────────────────────────────────────── */}
      <div className="game-question-bar">
        <span className="game-question-bar-dot" />
        Current time: {train?.currentTime} – Where is the train NOW?
      </div>

      {/* ── Map area ────────────────────────────────────────────────────── */}
      <div className="page-game">
        <div className="map-container">
          {/*
            TODO: Mount map component here (React-Leaflet recommended).
            Pass onMapClick={handleMapClick} so the page captures coordinates.
            The map component should:
              - Render a Switzerland-centred tile map
              - Place a draggable pin when the user clicks
              - Show the correct-position pin after ROUND_END WS message
          */}

          {/* Floating hint / submit button at map bottom */}
          {/*!guessSubmitted ? (
            <div className="game-hint-bar">
              {guessCoords
                ?  (
                  <Button type="primary" onClick={handleSubmitGuess}>
                    Submit Guess
                  </Button>
                )
                : "Click on the map to place your guess"}
            </div>
          ) : (
            <div className="game-hint-bar">
              Guess submitted – waiting for other players…
            </div>
          )*/}
        </div>
      </div>
    </>
  );
};

export default GamePage;