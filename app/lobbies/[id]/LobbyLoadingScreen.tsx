"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/context/WebSocketContext";
import { LobbyMessage } from "@/types/lobbyMessage";

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
            // console.log(message);
            if (message.type === "GAME_START") {
              console.log(" Started");
              router.push(`/game/${lobbyId}`);
            }
            }
      );
    }, [webSocket.isConnected, lobbyId, router, webSocket]);

  return (
    <div>Loading trains...</div>
  )
};

export default LobbyLoadingScreen;