"use client";


import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useWebSocket } from "@/context/WebSocketContext";
import { Lobby } from "@/types/lobby";
import { LobbyMessage } from "@/types/lobbyMessage";
import { App, Button} from "antd";
import { useAuth } from "@/context/AuthContext";


const LobbyWaitPage: React.FC = () => {
  const router     = useRouter();
  const params     = useParams();
  const lobbyId = Number(params.id);
  const apiService  = useApi();
  const webSocket = useWebSocket();
  const { message } = App.useApp();

  //const token = JSON.parse(localStorage.getItem("token") || '""') as string;
  //const userId = JSON.parse(localStorage.getItem("userId") || '""') as number;
  const {user:currentUser, token} = useAuth();
    const [lobby, setLobby]   = useState<Lobby | null>(null);

  
  // const [userData, setUserData] = useState< {userId: number; token: string} | null>(null);


  // ── Initial fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lobbyId || !token || !currentUser) return;

    const fetchLobby = async () => {
      try {
        const response = await apiService.get<Lobby>(
            `/lobbies/${lobbyId}`,
            {
              headers: {userId: currentUser.userId.toString(), token: token},
            }
            );
        console.log(response); //to be removed
        setLobby(response);
      } catch (e) {
        console.error("Fetch error: ", e);
        router.push("/lobbies"); // If lobby not found or error occurs, navigate back to lobby list 
      }
    };
    fetchLobby();
  }, [lobbyId, token, currentUser, router, apiService]);


  // ── Websocket fetch ────────────────────────────────────────────────────────
  // 1. Zuerst: Ein Effekt, der die Verbindung bei Bedarf wiederherstellt (Refresh-Schutz)
useEffect(() => {
  if (!webSocket.isConnected && token && currentUser) {
    console.log("WebSocket nicht verbunden - starte Reconnect...");
    webSocket.connect(currentUser.userId.toString(), token);
  }
}, [webSocket.isConnected, token, currentUser, webSocket]);
  
  useEffect(() => {
    if (!webSocket.isConnected || !lobbyId) return;

    const subscription = webSocket.subscribe<LobbyMessage>(
        `/topic/lobby/${lobbyId}`,
        (message) => {
          console.log(message);
          if (message.type === "LOBBY_STATE") {
            console.log("WebSocket Update received", message.payload);
            setLobby(message.payload);
          } else if (message.type === "GAME_START") {
            console.log(" Started");
            router.push(`/game/${lobbyId}`);
          }
          }
    );

    return () => subscription?.unsubscribe();
  }, [webSocket.isConnected, lobbyId, router, webSocket]);


  // ── Actions ──────────────────────────────────────────────────────────────
  const handleStartGame = async () => {
    if (!webSocket.isConnected){
      message.warning("Verbindung wird noch aufgebaut...");
    return;}
    console.log("Starting game");

    const destination = `/app/lobby/${lobbyId}/start`;

    const messageBody: LobbyMessage = {
      type: "START_GAME",
      payload: null
    }

    webSocket.publish(destination, messageBody);
  };

  const handleLeave = async () => {
    //   if (!webSocket.isConnected){
    //     antdMessage.warning("Verbindung wird noch aufgebaut...");
    //     return;
    //   }
    //   webSocket.publish(`/app/lobby/${lobbyId}/leave`, {});
    // router.push("/lobbies"); // TODO: send leave request to backend, 
  };

  const updateLobbySettings = async () => {

  }

  // Vor dem return in der Komponente:
  const isHost = lobby && currentUser ? lobby.admin?.userId === currentUser.userId : false;

  if (!lobby) return <div className="page-center">Laden...</div>;
  

  

  // ── Render ───────────────────────────────────────────────────────────────

  return (
      <div className="page-center page-content">
        <div className="card card--lobby-wait card--wide">

          {/* Header: Name + Status */}
          <div className="wait-header">
            <h2 className="wait-lobby-name">{lobby.lobbyName}</h2>
            <span className="badge badge-waiting">Waiting...</span>
          </div>

          {/* Player List Section */}
          <div className="wait-section-label">
            PLAYERS ({lobby.users?.length || 0} / {lobby.size})
          </div>

          <div className="wait-player-list">
            {lobby.users?.map((userDTO) => (
                <div key={userDTO.username} className={`wait-player-row`}>
                  {userDTO.username}
                </div>
            ))}
          </div>

          <div className="u-divider" />

          {/* Invite Section */}
          <div className="wait-section-label">INVITE FRIENDS</div>
          <div className="wait-invite-box">
            <code className="wait-invite-code">{lobby.lobbyCode}</code>
            <Button
                size="small"
                onClick={() => navigator.clipboard.writeText(lobby.lobbyCode)}
            >
              Copy
            </Button>
          </div>

          {/* Action buttons */}
          <div className="wait-actions">
            {isHost && (
                <Button
                    type="primary"
                    className="btn-full"
                    onClick={handleStartGame}
                >
                  Start Game
                </Button>
            )}

            <Button
                className="btn-ghost-muted btn-full"
                onClick={handleLeave}
            >
              {isHost ? "Leave & Transfer Host" : "Leave Lobby"}
            </Button>
          </div>

        </div>
      </div>
  );
};

export default LobbyWaitPage;