import { Train } from "./train";
export interface Round {
    currentRound: number;
    maxRounds: number;
    train: Train;
}