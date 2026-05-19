"use client"

import { useEffect } from "react";
import { useWebSocket } from "@/context/WebSocketContext";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import {App as AntdApp, Button, Image} from "antd";
import {notificationMessage} from "@/types/notificationMessage";
import {getApiDomain} from "@/utils/domain";

export default function NotificationListener() {
    const { isConnected, subscribe } = useWebSocket();
    const { user, token } = useAuth();
    const { notification } = AntdApp.useApp();
    const apiService  = useApi();
    const backendBase = getApiDomain()

    const handleAccept = async (requestingUserId: number) => {
        try {
            await apiService.post(`/friends/accept/${requestingUserId}`,
                {},
                { headers: { userId: user?.userId.toString() ?? "", token: token ?? "" } }
            );

        } catch (error) {
            console.error("Error when accepting request:", error);
        }
    };

    const handleReject = async (requestingUserId: number) => {
        try {
            await apiService.post(`/friends/reject/${requestingUserId}`,
                {},
                {
                    headers: { userId: user?.userId.toString() ?? "", token: token ?? "" }
                });

        } catch (error) {
            console.error("Error when reject request:", error);
        }
    };


    useEffect(() => {
        if (isConnected && user?.userId) {
            const topic = `/topic/${user.userId}/notifications`;

            const subscription = subscribe(topic, (message: notificationMessage)=> {
                switch (message.type) {
                    case "FRIEND_REQUEST": {
                        const key = `friend-request-${message.payload.userId}`;

                        notification.info({
                            title: "Freundschaftsanfrage erhalten :o",
                            description: `${message.payload.username} möchte dein Freund sein.`,
                            placement: "topRight",
                            duration: 7,
                            key,
                            actions: (
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Button
                                        className="sbb-btn sbb-btn--primary sbb-btn--sm"
                                        size="small"
                                        onClick={() => {
                                            handleAccept(message.payload.userId);
                                            notification.destroy(key);
                                        }}>
                                        Annehmen
                                    </Button>
                                    <Button
                                        className="sbb-btn sbb-btn--primary sbb-btn--sm"
                                        style={{ background: "grey", borderColor: "black" }}
                                        size="small"
                                        onClick={() => {
                                            handleReject(message.payload.userId);
                                            notification.destroy(key);
                                        }}>
                                        Ablehnen
                                    </Button>
                                </div>
                            )
                        });
                        break;
                    }

                    case "FRIEND_ACCEPT":
                        notification.success({
                            title: "Anfrage angenommen :)",
                            description: `${message.payload.username} ist jetzt dein Freund!`,
                            placement: "topRight",
                            duration: 4
                        });
                        break;

                    case "FRIEND_REJECT":
                        notification.error({
                            title: "Anfrage abgelehnt :(",
                            description: `${message.payload.username} hat möchte nicht mit dir befreundet sein.`,
                            placement: "topRight",
                            duration: 4
                        });
                        break;

                    case "ACHIEVEMENT":
                        console.log("[ACHIEVEMENT]", message.payload);
                        notification.info({
                            title: "Neues Achievement freigeschaltet!",
                            description: `${message.payload.name} - ${message.payload.description}`,
                            placement: "topRight",
                            duration: 5,
                            icon: <Image src={`${backendBase}${message.payload.iconUrl}`} alt={message.payload.name} style={{ width: 24, height: 24 }} />
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
