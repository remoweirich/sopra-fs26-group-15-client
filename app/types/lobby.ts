export interface Lobby {
  lobbyId: number;
  lobbyName: string;
  lobbyCode: string;
  adminId: number;
  rounds: number;
  visibility: "PUBLIC" | "PRIVATE";
  lobbyState: "WAITING" | "IN_GAME" | "FINISHING";
  currentRound: number;
  scores: number[];
  size: number;
  players?: number[];
}

export interface CreateLobbyPostDTO {
  userId: number;
  token: string;
  lobbyName: string;
  size: number;
  visibility: "PUBLIC" | "PRIVATE";
  maxRounds: number;
}

export interface LobbyAccessDTO {
  lobbyId: number;
  lobbyCode: string;
  userId: number;
  token: string;
}

export interface LobbyCodeDTO {
  lobbyCode: string;
}