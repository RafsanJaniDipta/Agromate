"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowLeftIcon, CheckIcon, DoubleCheckIcon } from "@/components/icons";
import UserAvatar from "@/components/shared/UserAvatar";
import MessageComposer from "@/components/chat/MessageComposer";
import { isSameDay, isYesterday } from "@/components/chat/chatDates";
import { useChatUnread } from "@/components/chat/ChatUnread";
import { useCurrentUser } from "@/components/dashboard/RoleGate";
import { useSocketEmit, useSocketEvent } from "@/components/realtime/RealtimeProvider";
import {
  chatPhotoUrl,
  getMessages,
  markConversationRead,
  sendMessage,
  type ChatMessage,
  type ChatMessageEvent,
  type ChatReadEvent,
  type ChatTypingEvent,
  type Conversation,
} from "@/lib/chat";

// A message on screen; `pending` ones are still on their way to the server
type ShownMessage = ChatMessage & { pending?: boolean };

// "typing…" disappears if no new keystroke arrives within this time
const TYPING_SHOWN_MS = 3500;
// Close enough to the bottom that new messages should scroll into view
const NEAR_BOTTOM_PX = 150;

// Adds or replaces messages by id and keeps them in time order
function mergeMessages(current: ShownMessage[], incoming: ShownMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

type ChatThreadProps = {
  conversation: Conversation;
  onBack: () => void;
  // Keeps the conversation list's last message and unread count in step
  onSent: (message: ChatMessage) => void;
  onRead: (conversationId: string) => void;
};

// Right pane: the messages of one chat, live. New messages, read ticks and "typing…"
// arrive over the socket; older messages load on request.
export default function ChatThread({ conversation, onBack, onSent, onRead }: ChatThreadProps) {
  const t = useTranslations("chat.thread");
  const tChat = useTranslations("chat");
  const tRoles = useTranslations("roles");
  const format = useFormatter();
  const me = useCurrentUser();
  const emit = useSocketEmit();
  const { refresh: refreshUnread } = useChatUnread();
  const { id: conversationId, otherUser } = conversation;

  const [messages, setMessages] = useState<ShownMessage[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [olderStatus, setOlderStatus] = useState<"idle" | "loading" | "error">("idle");
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const scroller = useRef<HTMLDivElement>(null);
  // What the next render should do with the scroll position
  const scrollIntent = useRef<"bottom" | "keep" | "stay">("bottom");
  const heightBeforeOlder = useRef({ height: 0, top: 0 });
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const readWhenVisible = useRef(false);
  const pendingCount = useRef(0);

  const markRead = useCallback(() => {
    // Read only while the tab is in front; otherwise when the user comes back
    if (document.hidden) {
      readWhenVisible.current = true;
      return;
    }
    readWhenVisible.current = false;
    onRead(conversationId);
    markConversationRead(conversationId)
      .then(refreshUnread)
      .catch(() => {});
  }, [conversationId, onRead, refreshUnread]);

  // Latest page; on a reconnect it's merged in, so messages missed while offline appear
  const loadLatest = useCallback(() => {
    getMessages(conversationId)
      .then((page) => {
        scrollIntent.current = "bottom";
        setMessages((current) => (current ? mergeMessages(current, page.messages) : page.messages));
        setHasMore((current) => current || page.hasMore);
        setLoadFailed(false);
        if (page.messages.some((message) => message.senderId !== me.id && !message.isRead)) markRead();
      })
      .catch(() => setLoadFailed(true));
  }, [conversationId, markRead, me.id]);

  useEffect(loadLatest, [loadLatest]);

  useEffect(() => {
    const readOnReturn = () => !document.hidden && readWhenVisible.current && markRead();
    document.addEventListener("visibilitychange", readOnReturn);
    return () => {
      document.removeEventListener("visibilitychange", readOnReturn);
      clearTimeout(typingTimer.current);
    };
  }, [markRead]);

  // Keeps the view at the newest message, or in place after older ones are added on top
  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element || !messages) return;
    if (scrollIntent.current === "bottom") {
      element.scrollTop = element.scrollHeight;
    } else if (scrollIntent.current === "keep") {
      const before = heightBeforeOlder.current;
      element.scrollTop = element.scrollHeight - before.height + before.top;
    }
    scrollIntent.current = "stay";
  }, [messages, isOtherTyping]);

  const isNearBottom = () => {
    const element = scroller.current;
    return !element || element.scrollHeight - element.scrollTop - element.clientHeight < NEAR_BOTTOM_PX;
  };

  useSocketEvent<ChatMessageEvent>("chat:message", ({ conversationId: id, message }) => {
    if (id !== conversationId) return;
    const fromMe = message.senderId === me.id;
    if (fromMe || isNearBottom()) scrollIntent.current = "bottom";
    // My own message may arrive here before the send request returns: it replaces the pending copy
    const isPendingCopy = (shown: ShownMessage) =>
      shown.pending && fromMe && shown.content === message.content && !shown.imageUrl === !message.imageUrl;
    setMessages((current) => mergeMessages((current ?? []).filter((shown) => !isPendingCopy(shown)), [message]));
    if (!fromMe) {
      setIsOtherTyping(false);
      markRead();
    }
  });

  useSocketEvent<ChatReadEvent>("chat:read", ({ conversationId: id, readerId }) => {
    if (id !== conversationId || readerId === me.id) return;
    setMessages(
      (current) =>
        current?.map((message) => (message.senderId === me.id ? { ...message, isRead: true } : message)) ?? null,
    );
  });

  useSocketEvent<ChatTypingEvent>("chat:typing", ({ conversationId: id, userId }) => {
    if (id !== conversationId || userId === me.id) return;
    if (isNearBottom()) scrollIntent.current = "bottom";
    setIsOtherTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setIsOtherTyping(false), TYPING_SHOWN_MS);
  });

  useSocketEvent("connect", () => {
    if (messages) loadLatest();
  });

  async function loadOlder() {
    const oldest = messages?.find((message) => !message.pending);
    if (!oldest) return;
    setOlderStatus("loading");
    try {
      const page = await getMessages(conversationId, oldest.id);
      const element = scroller.current;
      heightBeforeOlder.current = { height: element?.scrollHeight ?? 0, top: element?.scrollTop ?? 0 };
      scrollIntent.current = "keep";
      setMessages((current) => mergeMessages(current ?? [], page.messages));
      setHasMore(page.hasMore);
      setOlderStatus("idle");
    } catch {
      setOlderStatus("error");
    }
  }

  // Shows the message at once, then swaps in the saved copy (or removes it if sending failed)
  async function send(text: string, photo?: Blob) {
    pendingCount.current += 1;
    const pendingId = `pending-${pendingCount.current}`;
    // The photo shows from memory while it uploads
    const localPhotoUrl = photo ? URL.createObjectURL(photo) : null;
    const pending: ShownMessage = {
      id: pendingId,
      conversationId,
      senderId: me.id,
      content: text,
      imageUrl: localPhotoUrl,
      isRead: false,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    scrollIntent.current = "bottom";
    setMessages((current) => [...(current ?? []), pending]);

    try {
      const saved = await sendMessage(conversationId, text, photo);
      setMessages((current) => mergeMessages((current ?? []).filter((message) => message.id !== pendingId), [saved]));
      onSent(saved);
      return true;
    } catch {
      setMessages((current) => current?.filter((message) => message.id !== pendingId) ?? null);
      return false;
    } finally {
      if (localPhotoUrl) URL.revokeObjectURL(localPhotoUrl);
    }
  }

  const dayLabel = (date: Date) => {
    if (isSameDay(date, new Date())) return t("today");
    if (isYesterday(date)) return t("yesterday");
    return format.dateTime(date, { dateStyle: "medium" });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-white/10 px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("back")}
          className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-white/10 md:hidden"
        >
          <ArrowLeftIcon className="size-5" />
        </button>
        <UserAvatar name={otherUser.name} image={otherUser.image} size={40} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{otherUser.name}</p>
          <p aria-live="polite" className="truncate text-xs">
            {isOtherTyping ? (
              <span className="text-green-300">{t("typing")}</span>
            ) : (
              <span className="text-white/50">{otherUser.specialization ?? tRoles(otherUser.role)}</span>
            )}
          </p>
        </div>
      </header>

      <div ref={scroller} data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-5">
        {loadFailed && !messages && (
          <p className="text-center text-sm text-red-300">
            {tChat("loadError")}{" "}
            <button type="button" onClick={loadLatest} className="underline hover:text-red-200">
              {tChat("retry")}
            </button>
          </p>
        )}
        {!loadFailed && !messages && <p className="text-center text-sm text-white/50">{tChat("loading")}</p>}

        {hasMore && (
          <div className="mb-4 text-center">
            <button
              type="button"
              onClick={loadOlder}
              disabled={olderStatus === "loading"}
              className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
            >
              {olderStatus === "error" ? t("loadOlderError") : t("loadOlder")}
            </button>
          </div>
        )}

        {messages?.length === 0 && <p className="mt-10 text-center text-sm text-white/50">{t("empty")}</p>}

        <ol className="flex flex-col gap-1.5">
          {messages?.map((message, index) => {
            const date = new Date(message.createdAt);
            const previous = messages[index - 1];
            const startsDay = !previous || !isSameDay(new Date(previous.createdAt), date);
            const mine = message.senderId === me.id;

            return (
              <Fragment key={message.id}>
                {startsDay && (
                  <li className="my-3 text-center">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/60">{dayLabel(date)}</span>
                  </li>
                )}
                <li className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl ${
                      // A photo sits close to the bubble's edge; its caption and time keep the text padding
                      message.imageUrl ? "w-72 p-1.5 pb-2" : "px-3.5 py-2"
                    } ${mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-white/10"} ${
                      message.pending ? "opacity-70" : ""
                    }`}
                  >
                    {message.imageUrl && <MessagePhoto message={message} />}
                    {message.content && (
                      <p
                        className={`whitespace-pre-wrap wrap-break-word text-sm leading-relaxed ${
                          message.imageUrl ? "mt-1.5 px-2" : ""
                        }`}
                      >
                        {message.content}
                      </p>
                    )}
                    <p
                      className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] text-white/60 ${
                        message.imageUrl ? "px-2" : ""
                      }`}
                    >
                      {format.dateTime(date, { timeStyle: "short" })}
                      {mine && <MessageStatus message={message} />}
                    </p>
                  </div>
                </li>
              </Fragment>
            );
          })}
        </ol>

        {isOtherTyping && (
          <p className="mt-2 flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-white/10 px-3.5 py-2.5" aria-hidden>
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="size-1.5 animate-bounce rounded-full bg-white/70"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </p>
        )}
      </div>

      <MessageComposer onSend={send} onTyping={() => emit("chat:typing", conversationId)} />
    </div>
  );
}

