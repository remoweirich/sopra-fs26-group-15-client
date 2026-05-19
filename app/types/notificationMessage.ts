export interface FriendRequestDTO {
    userId: number;
    username: string;
    friendshipId: number;
}

export type notificationMessage =
    | { type: "FRIEND_REQUEST"; payload: FriendRequestDTO }
    | { type: "FRIEND_ACCEPT"; payload: FriendRequestDTO }
    | { type: "FRIEND_REJECT"; payload: FriendRequestDTO };

