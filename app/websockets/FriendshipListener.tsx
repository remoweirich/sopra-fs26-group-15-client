"use client"

import { useEffect } from "react";
import { useWebSocket } from "@/context/WebSocketContext";
import { useAuth } from "@/context/AuthContext";
import { App as AntdApp } from "antd";
import {FriendRequestDTO, notificationMessage} from "@/types/notificationMessage";

export default function FriendshipListener() {
    const { isConnected, subscribe } = useWebSocket();
    const { user } = useAuth();
    const { notification } = AntdApp.useApp();

    useEffect(() => {
        if (isConnected && user?.userId) {
            const topic = `/topic/${user.userId}/friends`;

            const subscription = subscribe(topic, (message: notificationMessage)=> {
                if (message.type === "FRIEND_REQUEST") {
                    notification.info({
                        title: "New Friend Request",
                        description: `${message.payload.username} wants to be your friend.`,
                        placement: "topRight",
                    });
                } else if (message.type === "FRIEND_ACCEPT") {
                    notification.success({
                        title: "Request accepted",
                        description: `${message.payload.username} is now your friend!`,
                        placement: "topRight",
                    })
            }
        });

            return () => {
            subscription?.unsubscribe();
            };
        }
    }, [isConnected, user, subscribe, notification]);

    return null;
}