// A sent photo; tapping it opens the full size in a new tab
function MessagePhoto({ message }: { message: ShownMessage }) {
  const t = useTranslations("chat.thread");
  // A pending photo is still a local preview, not on Cloudinary yet
  const shownUrl = message.pending ? message.imageUrl! : chatPhotoUrl(message.imageUrl!);
  const photo = (
    // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already sizes it (see chatPhotoUrl)
    <img
      src={shownUrl}
      alt={message.content || t("photo")}
      loading="lazy"
      className="max-h-80 w-full rounded-xl object-cover"
    />
  );

  if (message.pending) return photo;
  return (
    <a href={message.imageUrl!} target="_blank" rel="noopener noreferrer" aria-label={t("openPhoto")}>
      {photo}
    </a>
  );
}

// One tick when sent, two when the other person has read it
function MessageStatus({ message }: { message: ShownMessage }) {
  const t = useTranslations("chat.thread");
  if (message.pending) return <span className="sr-only">{t("sending")}</span>;

  const Icon = message.isRead ? DoubleCheckIcon : CheckIcon;
  return (
    <span title={message.isRead ? t("read") : t("sent")} className={message.isRead ? "text-sky-200" : ""}>
      <Icon className="size-3.5" />
      <span className="sr-only">{message.isRead ? t("read") : t("sent")}</span>
    </span>
  );
}
