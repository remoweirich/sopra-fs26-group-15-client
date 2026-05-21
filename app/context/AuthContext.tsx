"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { MyUserDTO, UserDTO } from "@/types/user";
import { ApiService } from "@/api/apiService";
import { AuthContextType } from "@/types/auth";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/context/WebSocketContext";
import {useNotifications} from "@/context/NotificationContext";

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const apiService = new ApiService();

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<{ userId: number; username: string } | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { connect, disconnect } = useWebSocket();
    const { clearAll } = useNotifications();

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        setToken(null);
        setUser(null);
        disconnect();
        clearAll()
        console.log("[Auth] clearAll called, notifications should be empty")
        router.push("/login");
    };

    const softLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        setToken(null);
        setUser(null);
        disconnect();
        clearAll()
    };

    const fetchUser = async (token: string, userId: number, isInitial = false) => {
        try {
            const userData = await apiService.get<MyUserDTO | UserDTO>(
                `/users/${userId}`,
                { headers: { token: token } }
            );
            if (userData && "email" in userData) {
                setUser({ userId, username: userData.username });

                setToken(token);
                connect(String(userId), token);


            } else {
                localStorage.removeItem("token");
                localStorage.removeItem("userId");
                setToken(null);
                setUser(null);
                disconnect();
                if (!isInitial) router.push("/login");
            }
        }  catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        setToken(null);
        setUser(null);
        disconnect();
        if (!isInitial) router.push("/login");
    } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            if (typeof window === "undefined") return;
            const rawToken = localStorage.getItem("token");
            const rawUserId = localStorage.getItem("userId");
            if (rawToken && rawUserId) {
                try {
                    const parsedToken = JSON.parse(rawToken);
                    const parsedUserId = JSON.parse(rawUserId);
                    await fetchUser(parsedToken, Number(parsedUserId), true);

                } catch (e) {
                    console.error("Fehler beim Parsen der Auth-Daten", e);
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    const login = async (token: string, userId: number) => {
        localStorage.setItem("token", JSON.stringify(token));
        localStorage.setItem("userId", JSON.stringify(userId));
        clearAll();
        //setToken(token);
        await fetchUser(token, userId);
        //connect(String(userId), token);
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, softLogout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};