// hooks/useLobbyActions.ts
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { LobbyCodeDTO, LobbyAccessDTO } from "@/types/lobby";
// import { Client } from '@stomp/stompjs';
// import SockJS from 'sockjs-client';
// import { getApiDomain } from "@/utils/domain";
// import { join } from "path";
import { useWebSocket } from "@/context/WebSocketContext"; // Importieren!
import { useAuth } from "@/context/AuthContext";
import { App } from "antd";


export const useLobbyActions = () => {
  const router = useRouter();
  const apiService = useApi();
  const { connect } = useWebSocket(); // WebSocket-Funktion holen
  const { user: currentUser, token, login } = useAuth();
  const { message } = App.useApp();


  const handleJoin = async (lobbyId: number, lobbyCodeDTO: LobbyCodeDTO, overrideCredentials?:{userId:number,token:string}) => {
    const effectiveUserId = overrideCredentials?.userId ?? currentUser?.userId ?? -1;
    const effectiveToken = overrideCredentials?.token ?? token ?? "";

    try {
      const response: LobbyAccessDTO = await apiService.post<LobbyAccessDTO>(
        `/lobbies/${lobbyId}`,
        lobbyCodeDTO,
        {
          headers: {
            token: effectiveToken,
            userId: effectiveUserId.toString(),
          },
        }
      );

      await login(response.token, response.userId);
      connect(response.userId.toString(), response.token);
      router.push(`/lobbies/${lobbyId}`);
    } catch (error: any) {
      // Propagate error to caller for UI handling
      throw error;
    }
  };
  return { handleJoin };
}

