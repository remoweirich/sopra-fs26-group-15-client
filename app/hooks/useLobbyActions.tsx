// hooks/useLobbyActions.ts
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { LobbyCodeDTO, LobbyAccessDTO } from "@/types/lobby";

export const useLobbyActions = () => {
  const router = useRouter();
  const apiService = useApi();

  const handleJoin = async (lobbyId: number, lobbyCodeDTO: LobbyCodeDTO) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    console.log("Joining lobby...", { lobbyId, lobbyCodeDTO, userId });

    try {
      // Hier die echte API-Logik wieder einkommentieren:
      /*
      const response = await apiService.post<LobbyAccessDTO>(
        `/lobbies/${lobbyId}`,
        {
          headers: {
            userId: userId ? userId : "",
            token: token ?? "",
          },
          body: lobbyCodeDTO,
        }
      );
      router.push(`/lobbies/${response.lobbyId}`);
      */
      
      // Für den Übergang/Test:
      //router.push(`/lobbies/${lobbyId}`);
    } catch (error) {
      //console.error("Join failed", error);
    }
  };

  return { handleJoin };
};