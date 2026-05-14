import { RoundStartDTO, ResultDTO } from "./gameMessage";

export default interface ResyncDTO {
    type: "ROUND_START" | "SCORES";
    payload: RoundStartDTO | ResultDTO;
    remainingTime: number;
    maxRounds: number;
}