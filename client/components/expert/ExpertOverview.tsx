"use client";

import { useEffect, useState } from "react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { MessagesIcon, ShieldIcon, UserIcon } from "@/components/icons";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import StatCard from "@/components/dashboard/StatCard";
import UserAvatar from "@/components/shared/UserAvatar";
import UnreadBadge from "@/components/chat/UnreadBadge";
import { useChatUnread } from "@/components/chat/ChatUnread";
import { useCurrentUser } from "@/components/dashboard/RoleGate";
import { useSocketEvent } from "@/components/realtime/RealtimeProvider";
import { Link } from "@/i18n/navigation";
import { getConversations, messagesPageFor, type Conversation } from "@/lib/chat";
import { getOwnProfile, type ExpertStatus } from "@/lib/expert";

const RECENT_COUNT = 5;

const statusColors: Record<ExpertStatus | "NONE", string> = {
  VERIFIED: "text-green-400",
  PENDING: "text-amber-300",
  REJECTED: "text-red-400",
  NONE: "text-white/70",
};

// Expert home: verification status, unread messages and the latest chats with farmers,
// kept up to date live.
export default function ExpertOverview() {
  const t = useTranslations("expertDashboard");
  const tChat = useTranslations("chat");
  const format = useFormatter();
  // "5 minutes ago" moves on by itself
  const now = useNow({ updateInterval: 60_000 });
  const user = useCurrentUser();
  const { count: unreadMessages } = useChatUnread();
  // undefined while loading, null when there's no profile yet
  const [status, setStatus] = useState<ExpertStatus | null | undefined>(undefined);
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [failed, setFailed] = useState(false);

  const loadConversations = () =>
    getConversations()
      .then(setConversations)
      .catch(() => setFailed(true));

  useEffect(() => {
    getOwnProfile()
      .then((profile) => setStatus(profile?.status ?? null))
      .catch(() => setFailed(true));
    void loadConversations();
  }, []);

  // A new message reorders the list (or adds a new chat)
  useSocketEvent("chat:message", () => void loadConversations());

  const statusKey = status ?? "NONE";
  const messagesPage = messagesPageFor.EXPERT;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold md:text-3xl">{t("greeting", { name: user.name })}</h1>

      {failed && <p className="text-sm text-red-300">{t("loadError")}</p>}

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard icon={<ShieldIcon />} title={t("stats.status")}>
          <p className={`text-xl font-semibold ${statusColors[statusKey]}`}>
            {status === undefined ? "…" : t(`status.${statusKey}`)}
          </p>
        </StatCard>
        <StatCard icon={<MessagesIcon />} title={t("stats.unread")}>
          <p className="text-3xl font-semibold">{format.number(unreadMessages)}</p>
        </StatCard>
        <StatCard icon={<UserIcon />} title={t("stats.chats")}>
          <p className="text-3xl font-semibold">{conversations ? format.number(conversations.length) : "…"}</p>
        </StatCard>
      </div>

      {status !== undefined && statusKey !== "VERIFIED" && (
        <p className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          {t(`statusNote.${statusKey}`)}
        </p>
      )}

      <DashCard>
        <div className="flex items-center justify-between gap-3">
          <CardHeader icon={<MessagesIcon />} title={t("recent.title")} />
          {conversations && conversations.length > 0 && (
            <Link href={messagesPage} className="shrink-0 text-sm text-green-400 hover:underline">
              {t("recent.viewAll")}
            </Link>
          )}
        </div>

        {conversations?.length === 0 && <p className="mt-4 text-sm text-white/60">{t("recent.empty")}</p>}

        <ul className="mt-4 flex flex-col gap-1">
          {conversations?.slice(0, RECENT_COUNT).map(({ id, otherUser, lastMessage, unreadCount }) => (
            <li key={id}>
              <Link
                href={`${messagesPage}?c=${id}`}
                className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-white/5"
              >
                <UserAvatar name={otherUser.name} image={otherUser.image} size={40} />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm ${unreadCount ? "font-semibold" : "font-medium"}`}>
                    {otherUser.name}
                  </span>
                  <span className={`block truncate text-sm ${unreadCount ? "text-white" : "text-white/60"}`}>
                    {lastMessage &&
                      (lastMessage.senderId === user.id
                        ? `${tChat("youPrefix")} ${lastMessage.content}`
                        : lastMessage.content)}
                  </span>
                </span>
                {lastMessage && (
                  <span className="shrink-0 text-xs text-white/45">
                    {format.relativeTime(new Date(lastMessage.createdAt), now)}
                  </span>
                )}
                <UnreadBadge count={unreadCount} />
              </Link>
            </li>
          ))}
        </ul>
      </DashCard>
    </div>
  );
}
