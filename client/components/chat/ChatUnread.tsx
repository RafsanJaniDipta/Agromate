"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useCurrentUser } from "@/components/dashboard/RoleGate";
import { useSocketEvent } from "@/components/realtime/RealtimeProvider";
import { getUnreadMessageCount, type ChatMessageEvent } from "@/lib/chat";

// Unread chat messages across all conversations, for the "Messages" badge in the menus.
// Refetched when someone else writes; the chat page calls `refresh` after marking a chat read.

type ChatUnread = { count: number; refresh: () => void };

const ChatUnreadContext = createContext<ChatUnread>({ count: 0, refresh: () => {} });

export function ChatUnreadProvider({ children }: { children: React.ReactNode }) {
  const me = useCurrentUser();
  const [count, setCount] = useState(0);

  // A failed count just keeps the old badge
  const refresh = useCallback(() => {
    getUnreadMessageCount()
      .then(setCount)
      .catch(() => {});
  }, []);

  useEffect(refresh, [refresh]);

  useSocketEvent<ChatMessageEvent>("chat:message", ({ message }) => {
    if (message.senderId !== me.id) refresh();
  });
  // Messages that arrived while the connection was down
  useSocketEvent("connect", refresh);

  return <ChatUnreadContext.Provider value={{ count, refresh }}>{children}</ChatUnreadContext.Provider>;
}

export const useChatUnread = () => useContext(ChatUnreadContext);
