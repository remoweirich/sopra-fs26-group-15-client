// hooks/useLobbyActions.ts
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { LobbyCodeDTO, LobbyAccessDTO } from "@/types/lobby";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getApiDomain } from "@/utils/domain";
import { join } from "path";
import { useWebSocket } from "@/context/WebSocketContext"; // Importieren!


export const useLobbyActions = () => {
  const router = useRouter();
  const apiService = useApi();
  const { connect } = useWebSocket(); // WebSocket-Funktion holen

  const handleJoin = async (lobbyId: number, lobbyCodeDTO: LobbyCodeDTO) => {
 
    
    const rawToken = localStorage.getItem("token");
    let token = rawToken ? JSON.parse(rawToken) : "";
    const rawUserId = localStorage.getItem("userId");
    let userId = rawUserId ? JSON.parse(rawUserId) : -1;


    try {
      const lobbyAccessDTO = await joinLobby(lobbyId, lobbyCodeDTO, Number(userId), token);
      //await connectToLobbyWebSocket(lobbyId, Number(userId), token);
      //router.push(`/lobbies/${lobbyId}`);
      console.log("Lobby beigetreten, weiterleiten zur Lobby-Seite...");
      console.log(lobbyAccessDTO);
      userId = lobbyAccessDTO.userId;
      token = lobbyAccessDTO.token;

      localStorage.setItem("token", JSON.stringify(token)); 
      localStorage.setItem("userId", JSON.stringify(userId));

      // 2. WebSocket: Standleitung öffnen
      // Wir schicken userId und token mit, damit der Interceptor im Backend uns lässt
      connect(userId.toString(), token);
      console.log("lobbyId before router push: ", lobbyId);
      router.push(`/lobbies/${lobbyId}`);
    } catch (error) {
      console.error("Fehler beim Beitreten zur Lobby:", error);
      // Hier kannst du dem User eine Fehlermeldung anzeigen

    }

  };

  const joinLobby = async (lobbyId: number, lobbyCodeDTO: LobbyCodeDTO, userId: number, token: string) => {
    // Hier nutzen wir deinen apiService für den POST-Call
    // Wir schicken die userId und das Token in den Headern mit, wie du es bisher hattest
    
    console.log("useLobbyActions - joinLobby aufgerufen mit:", { lobbyId, lobbyCodeDTO, userId, token });
    
    const response = await apiService.post<LobbyAccessDTO>(
      `/lobbies/${lobbyId}`, // Dein Endpoint für den Beitritt
      lobbyCodeDTO,               // Der Body (z.B. der Lobby-Code)
      {
        headers: {
          token: token,
          userId: userId.toString(),
        },
      }
    );

    console.log("useLobbyActions - joinLobby erfolgreich, Antwort:", response);


    console.log("REST: Erfolgreich in der DB beigetreten");
    return response;

  };
  return { handleJoin };

}

  