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
    // 1. Roh-Daten holen
    const rawUserId = localStorage.getItem("userId");
    const rawToken = localStorage.getItem("token");

    // 2. PARSEN, um die Anführungszeichen zu entfernen
    // Wenn rawToken '"abc"' ist, wird token durch JSON.parse zu 'abc'
    let userId = rawUserId ? JSON.parse(rawUserId) : -1;
    let token = rawToken ? JSON.parse(rawToken) : "";


    try {
      const lobbyAccesDTO: LobbyAccessDTO = await joinLobby(lobbyId, lobbyCodeDTO, Number(userId), token);
      //await connectToLobbyWebSocket(lobbyId, Number(userId), token);
      //router.push(`/lobbies/${lobbyId}`);
      console.log("Lobby beigetreten, weiterleiten zur Lobby-Seite...");
      console.log(lobbyAccesDTO);
      userId = lobbyAccesDTO.userId;
      token = lobbyAccesDTO.token;

      localStorage.setItem("token", JSON.stringify(token)); 
      localStorage.setItem("userId", JSON.stringify(userId));

      // 2. WebSocket: Standleitung öffnen
      // Wir schicken userId und token mit, damit der Interceptor im Backend uns lässt
      connect(userId.toString(), token);
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
          token: token, // Fallback auf leeren String, falls token null ist
          userId: userId.toString(), // Fallback auf -1, falls userId null ist
        },
      }
    );

    console.log("useLobbyActions - joinLobby erfolgreich, Antwort:", response);

  
    console.log("REST: Erfolgreich in der DB beigetreten");
    return response;

  };
  return { handleJoin };

}

  