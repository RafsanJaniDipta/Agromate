import { api } from "@/lib/api";

export type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  // What it's about (e.g. a chat), so related ones can be marked read together
  referenceId: string | null;
  // Dashboard page to open on click, without the locale
  link: string | null;
};

// Pushed when notifications about `referenceId` were read elsewhere (e.g. the chat was opened)
export type NotificationReadEvent = { referenceId: string };

// The signed-in user's notifications, newest first
export async function getNotifications() {
  const { data } = await api<{ data: Notification[] }>("/api/notifications");
  return data;
}

export async function markNotificationRead(id: string) {
  await api(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead() {
  await api("/api/notifications/read-all", { method: "PATCH" });
}

export async function deleteNotification(id: string) {
  await api(`/api/notifications/${id}`, { method: "DELETE" });
}
