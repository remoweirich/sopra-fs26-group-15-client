import {Achievement} from "@/types/user";

export interface FriendRequestDTO {
    userId: number;
    username: string;
    friendshipId: number;
}

export interface AchievementDTO{
    achievementId: number;
    name: string;
    description: string;
    iconUrl: string;
}

export type notificationMessage =
    | { type: "FRIEND_REQUEST"; payload: FriendRequestDTO }
    | { type: "FRIEND_ACCEPT"; payload: FriendRequestDTO }
    | { type: "FRIEND_REJECT"; payload: FriendRequestDTO }
    | { type: "ACHIEVEMENT"; payload: AchievementDTO }
    ;


