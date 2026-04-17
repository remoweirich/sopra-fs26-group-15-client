"use client";
import React, { createContext, useContext, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getApiDomain } from "@/utils/domain";


interface WebSocketContextType {
  connect: (lobbyId: number, userId: string, token: string) => void;
  disconnect: () => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stompClient = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = (lobbyId: number, userId: string, token: string) => {
    if (stompClient.current?.active) return; // Bereits verbunden

    const socket = new SockJS(`${getApiDomain()}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { userId, token },
      onConnect: () => {
        console.log("WebSocket verbunden!");
        setIsConnected(true);
        
        // Wir abonnieren die Lobby. WICHTIG: Header auch hier mitsenden!
        client.subscribe(`/topic/lobby/${lobbyId}`, (message) => {
          console.log("Broadcast erhalten:", JSON.parse(message.body));
          // Hier könntest du ein Event-System triggern
        }, { userId, token });
      },
      onDisconnect: () => setIsConnected(false),
    });

    client.activate();
    stompClient.current = client;
  };

  const disconnect = () => {
    stompClient.current?.deactivate();
    stompClient.current = null;
    setIsConnected(false);
  };

  return (
    <WebSocketContext.Provider value={{ connect, disconnect, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error("useWebSocket must be used within WebSocketProvider");
  return context;
};