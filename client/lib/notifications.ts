import { api } from "@/lib/api";

export type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

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
