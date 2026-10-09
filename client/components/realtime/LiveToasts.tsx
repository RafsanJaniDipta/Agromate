"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BellIcon, ChatIcon, CloseIcon } from "@/components/icons";
import { Link, usePathname } from "@/i18n/navigation";
import { useCurrentUser } from "@/components/dashboard/RoleGate";
import { useSocketEvent } from "@/components/realtime/RealtimeProvider";
import { messagesPageFor, type ChatMessageEvent } from "@/lib/chat";
import type { Notification } from "@/lib/notifications";

type Toast = {
  id: string;
  kind: "message" | "notification";
  title: string;
  body: string;
  // Where tapping the toast goes (chat messages open their conversation)
  href?: string;
};

const SHOW_FOR_MS = 6000;
const MAX_TOASTS = 3;
const PREVIEW_LENGTH = 90;

const preview = (text: string) => (text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text);

// Small cards in the corner for live events: a new notification, or a chat message
// while the user is on another page. They fade out on their own after a few seconds.
export default function LiveToasts() {
  const t = useTranslations("chat.toast");
  const me = useCurrentUser();
  const pathname = usePathname();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const messagesPage = messagesPageFor[me.role];

  const dismiss = (id: string) => setToasts((current) => current.filter((toast) => toast.id !== id));

  function show(toast: Toast) {
    setToasts((current) => [...current.filter((item) => item.id !== toast.id), toast].slice(-MAX_TOASTS));
    setTimeout(() => dismiss(toast.id), SHOW_FOR_MS);
  }

  useSocketEvent<Notification>("notification:new", (notification) => {
    // A chat message already has its own toast (below)
    if (notification.link?.startsWith(messagesPage)) return;
    show({
      id: notification.id,
      kind: "notification",
      title: notification.title,
      body: preview(notification.message),
      href: notification.link ?? undefined,
    });
  });

  useSocketEvent<ChatMessageEvent>("chat:message", ({ conversationId, message, senderName }) => {
    // The chat page shows it already
    if (message.senderId === me.id || pathname === messagesPage) return;
    show({
      id: message.id,
      kind: "message",
      title: t("newMessage", { name: senderName }),
      body: preview(message.content),
      href: `${messagesPage}?c=${conversationId}`,
    });
  });

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex print:hidden flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-88"
    >
      {toasts.map((toast) => {
        const Icon = toast.kind === "message" ? ChatIcon : BellIcon;
        const content = (
          <>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/20 text-green-300">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{toast.title}</span>
              <span className="mt-0.5 line-clamp-2 block text-sm text-white/70">{toast.body}</span>
            </span>
          </>
        );

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full items-start gap-2 rounded-2xl border border-white/10 bg-zinc-950/95 p-3 text-white shadow-2xl backdrop-blur-xl"
          >
            {toast.href ? (
              <Link href={toast.href} onClick={() => dismiss(toast.id)} className="flex min-w-0 flex-1 gap-3">
                {content}
              </Link>
            ) : (
              <div className="flex min-w-0 flex-1 gap-3">{content}</div>
            )}
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label={t("close")}
              className="grid size-7 shrink-0 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
