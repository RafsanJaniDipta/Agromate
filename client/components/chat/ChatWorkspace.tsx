"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MessagesIcon } from "@/components/icons";
import ChatThread from "@/components/chat/ChatThread";
import ConversationList from "@/components/chat/ConversationList";
import NewChatPanel from "@/components/chat/NewChatPanel";
import { useCurrentUser } from "@/components/dashboard/RoleGate";
import { useSocketEvent } from "@/components/realtime/RealtimeProvider";
import {
  getConversations,
  startConversation,
  type ChatMessage,
  type ChatMessageEvent,
  type Conversation,
} from "@/lib/chat";

// Remembers the open chat in the address bar (?c=…) so a reload or a shared link reopens it
function rememberInUrl(conversationId: string | null) {
  const url = new URL(window.location.href);
  url.searchParams.delete("with");
  if (conversationId) url.searchParams.set("c", conversationId);
  else url.searchParams.delete("c");
  window.history.replaceState(null, "", url);
}

type ChatWorkspaceProps = {
  // ?c= : a conversation to open
  initialConversationId: string | null;
  // ?with= : a person to open the chat with, e.g. from an expert's profile (created if new)
  initialPartnerId: string | null;
};

// The chat page of every dashboard: conversation list on the left, the open chat on the right.
// On phones only one side shows at a time.
export default function ChatWorkspace({ initialConversationId, initialPartnerId }: ChatWorkspaceProps) {
  const t = useTranslations("chat");
  const me = useCurrentUser();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  // Opened once the list arrives (from a link or a notification)
  const wantedId = useRef(initialConversationId);

  const select = useCallback((conversation: Conversation | null) => {
    setSelected(conversation);
    setIsPicking(false);
    rememberInUrl(conversation?.id ?? null);
  }, []);

  const loadConversations = useCallback(() => {
    getConversations()
      .then((list) => {
        setConversations(list);
        setLoadFailed(false);
        const wanted = list.find((conversation) => conversation.id === wantedId.current);
        wantedId.current = null;
        if (wanted) select(wanted);
      })
      .catch(() => setLoadFailed(true));
  }, [select]);

  useEffect(loadConversations, [loadConversations]);

  // A chat with no messages yet isn't in the list, so it's opened directly
  useEffect(() => {
    if (!initialPartnerId) return;
    startConversation(initialPartnerId)
      .then(select)
      .catch(() => {}); // not allowed or gone: the list is still there
  }, [initialPartnerId, select]);

  // Moves a chat to the top with its newest message; a chat not in the list yet means
  // someone new wrote, so the list is fetched again
  function applyMessage(conversationId: string, message: ChatMessage) {
    const known = conversations?.some((conversation) => conversation.id === conversationId);
    if (!known && selected?.id !== conversationId) {
      loadConversations();
      return;
    }

    const countsAsUnread = message.senderId !== me.id && selected?.id !== conversationId;
    setConversations((current) => {
      const existing = current?.find((conversation) => conversation.id === conversationId) ?? selected;
      // The same message comes back from both the send request and the socket
      if (!current || !existing || existing.lastMessage?.id === message.id) return current;
      const updated = {
        ...existing,
        lastMessage: message,
        unreadCount: existing.unreadCount + (countsAsUnread ? 1 : 0),
      };
      return [updated, ...current.filter((conversation) => conversation.id !== conversationId)];
    });
  }

  useSocketEvent<ChatMessageEvent>("chat:message", ({ conversationId, message }) =>
    applyMessage(conversationId, message),
  );
  // Catch up on anything missed while the connection was down
  useSocketEvent("connect", () => {
    if (conversations) loadConversations();
  });

  const clearUnread = useCallback((conversationId: string) => {
    setConversations(
      (current) =>
        current?.map((conversation) =>
          conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation,
        ) ?? null,
    );
  }, []);

  return (
    <section className="flex h-[calc(100svh-5.5rem)] min-h-112 overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl md:h-[calc(100svh-7.25rem)]">
      <div
        className={`${selected ? "hidden md:flex" : "flex"} w-full flex-col md:w-80 md:shrink-0 md:border-r md:border-white/10 lg:w-96`}
      >
        {isPicking ? (
          <NewChatPanel onStarted={select} onBack={() => setIsPicking(false)} />
        ) : (
          <ConversationList
            conversations={conversations}
            loadFailed={loadFailed}
            selectedId={selected?.id ?? null}
            onSelect={select}
            onNewChat={() => setIsPicking(true)}
            onRetry={loadConversations}
          />
        )}
      </div>

      <div className={`${selected ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
        {selected ? (
          // Keyed so switching chats starts with a fresh thread
          <ChatThread
            key={selected.id}
            conversation={selected}
            onBack={() => select(null)}
            onSent={(message) => applyMessage(selected.id, message)}
            onRead={clearUnread}
          />
        ) : (
          <div className="m-auto flex flex-col items-center gap-3 px-6 text-center text-sm text-white/50">
            <MessagesIcon className="size-10 text-white/30" />
            {t("pickConversation")}
          </div>
        )}
      </div>
    </section>
  );
}
