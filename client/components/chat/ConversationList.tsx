"use client";

import { useFormatter, useTranslations } from "next-intl";
import { PlusIcon } from "@/components/icons";
import UserAvatar from "@/components/shared/UserAvatar";
import UnreadBadge from "@/components/chat/UnreadBadge";
import { useCurrentUser } from "@/components/dashboard/RoleGate";
import { isSameDay } from "@/components/chat/chatDates";
import type { Conversation } from "@/lib/chat";

type ConversationListProps = {
  // null while loading
  conversations: Conversation[] | null;
  loadFailed: boolean;
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  onNewChat: () => void;
  onRetry: () => void;
};

// Left pane: every chat with its last message and unread count, newest first.
export default function ConversationList({
  conversations,
  loadFailed,
  selectedId,
  onSelect,
  onNewChat,
  onRetry,
}: ConversationListProps) {
  const t = useTranslations("chat");
  const tRoles = useTranslations("roles");
  const format = useFormatter();
  const me = useCurrentUser();

  // Today's messages show the time, older ones the date
  const shortTime = (iso: string) => {
    const date = new Date(iso);
    return isSameDay(date, new Date())
      ? format.dateTime(date, { timeStyle: "short" })
      : format.dateTime(date, { day: "numeric", month: "short" });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <button
          type="button"
          onClick={onNewChat}
          className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white/85"
        >
          <PlusIcon className="size-4" />
          {t("newChat")}
        </button>
      </div>

      <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto p-2">
        {loadFailed && (
          <div className="p-4 text-sm text-red-300">
            {t("loadError")}{" "}
            <button type="button" onClick={onRetry} className="underline hover:text-red-200">
              {t("retry")}
            </button>
          </div>
        )}
        {!loadFailed && !conversations && <p className="p-4 text-sm text-white/60">{t("loading")}</p>}
        {conversations?.length === 0 && (
          <p className="p-4 text-sm leading-relaxed text-white/60">{t(`emptyList.${me.role}`)}</p>
        )}

        <ul className="flex flex-col gap-1">
          {conversations?.map((conversation) => {
            const { otherUser, lastMessage, unreadCount } = conversation;
            const isSelected = conversation.id === selectedId;
            const fromMe = lastMessage?.senderId === me.id;
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation)}
                  aria-current={isSelected ? "true" : undefined}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                    isSelected ? "bg-white/15" : "hover:bg-white/5"
                  }`}
                >
                  <UserAvatar name={otherUser.name} image={otherUser.image} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm ${unreadCount ? "font-semibold" : "font-medium"}`}>
                        {otherUser.name}
                      </span>
                      {lastMessage && (
                        <span className="shrink-0 text-[11px] text-white/45">{shortTime(lastMessage.createdAt)}</span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-white/45">
                      {otherUser.specialization ?? tRoles(otherUser.role)}
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className={`min-w-0 flex-1 truncate text-sm ${unreadCount ? "text-white" : "text-white/60"}`}>
                        {lastMessage && (fromMe ? `${t("youPrefix")} ${lastMessage.content}` : lastMessage.content)}
                      </span>
                      <UnreadBadge count={unreadCount} />
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
