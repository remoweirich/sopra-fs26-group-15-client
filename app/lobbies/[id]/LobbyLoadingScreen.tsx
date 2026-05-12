"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/context/WebSocketContext";
import { LobbyMessage } from "@/types/lobbyMessage";
import LoadingScreen from "@/LoadingScreen";

interface LobbyLoadingScreenProps {
  lobbyId: number;
}

const LobbyLoadingScreen: React.FC<LobbyLoadingScreenProps> = ({ lobbyId }) => {
  const router = useRouter();
  const webSocket = useWebSocket();

  useEffect(() => {
    if (!webSocket.isConnected || !lobbyId) return;

    const subscription = webSocket.subscribe<LobbyMessage>(
      `/topic/lobby/${lobbyId}`,
      (message) => {
        if (message.type === "GAME_START") {
          console.log("Started");
          router.push(`/game/${lobbyId}`);
        }
      }
    );

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [webSocket.isConnected, lobbyId, router, webSocket]);

  return <LoadingScreen label="Lade Züge" fullscreen />;
};

export default LobbyLoadingScreen;