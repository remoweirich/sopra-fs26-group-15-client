"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type AppNotification =
  | { id: string; type: "friend_request"; from: string; fromId: number; time: Date }
  | { id: string; type: "friend_accepted"; from: string; time: Date }
  | { id: string; type: "friend_rejected"; from: string; time: Date }
  | { id: string; type: "achievement"; name: string; description: string; iconUrl?: string; time: Date }
  | { id: string; type: "game_invite"; from: string; fromId: number; lobbyName: string; lobbyId: number; time: Date }
  | { id: string; type: "game_declined"; from: string; time: Date };

export type NewNotification =
  | { type: "friend_request"; from: string; fromId: number }
  | { type: "friend_accepted"; from: string }
  | { type: "friend_rejected"; from: string }
  | { type: "feedback"; from: string }
  | { type: "achievement"; name: string; description: string; iconUrl?: string }
  | { type: "game_invite"; from: string; fromId: number; lobbyName: string; lobbyId: number }
  | { type: "game_declined"; from: string };

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  add: (notif: NewNotification, customId?: string) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  add: () => {},
  dismiss: () => {},
  clearAll: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const add = useCallback((notif: NewNotification, customId?: string) => {

    console.log("[NotificationContext] add called:", notif);
    const id = customId ?? `${notif.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const entry = { ...notif, id, time: new Date() } as AppNotification;
    setNotifications((prev) => [entry, ...prev]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(
    (n) => n.type === "friend_request" || n.type === "game_invite" || n.type === "achievement"
  ).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, add, dismiss, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}