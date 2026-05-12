"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/context/WebSocketContext";
import { LobbyMessage } from "@/types/lobbyMessage";
import TrainLoader from "@/components/TrainLoader";

interface LobbyLoadingScreenProps {
  readonly lobbyId: number;
}

const LobbyLoadingScreen: React.FC<LobbyLoadingScreenProps> = ({ lobbyId }) => {
  const router = useRouter();
  const { isConnected, subscribe } = useWebSocket();

  // Subscribe to lobby topic and navigate to the game on GAME_START.
  // The parent lobby page also has a subscription that should fire — this is a
  // defensive copy in case the parent has already begun unmounting when the
  // server emits the message. Without it the user can get stuck on the loader.
  useEffect(() => {
    if (!isConnected || !lobbyId) return;
    const subscription = subscribe<LobbyMessage>(
      `/topic/lobby/${lobbyId}`,
      (message) => {
        if (message.type === "GAME_START") {
          router.push(`/game/${lobbyId}`);
        }
      }
    );
    return () => {
      subscription?.unsubscribe();
    };
  }, [isConnected, lobbyId, router, subscribe]);

  return <TrainLoader label="Lade Fahrplan" />;
};

export default LobbyLoadingScreen;
