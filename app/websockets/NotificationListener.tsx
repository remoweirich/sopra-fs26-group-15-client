"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/context/WebSocketContext";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { App as AntdApp, Button, Image } from "antd";
import { notificationMessage } from "@/types/notificationMessage";
import { getApiDomain } from "@/utils/domain";
import { useNotifications } from "@/context/NotificationContext";

export default function NotificationListener() {
  const { isConnected, subscribe } = useWebSocket();
  const { user, token } = useAuth();
  const { notification } = AntdApp.useApp();
  const router = useRouter();
  const apiService = useApi();
  const backendBase = getApiDomain();

  const {
    add: addNotification,
    dismiss: dismissNotif,
    bumpFriendsVersion,
  } = useNotifications();

  const closeFriendRequestNotification = useCallback(
    (requestingUserId: number) => {
      const key = `friend-request-${requestingUserId}`;
      dismissNotif(key);
      notification.destroy(key);
    },
    [dismissNotif, notification]
  );

  const handleAccept = useCallback(
    async (requestingUserId: number) => {
      if (!user?.userId || !token) return;

      try {
        await apiService.post(
          `/friends/accept/${requestingUserId}`,
          {},
          { headers: { userId: user.userId.toString(), token } }
        );

        closeFriendRequestNotification(requestingUserId);
        bumpFriendsVersion();
      } catch (error) {
        console.error("Error when accepting request:", error);
      }
    },
    [apiService, user?.userId, token, closeFriendRequestNotification, bumpFriendsVersion]
  );

  const handleReject = useCallback(
    async (requestingUserId: number) => {
      if (!user?.userId || !token) return;

      try {
        await apiService.post(
          `/friends/reject/${requestingUserId}`,
          {},
          { headers: { userId: user.userId.toString(), token } }
        );

        closeFriendRequestNotification(requestingUserId);
        bumpFriendsVersion();
      } catch (error) {
        console.error("Error when rejecting request:", error);
      }
    },
    [apiService, user?.userId, token, closeFriendRequestNotification, bumpFriendsVersion]
  );

  useEffect(() => {
    if (!isConnected || !user?.userId) return;

    const topic = `/topic/${user.userId}/notifications`;

    const subscription = subscribe(topic, (message: notificationMessage) => {
      switch (message.type) {
        case "FRIEND_REQUEST": {
          const key = `friend-request-${message.payload.userId}`;

          addNotification(
            {
              type: "friend_request",
              from: message.payload.username,
              fromId: message.payload.userId,
            },
            key
          );

          // User 2 may already be on Profile > Friends. Reload pendingReceived there.
          bumpFriendsVersion();

          notification.info({
            title: "Freundschaftsanfrage erhalten",
            description: `${message.payload.username} möchte dein Freund sein.`,
            placement: "topRight",
            duration: 7,
            key,
            actions: (
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  className="sbb-btn sbb-btn--primary sbb-btn--sm"
                  size="small"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleAccept(message.payload.userId);
                  }}
                >
                  Annehmen
                </Button>
                <Button
                  className="sbb-btn sbb-btn--primary sbb-btn--sm"
                  style={{ background: "grey", borderColor: "black" }}
                  size="small"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleReject(message.payload.userId);
                  }}
                >
                  Ablehnen
                </Button>
              </div>
            ),
            className: "clickable-notification",
            style: { cursor: "pointer" },
            onClick: () => {
              router.push(`/users/${user.userId}?tab=friends`);
            },
          });
          break;
        }

        case "FRIEND_ACCEPT":
          addNotification({
            type: "friend_accepted",
            from: message.payload.username,
          });

          // User 1 may be on Profile > Friends or Leaderboard. Reload friend state.
          bumpFriendsVersion();

          notification.success({
            title: "Anfrage angenommen",
            description: `${message.payload.username} ist jetzt dein Freund!`,
            placement: "topRight",
            duration: 4,
            className: "clickable-notification",
            style: { cursor: "pointer" },
            onClick: () => {
              router.push(`/users/${user.userId}?tab=friends`);
            },
          });
          break;

        case "FRIEND_REJECT":
          addNotification({
            type: "friend_rejected",
            from: message.payload.username,
          });

          // User 1 may be on Profile > Friends or Leaderboard. Remove pending state.
          bumpFriendsVersion();

          notification.error({
            title: "Anfrage abgelehnt",
            description: `${message.payload.username} möchte nicht mit dir befreundet sein.`,
            placement: "topRight",
            duration: 4,
            className: "clickable-notification",
            style: { cursor: "pointer" },
            onClick: () => {
              router.push(`/users/${user.userId}?tab=friends`);
            },
          });
          break;

        case "ACHIEVEMENT":
          console.log("[ACHIEVEMENT]", message.payload);

          addNotification({
            type: "achievement",
            name: message.payload.name,
            description: message.payload.description,
            iconUrl: message.payload.iconUrl,
          });

          notification.info({
            title: "Neues Achievement freigeschaltet!",
            description: `${message.payload.name} — ${message.payload.description}`,
            placement: "topRight",
            duration: 5,
            icon: (
              <Image
                src={`${backendBase}${message.payload.iconUrl}`}
                alt={message.payload.name}
                style={{ width: 24, height: 24 }}
              />
            ),
            className: "clickable-notification",
            style: { cursor: "pointer" },
            onClick: () => {
              router.push(`/users/${user.userId}?tab=achievements`);
            },
          });
          break;

        case "FEEDBACK":
          console.log("[FEEDBACK]", message.payload);

          notification.success({
            title: "Anfrage gesendet!",
            description: `Freundschaftsanfrage wurde erfolgreich an ${message.payload.username} gesendet`,
            placement: "topRight",
            duration: 4,
          });
          break;
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [
    isConnected,
    user?.userId,
    subscribe,
    notification,
    router,
    addNotification,
    bumpFriendsVersion,
    handleAccept,
    handleReject,
    backendBase,
  ]);

  // Beim Login: bestehende pending Friend Requests laden.
  useEffect(() => {
    if (!user?.userId || !token) return;

    const loadPending = async () => {
      try {
        const pending = await apiService.get<{ userId: number; username: string }[]>(
          `/friends/${user.userId}/pendingReceived`,
          { headers: { userId: user.userId.toString(), token } }
        );

        pending.forEach((req) => {
          addNotification(
            {
              type: "friend_request",
              from: req.username,
              fromId: req.userId,
            },
            `friend-request-${req.userId}`
          );
        });

        bumpFriendsVersion();
      } catch (e) {
        console.error("Failed to load pending friend requests:", e);
      }
    };

    loadPending();
  }, [user?.userId, token, apiService, addNotification, bumpFriendsVersion]);

  return null;
}
