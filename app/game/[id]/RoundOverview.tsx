"use client";

/**
 * RoundResult  –  shown after each round inside the Game Screen
 *
 * Design ref: uploaded screenshot (split layout – map left, panel right)
 * ─────────────────────────────────────────────────────────────────────────────
 * This component replaces the full-screen map once the backend sends a
 * ROUND_END WebSocket message. The parent (game/[id]/page.tsx) mounts it
 * instead of the plain map view when gameState.phase === "ROUND_RESULT".
 *
 * Layout:
 *   <div className="game-result-layout">          ← flex row, fills .page-game
 *     <div className="map-container">             ← left: map stays visible
 *     <aside className="result-panel">            ← right: 340px white sidebar
 *
 * Props (all TODO – wire to real data from WS ROUND_END payload):
 *   currentRound, totalRounds   – "ROUND 1 / 5"
 *   trainInfo                   – line, route, time for subtitle
 *   actualPosition              – "Zwischen Baden & Wettingen"
 *   roundResults[]              – per-player distance + score delta
 *   overallStandings[]          – cumulative leaderboard
 *   onNextRound                 – called when host clicks "Next round"
 *   isHost                      – shows/hides the Next round button
 */

import { Button } from "antd";
import { use, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
//import { useWebSocket } from "@/hooks/useWebSocket";
import { Client } from "@stomp/stompjs";
import "maplibre-gl/dist/maplibre-gl.css";
import { RMap, RMarker } from "maplibre-react-components";
//import { Message} from "@types/message";
import { Train } from "@/types/train";
import { Round } from "@/types/round";
import type { MessageType } from "@/types/messageType";
import { User } from "@/types/user";

type UserResult = {
    userId: string;
    roundPoints: string;
    totalPoints: string;
    xCoordinate: number;
    yCoordinate: number;
    distance: number;
  }

interface RoundOverviewProps {
    train: Train | null;
    results: UserResult[];
    currentRound: number | null;
    maxRounds: number | null;
    clientRef: Client | null;
    }

const RoundOverview: React.FC<RoundOverviewProps> = ({ train, results, currentRound, maxRounds, clientRef }) => {   
    
    const { value: userId } = useLocalStorage<string>("userId", "1"); //hardcoded for testing, needs to be set later with login
    const { id: gameId } = useParams();
    const [unsortedResults, setUnsortedResults] = useState<UserResult[]>(results);
    const [sortedRoundResults, setSortedRoundResults] = useState<UserResult[]>([]);
    const [sortedTotalResults, setSortedTotalResults] = useState<UserResult[]>([]);
    const [currentTrain, setcurrentTrain] = useState<Train>(train);
    //prevent hidration error
    const [mounted, setMounted] = useState(false);
    const [readyForNextRound, setReadyForNextRound] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
        
    useEffect(() => {
        //sort user results by score descending
        console.log("unsorted results:", unsortedResults);
        const sortedResults = [...unsortedResults].sort((a, b) => parseInt(b.roundPoints) - parseInt(a.totalscore));
        setSortedRoundResults(sortedResults);
        console.log("sorted results:", sortedResults);

        //sort total results by totalscore descending
        const sortedTotalResults = [...unsortedResults].sort((a, b) => parseInt(b.totalPoints) - parseInt(a.score));
        setSortedTotalResults(sortedTotalResults);
        console.log("sorted total results:", sortedTotalResults);

    }, [unsortedResults]);

    const handleReadyForNextRound = async () => {
        if (readyForNextRound) {
            return;
        }
        setReadyForNextRound(true);

        if (!clientRef || !clientRef.connected) {
            console.warn("WebSocket not connected yet");
            return;
    }

        clientRef.publish({
        destination: `/app/game/${gameId}/ready`,
        body: JSON.stringify({
            type: "READY_FOR_NEXT_ROUND",
            payload: {
                userId: userId,
                isReady: true
            }
            })
        });
        console.log("Sent ready message for user" + userId)
    }

  return (
    <div className="game-result-layout">

      {/* ── Left: map stays mounted so the actual pin is visible ─────────── */}
      <div className="map-container">
        {mounted && (
        <RMap
            minZoom={6}
            initialCenter={[currentTrain.currentY, currentTrain.currentX]}
            initialZoom={9}
            mapStyle="https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json"
            >
                {/*Actual Train Position*/}
                {currentTrain?.currentX && currentTrain?.currentY && (
                    <RMarker
                    longitude={currentTrain.currentY}
                    latitude={currentTrain.currentX}
                    />)}
                {/*player guess positions*/}
                {sortedRoundResults.map((result) => (
                    <RMarker
                    longitude={result.yCoordinate}
                    latitude={result.xCoordinate}
                    color="#3fce63"
                    />)
                 )

                }
            </RMap>)}
      </div>

      {/* ── Right: result sidebar ─────────────────────────────────────────── */}
      <aside className="result-panel">

        {/* Header */}
        <div className="result-panel-header">
          <p className="result-panel-round-label">
            {/* TODO: currentRound / totalRounds */}
            ROUND {currentRound} / {maxRounds}
          </p>
          <h2 className="result-panel-title">
            {/* TODO: target icon */}
            Result
          </h2>
          <p className="result-panel-subtitle">
            {/* TODO: trainInfo.lineId · trainInfo.fromStation → trainInfo.toStation · trainInfo.currentTime */}
            {train?.trainId} · {train?.lineOrigin?.stationName} → {train?.lineDestination?.stationName} · 12:21
          </p>
        </div>

        {/* Actual position callout */}
        <div className="result-actual-position">
          <div className="result-actual-label">Actual Position</div>
          <div className="result-actual-value">
            {/* TODO: actualPosition from ROUND_END payload */}
            Zwischen {train?.lastLeavingStation.stationName} &amp; {train?.nextPendingStation.stationName}
          </div>
        </div>

        {/* This round – per-player scores */}
        <div className="result-section-label">This Round</div>

        {/* TODO: map over roundResults[] – example rows below */}

        

        {sortedRoundResults.map((result, index) => (
            result.userId == userId ? (
                <div className="result-player-row result-player-row--you">
                <div className="result-player-avatar">
            {/* TODO: username initial */}
                    </div>
                    <div className="result-player-info">
                        <div className="result-player-name">You</div>
                        <div className="result-player-distance">{result.distance} km</div>
                    </div>
                    <span className="result-player-score">{result.roundPoints}</span>
                </div>) : (
                <div className="result-player-row">
                    <div className="result-player-avatar">
                        {/* TODO: username initial */}
                    </div>
                    <div className="result-player-info">
                        <div className="result-player-name">{result.userId /*to do: fetch username*/}</div>
                        <div className="result-player-distance">{result.distance} km</div>
                    </div>
                    <span className="result-player-score">{result.roundPoints}</span>
            </div>
            )))}
           
        

        {/* Overall standings */}
        <div className="result-section-label">Overall Standings</div>

        {/*map over overallStandings[] */}

        {sortedTotalResults.map((result, index) => (
            <div className="result-standings-row">
          <span className="result-standings-rank">{index+1}.</span>
          <span className="result-standings-name">{result.userId == userId ? ("You"): result.userId}</span>
          <span className="result-standings-score">{result.totalPoints}</span>
        </div>
        ))}

        

        {/* Footer: next-round button */}
        <div className="result-panel-footer">
          <Button
            type="primary"
            className="btn-full"
            onClick={handleReadyForNextRound}
          >
            {/* TODO: conditionally render "Waiting for host…" if !isHost */}
            Next round (2/5) →
          </Button>
        </div>

      </aside>
    </div>
  );
};

export default RoundOverview;