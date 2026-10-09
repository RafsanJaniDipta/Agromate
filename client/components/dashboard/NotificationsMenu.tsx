"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { BellIcon, CloseIcon } from "@/components/icons";
import { Link, usePathname } from "@/i18n/navigation";
import { useCurrentUser } from "@/components/dashboard/RoleGate";
import { useSocketEvent } from "@/components/realtime/RealtimeProvider";
import {
  getNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
  type NotificationReadEvent,
} from "@/lib/notifications";

type NotificationsMenuProps = {
  // Same look as the other round buttons in the top bar
  buttonClassName: string;
};

const newestFirst = (list: Notification[]) =>
  [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

// When the user last opened the bell, kept per user in the browser so a reload doesn't
// start the shaking again. Storage can be blocked (private mode); then it lasts until reload.
const seenKey = (userId: string) => `agromate:notifications-seen-at:${userId}`;

function readSeenAt(userId: string) {
  try {
    return Number(localStorage.getItem(seenKey(userId))) || 0;
  } catch {
    return 0;
  }
}

function saveSeenAt(userId: string, time: number) {
  try {
    localStorage.setItem(seenKey(userId), String(time));
  } catch {
    // only a convenience
  }
}

// Bell button with a red dot for unread notifications, kept up to date live. Anything new
// since the bell was last opened makes it shake until it's opened. Chat messages arrive here
// too (one entry per chat); a notification with a link opens that page.
export default function NotificationsMenu({ buttonClassName }: NotificationsMenuProps) {
  const t = useTranslations("dashboard.notificationsMenu");
  const tDashboard = useTranslations("dashboard");
  const format = useFormatter();
  // "5 minutes ago" moves on by itself
  const now = useNow({ updateInterval: 60_000 });
  const me = useCurrentUser();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // Rendered only in the browser (inside RoleGate), so storage can be read right away
  const [seenAt, setSeenAt] = useState(() => readSeenAt(me.id));

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => setLoadFailed(true));
  }, []);

  // A new one, or an existing chat entry refreshed with a newer message, goes to the top.
  // One about the page already open (e.g. the chat being read) counts as seen straight away;
  // the server marks it read a moment later.
  useSocketEvent<Notification>("notification:new", (incoming) => {
    const isOnItsPage =
      !document.hidden && incoming.link === `${pathname}${window.location.search}`;
    const notification = isOnItsPage ? { ...incoming, isRead: true } : incoming;
    setNotifications((current) =>
      newestFirst([notification, ...(current ?? []).filter((item) => item.id !== notification.id)]),
    );
  });

  // Read somewhere else, e.g. the chat it's about was opened
  useSocketEvent<NotificationReadEvent>("notification:read", ({ referenceId }) =>
    setNotifications(
      (current) =>
        current?.map((item) => (item.referenceId === referenceId ? { ...item, isRead: true } : item)) ?? null,
    ),
  );

  // Closes on a click outside the menu or on Escape
  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setIsOpen(false);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const unread = notifications?.filter((notification) => !notification.isRead) ?? [];
  const hasUnseen = unread.some((notification) => Date.parse(notification.createdAt) > seenAt);

  function toggle() {
    if (!isOpen) {
      // Opening the bell counts as seeing everything in it
      const now = Date.now();
      setSeenAt(now);
      saveSeenAt(me.id, now);
    }
    setIsOpen((open) => !open);
  }

  const markRead = (ids: string[]) =>
    setNotifications(
      (current) => current?.map((item) => (ids.includes(item.id) ? { ...item, isRead: true } : item)) ?? null,
    );

  // Marking read is a convenience; a failed save just leaves it unread for next time
  function openNotification(notification: Notification) {
    if (notification.link) setIsOpen(false);
    if (notification.isRead) return;
    markRead([notification.id]);
    markNotificationRead(notification.id).catch(() => {});
  }

  // Removed at once; a failed delete just brings it back on the next load
  function remove(notification: Notification) {
    setNotifications((current) => current?.filter((item) => item.id !== notification.id) ?? null);
    deleteNotification(notification.id).catch(() => {});
  }

  function readAll() {
    markRead(notifications?.map((item) => item.id) ?? []);
    markAllNotificationsRead().catch(() => {});
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={tDashboard("notifications", { count: unread.length })}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={toggle}
        className={`relative origin-top ${hasUnseen ? "animate-bell-ring" : ""} ${buttonClassName}`}
      >
        <BellIcon className="size-5" />
        {unread.length > 0 && (
          <span className="absolute right-3 top-2.5 size-2 rounded-full bg-red-500 ring-2 ring-black/60" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-3xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-medium">{t("title")}</h2>
            {unread.length > 0 && (
              <button type="button" onClick={readAll} className="text-xs text-green-400 hover:underline">
                {t("markAllRead")}
              </button>
            )}
          </div>

          {loadFailed && <p className="mt-3 text-sm text-red-300">{t("loadError")}</p>}
          {!loadFailed && !notifications && <p className="mt-3 text-sm text-white/60">{t("loading")}</p>}
          {notifications?.length === 0 && <p className="mt-3 text-sm text-white/60">{t("empty")}</p>}

          {notifications && notifications.length > 0 && (
            <ul data-lenis-prevent className="-mr-2 mt-3 max-h-96 space-y-1 overflow-y-auto pr-2">
              {notifications.map((notification) => {
                const rowClass = `flex w-full gap-3 rounded-2xl p-3 pr-9 text-left transition hover:bg-white/5 ${
                  notification.isRead ? "" : "bg-white/5"
                }`;
                const content = (
                  <>
                    <span
                      aria-hidden
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-green-400"}`}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{notification.title}</span>
                      <span className="mt-0.5 line-clamp-3 block text-sm text-white/70">{notification.message}</span>
                      <span className="mt-1 block text-xs text-white/40">
                        {format.relativeTime(new Date(notification.createdAt), now)}
                      </span>
                      {!notification.isRead && <span className="sr-only">{t("unread")}</span>}
                    </span>
                  </>
                );

                return (
                  <li key={notification.id} className="group relative">
                    {notification.link ? (
                      <Link href={notification.link} onClick={() => openNotification(notification)} className={rowClass}>
                        {content}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => openNotification(notification)} className={rowClass}>
                        {content}
                      </button>
                    )}
                    {/* Always shown on touch screens, where there is no hover */}
                    <button
                      type="button"
                      onClick={() => remove(notification)}
                      aria-label={`${t("delete")}: ${notification.title}`}
                      className="absolute right-1.5 top-2 grid size-7 place-items-center rounded-full text-white/40 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100 focus:opacity-100 pointer-coarse:opacity-100"
                    >
                      <CloseIcon className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
