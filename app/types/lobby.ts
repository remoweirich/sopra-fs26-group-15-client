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

export interface UpdateLobbyPostDTO {
  lobbyName: string;
  size: number;
  maxRounds: number;
  visibility: "PUBLIC" | "PRIVATE";
}