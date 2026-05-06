"use client";

import { Button } from "antd";
import { useEffect, useState , useMemo} from "react";
import { useRouter, useParams } from "next/navigation";
import "maplibre-gl/dist/maplibre-gl.css";
import { RMap, RMarker } from "maplibre-react-components";
import { Train } from "@/types/train";
import { Round } from "@/types/round";
import type { MessageType } from "@/types/messageType";
//import { User } from "@/types/user";
import { Message } from "@/types/message";
import {UserResult} from "@/types/user";
import { useAuth } from "@/context/AuthContext";
import { MyUserDTO, UserDTO } from "@/types/user";




interface RoundOverviewProps {
    train: Train | null;
    results: UserResult[];
    currentRound: number | null;
    maxRounds: number | null;
    publish: (destination: string, body: Message) => void;
    }

const RoundOverview: React.FC<RoundOverviewProps> = ({ train, results, currentRound, maxRounds, publish }) => {   
    
    const { user: currentUser, token, login, isLoading } = useAuth();
    const apiService = useApi();
  
    const router     = useRouter();  
    const { value: userId } = useLocalStorage<string>("userId", "1"); //hardcoded for testing, needs to be set later with login
    const { id: gameId } = useParams();
    const [unsortedResults, setUnsortedResults] = useState<UserResult[]>(results);
    const [sortedRoundResults, setSortedRoundResults] = useState<UserResult[]>([]);
    const [sortedTotalResults, setSortedTotalResults] = useState<UserResult[]>([]);
    const [currentTrain, setcurrentTrain] = useState<Train | null>(train);
    //prevent hidration error
    const [mounted, setMounted] = useState(false);
    const [readyForNextRound, setReadyForNextRound] = useState(false);
    const [usernamesMap, setUsernamesMap] = useState<{ [userId: number]: string }>({});

    useEffect(() => {
        setMounted(true);
    }, []);
        
    useEffect(() => {
        //sort user results by score descending
        // console.log("unsorted results:", unsortedResults);
        const sortedResults = [...unsortedResults].sort((a, b) => b.roundPoints - a.totalPoints);
        setSortedRoundResults(sortedResults);
        // console.log("sorted results:", sortedResults);

        //sort total results by totalscore descending
        const sortedTotalResults = [...unsortedResults].sort((a, b) => b.totalPoints - a.roundPoints);
        setSortedTotalResults(sortedTotalResults);
        // console.log("sorted total results:", sortedTotalResults);
        
        const fetchUsernames = async () => {
          if (!token) {return}
          for (const result of sortedResults) {
            try {
              const data = await apiService.get<MyUserDTO | UserDTO>(
                `/users/${result.userId}`,
                {
                  headers: { token: token },
                }
              );

              setUsernamesMap((prevMap) => ({ ...prevMap, [result.userId]: data.username }));
            } catch (error) {
              console.log("Failed to fetch username for userId " + result.userId, error);
            }
          }
        };
        fetchUsernames();
        //create a map of userId to username


    }, [unsortedResults]);

    const handleReadyForNextRound = async () => {
        if (readyForNextRound) {
            return;
        }
        setReadyForNextRound(true);

    const router = useRouter();
    const { user } = useAuth();
    const { id: gameId } = useParams<{ id: string }>();

    const [readyForNextRound, setReadyForNextRound] = useState(false);

    const sortedRoundResults = useMemo(
        () => [...results].sort((a, b) => b.roundPoints - a.roundPoints),
        [results]
    );

    const sortedTotalResults = useMemo(
        () => [...results].sort((a, b) => b.totalPoints - a.totalPoints),
        [results]
    );

    const handleReadyForNextRound = () => {
        if (readyForNextRound) return;
        setReadyForNextRound(true);
        publish(`/app/game/${gameId}/ready`, {});
        console.log("Sent ready message for user " + user?.userId);
    };

    const handleEndGame = () => {
        router.push(`/game/${gameId}/leaderboard`);
    };

    return (
        <div className="game-result-layout">

            <div className="map-container">
                <RMap
                    minZoom={6}
                    initialCenter={[train?.currentY ?? 7.4707, train?.currentX ?? 46.95]}
                    initialZoom={9}
                    mapStyle="https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json"
                >
                    {train?.currentX && train?.currentY && (
                        <RMarker
                            longitude={train.currentY}
                            latitude={train.currentX}
                        />
                    )}
                    {sortedRoundResults.map((result) => (
                        <RMarker
                            key={`guess-${result.userId}-${result.xCoordinate}-${result.yCoordinate}`}
                            longitude={result.yCoordinate}
                            latitude={result.xCoordinate}
                        />
                    ))}
                </RMap>
        {sortedRoundResults.map((result, index) => (
            result.userId == parseInt(userId) ? (
                <div key={`round-row-${result.userId}`} className="result-player-row result-player-row--you">
                <div className="result-player-avatar">
            {/* TODO: username initial */}
                    </div>
                    <div className="result-player-info">
                        <div className="result-player-name">You</div>
                        <div className="result-player-distance">{result.distance} km</div>
                    </div>
                    <span className="result-player-score">{result.roundPoints}</span>
                </div>) : (
                <div key={`round-row-${result.userId}`} className="result-player-row">
                    <div className="result-player-avatar">
                        {/* TODO: username initial */}
                    </div>
                    <div className="result-player-info">
                        <div className="result-player-name">{usernamesMap[result.userId]/*to do: fetch username*/}</div>
                        <div className="result-player-distance">{result.distance} km</div>
                    </div>
                    <span className="result-player-score">{result.roundPoints}</span>
            </div>

            <aside className="result-panel">

                <div className="result-panel-header">
                    <p className="result-panel-round-label">ROUND {currentRound} / {maxRounds}</p>
                    <h2 className="result-panel-title">Result</h2>
                    <p className="result-panel-subtitle">
                        {train?.line.name} · {train?.lineOrigin?.stationName} → {train?.lineDestination?.stationName}
                    </p>
                </div>

                <div className="result-actual-position">
                    <div className="result-actual-label">Actual Position</div>
                    <div className="result-actual-value">
                        Zwischen {train?.lastLeavingStation?.stationName ?? "?"} &amp; {train?.nextPendingStation?.stationName ?? "?"}
                    </div>
                </div>

                <div className="result-section-label">This Round</div>
        {sortedTotalResults.map((result, index) => (
            <div key={`total-row-${result.userId}`} className="result-standings-row">
          <span className="result-standings-rank">{index+1}.</span>
          <span className="result-standings-name">{result.userId == parseInt(userId) ? ("You"): usernamesMap[result.userId]}</span>
          <span className="result-standings-score">{result.totalPoints}</span>
        </div>
        ))}

        

        {/* Footer: next-round button */}
        <div className="result-panel-footer">
          {currentRound==maxRounds ? (
            <Button
            type="primary"
            className="btn-full"
            onClick={handleEndGame}
          >
            End Game
          </Button>
          ) : (
            !readyForNextRound ? (
            <Button
            type="primary"
            className="btn-full"
            onClick={handleReadyForNextRound}
          >
            {/* TODO: conditionally render "Waiting for host…" if !isHost */}
            {/*If we want to render how many players are ready: Add additional websockets logic */}
            Next round →
          </Button>) : (
            <Button
            type="primary"
            className="btn-full"
          >
            {/* TODO: conditionally render "Waiting for host…" if !isHost */}
            {/*If we want to render how many players are ready: Add additional websockets logic */}
            Waiting for other players →
          </Button>
          )
          )}
          
          
        </div>

                {sortedRoundResults.map((result) => (
                    result.userId === user?.userId ? (
                        <div key={`round-row-${result.userId}`} className="result-player-row result-player-row--you">
                            <div className="result-player-avatar" />
                            <div className="result-player-info">
                                <div className="result-player-name">You</div>
                                <div className="result-player-distance">{result.distance} km</div>
                            </div>
                            <span className="result-player-score">{result.roundPoints}</span>
                        </div>
                    ) : (
                        <div key={`round-row-${result.userId}`} className="result-player-row">
                            <div className="result-player-avatar" />
                            <div className="result-player-info">
                                <div className="result-player-name">{result.userId}</div>
                                <div className="result-player-distance">{result.distance} km</div>
                            </div>
                            <span className="result-player-score">{result.roundPoints}</span>
                        </div>
                    )
                ))}

                <div className="result-section-label">Overall Standings</div>

                {sortedTotalResults.map((result, index) => (
                    <div key={`total-row-${result.userId}`} className="result-standings-row">
                        <span className="result-standings-rank">{index + 1}.</span>
                        <span className="result-standings-name">
                            {result.userId === user?.userId ? "You" : result.userId}
                        </span>
                        <span className="result-standings-score">{result.totalPoints}</span>
                    </div>
                ))}

                <div className="result-panel-footer">
                    {currentRound === maxRounds ? (
                        <Button type="primary" className="btn-full" onClick={handleEndGame}>
                            End Game
                        </Button>
                    ) : !readyForNextRound ? (
                        <Button type="primary" className="btn-full" onClick={handleReadyForNextRound}>
                            Next round →
                        </Button>
                    ) : (
                        <Button type="primary" className="btn-full" disabled>
                            Waiting for other players →
                        </Button>
                    )}
                </div>

            </aside>
        </div>
    );
};

export default RoundOverview;