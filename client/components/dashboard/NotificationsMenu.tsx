"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { BellIcon } from "@/components/icons";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/lib/notifications";

type NotificationsMenuProps = {
  // Same look as the other round buttons in the top bar
  buttonClassName: string;
};

// Bell button with a red dot for unread notifications; opens a list of them.
// Opening an unread one marks it read; "Mark all read" clears the dot.
export default function NotificationsMenu({ buttonClassName }: NotificationsMenuProps) {
  const t = useTranslations("dashboard.notificationsMenu");
  const tDashboard = useTranslations("dashboard");
  const format = useFormatter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => setLoadFailed(true));
  }, []);

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

  const unread = notifications?.filter((notification) => !notification.isRead).length ?? 0;

  const markRead = (ids: string[]) =>
    setNotifications(
      (current) => current?.map((item) => (ids.includes(item.id) ? { ...item, isRead: true } : item)) ?? null,
    );

  // Marking read is a convenience; a failed save just leaves it unread for next time
  function openNotification(notification: Notification) {
    if (notification.isRead) return;
    markRead([notification.id]);
    markNotificationRead(notification.id).catch(() => {});
  }

  function readAll() {
    markRead(notifications?.map((item) => item.id) ?? []);
    markAllNotificationsRead().catch(() => {});
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={tDashboard("notifications", { count: unread })}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((open) => !open)}
        className={`relative ${buttonClassName}`}
      >
        <BellIcon className="size-5" />
        {unread > 0 && (
          <span className="absolute right-3 top-2.5 size-2 rounded-full bg-red-500 ring-2 ring-black/60" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-3xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-medium">{t("title")}</h2>
            {unread > 0 && (
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
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={`flex w-full gap-3 rounded-2xl p-3 text-left transition hover:bg-white/5 ${
                      notification.isRead ? "" : "bg-white/5"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-green-400"}`}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{notification.title}</span>
                      <span className="mt-0.5 block text-sm text-white/70">{notification.message}</span>
                      <span className="mt-1 block text-xs text-white/40">
                        {format.relativeTime(new Date(notification.createdAt))}
                      </span>
                      {!notification.isRead && <span className="sr-only">{t("unread")}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
