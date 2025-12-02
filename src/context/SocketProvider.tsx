// src/context/SocketProvider.tsx
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const API_BASE = "http://localhost:3001";
const SOCKET_URL = API_BASE;

type SocketContextValue = {
    socket: Socket | null;
    connected: boolean;
    ensureJoin: (payload: any) => void;
    getSocket: () => Socket | null;
};

const SocketContext = createContext<SocketContextValue>({
    socket: null,
    connected: false,
    ensureJoin: () => { },
    getSocket: () => null
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const socketRef = useRef<Socket | null>(null);
    const [socketState, setSocketState] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // crear socket una vez
        const s = io(SOCKET_URL, {
            transports: ["websocket"],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            path: "/socket.io" // leave default unless your server uses custom path
        });

        socketRef.current = s;
        setSocketState(s);

        const onConnect = () => {
            console.debug("[SocketProvider] connected");
            setConnected(true);
        };
        const onDisconnect = (reason: any) => {
            console.debug("[SocketProvider] disconnected", reason);
            setConnected(false);
        };
        const onError = (err: any) => {
            console.warn("[SocketProvider] socket error", err);
        };

        s.on("connect", onConnect);
        s.on("disconnect", onDisconnect);
        s.on("error", onError);

        return () => {
            try {
                s.off("connect", onConnect);
                s.off("disconnect", onDisconnect);
                s.off("error", onError);
                s.disconnect();
            } catch (e) { /* ignore */ }
            socketRef.current = null;
            setSocketState(null);
            setConnected(false);
        };
    }, []);

    const ensureJoin = useCallback((payload: any) => {
        try {
            const s = socketRef.current;
            if (!s) return;
            if (s.connected) {
                s.emit("join", payload);
                return;
            }
            // emitir al conectarse si aún no lo está
            const onConnectOnce = () => {
                try { s.emit("join", payload); } catch { }
                s.off("connect", onConnectOnce);
            };
            s.on("connect", onConnectOnce);
        } catch (e) {
            console.warn("[SocketProvider] ensureJoin error", e);
        }
    }, []);

    const getSocket = () => socketRef.current;

    return (
        <SocketContext.Provider value={{ socket: socketState, connected, ensureJoin, getSocket }}>
            {children}
        </SocketContext.Provider>
    );
};
