export interface Lobby {
  lobbyId: string;
  lobbyName: string;
  lobbyCode: string;
  adminId: string;
  rounds: number;
  visibility: "PUBLIC" | "PRIVATE";
  lobbyState: "WAITING" | "IN_GAME" | "FINISHING";
  currentRound: number;
  scores: number[];
  size: number;
  players?: string[];
}