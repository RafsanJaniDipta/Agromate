import { api } from "@/lib/api";

type Notification = { id: string; isRead: boolean };

// How many of the signed-in user's notifications are still unread
export async function countUnreadNotifications() {
  const { data } = await api<{ data: Notification[] }>("/api/notifications");
  return data.filter((notification) => !notification.isRead).length;
}
