"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

export type AppNotification =
  | { id: string; type: "friend_request"; from: string; fromId: number; time: Date }
  | { id: string; type: "friend_accepted"; from: string; time: Date }
  | { id: string; type: "friend_rejected"; from: string; time: Date }
  | { id: string; type: "achievement"; name: string; description: string; iconUrl?: string; time: Date }

export type NewNotification =
  | { type: "friend_request"; from: string; fromId: number }
  | { type: "friend_accepted"; from: string }
  | { type: "friend_rejected"; from: string }
  | { type: "achievement"; name: string; description: string; iconUrl?: string }

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  add: (notif: NewNotification, customId?: string) => void;
  dismiss: (id: string) => void;
  clearInfoNotifications: () => void;
  clearAll: () => void;
  friendsVersion: number;
  bumpFriendsVersion: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  add: () => {},
  dismiss: () => {},
  clearInfoNotifications: () => {},
  clearAll: () => {},
  friendsVersion: 0,
  bumpFriendsVersion: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [friendsVersion, setFriendsVersion] = useState(0);

  const add = useCallback((notif: NewNotification, customId?: string) => {
    const id =
      customId ??
      `${notif.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const entry = { ...notif, id, time: new Date() } as AppNotification;

    setNotifications((prev) => {
      // Important: fixed ids such as friend-request-123 must not appear twice.
      const withoutDuplicate = prev.filter((n) => n.id !== id);
      return [entry, ...withoutDuplicate];
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearInfoNotifications = useCallback(() => {
    // Keep actionable friend requests until the user accepts/rejects them.
    setNotifications((prev) => prev.filter((n) => n.type === "friend_request"));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const bumpFriendsVersion = useCallback(() => {
    setFriendsVersion((v) => v + 1);
  }, []);

  const unreadCount = notifications.length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        add,
        dismiss,
        clearInfoNotifications,
        clearAll,
        friendsVersion,
        bumpFriendsVersion,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
