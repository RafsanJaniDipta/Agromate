"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/lib/api";

// One socket per dashboard tab, opened after sign-in, for live chat and notifications.
// The session cookie authenticates it, just like the REST calls.

const SocketContext = createContext<Socket | null>(null);

// Rendered inside RoleGate, which shows its children only in the browser after sign-in
export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [socket] = useState(() => io(API_URL, { withCredentials: true, autoConnect: false }));

  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

// Runs `handler` for every `event` from the server. The latest handler is always used,
// so callers can pass an inline function without resubscribing on each render.
export function useSocketEvent<T>(event: string, handler: (payload: T) => void) {
  const socket = useContext(SocketContext);
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!socket) return;
    const listener = (payload: T) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}

// Sends an event to the server; dropped while the socket isn't connected (it's only "typing…")
export function useSocketEmit() {
  const socket = useContext(SocketContext);
  return (event: string, payload: unknown) => {
    if (socket?.connected) socket.emit(event, payload);
  };
}
