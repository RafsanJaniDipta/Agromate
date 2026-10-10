import { api } from "@/lib/api";
import type { Role } from "@/lib/session";

// One-to-one chat: farmer ↔ expert and expert ↔ admin (rules are enforced by the server).

export type ChatUser = {
  id: string;
  name: string;
  image: string | null;
  role: Role;
  // Experts only
  specialization: string | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  // Empty when the message is only photos; otherwise their shared caption
  content: string;
  imageUrls: string[];
  isRead: boolean;
  createdAt: string;
};

export type Conversation = {
  id: string;
  otherUser: ChatUser;
  lastMessage: ChatMessage | null;
  unreadCount: number;
};

export type MessagePage = { messages: ChatMessage[]; hasMore: boolean };

// Live events pushed by the server (see Sever/src/socket/socket.server.ts)
export type ChatMessageEvent = { conversationId: string; message: ChatMessage; senderName: string };
export type ChatReadEvent = { conversationId: string; readerId: string };
export type ChatTypingEvent = { conversationId: string; userId: string };

// The server's limits for one message
export const MESSAGE_MAX_LENGTH = 2000;
export const CHAT_PHOTOS_MAX = 10;

type Envelope<T> = { data: T };

// People the signed-in user can start a chat with
export async function getChatContacts() {
  return (await api<Envelope<ChatUser[]>>("/api/chat/contacts")).data;
}

// Chats with at least one message, most recent first
export async function getConversations() {
  return (await api<Envelope<Conversation[]>>("/api/chat/conversations")).data;
}

// Opens the chat with a user, creating it the first time
export async function startConversation(userId: string) {
  const { data } = await api<Envelope<Conversation>>("/api/chat/conversations", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  return data;
}

// Latest messages, or the page before `beforeId`; oldest first
export async function getMessages(conversationId: string, beforeId?: string) {
  const query = beforeId ? `?before=${encodeURIComponent(beforeId)}` : "";
  return (await api<Envelope<MessagePage>>(`/api/chat/conversations/${conversationId}/messages${query}`)).data;
}

// Text, photos, or photos with `content` as their shared caption
export async function sendMessage(conversationId: string, content: string, photos: Blob[] = []) {
  let body: string | FormData = JSON.stringify({ content });
  if (photos.length > 0) {
    body = new FormData();
    for (const photo of photos) body.append("photos", photo, "photo.jpg");
    body.append("content", content);
  }

  const { data } = await api<Envelope<ChatMessage>>(`/api/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    body,
  });
  return data;
}

// One line for a message in the chat list, the dashboard and toasts.
// `photosLabel` names a caption-less group of photos, e.g. "Photo" or "3 photos".
export function messagePreview(
  message: Pick<ChatMessage, "content" | "imageUrls">,
  photosLabel: (count: number) => string,
) {
  const count = message.imageUrls.length;
  if (count === 0) return message.content;
  return `📷 ${message.content || photosLabel(count)}`;
}

// Cloudinary sizes: a lone photo in a bubble, a square tile in a group, and the full-screen viewer
const PHOTO_SIZES = {
  single: "c_limit,w_640",
  tile: "c_fill,w_320,h_320",
  full: "c_limit,w_1600",
} as const;

// A Cloudinary photo resized for where it's shown; other URLs (local previews) are used as they are
export const chatPhotoUrl = (url: string, size: keyof typeof PHOTO_SIZES) =>
  url.replace("/upload/", `/upload/${PHOTO_SIZES[size]},q_auto,f_auto/`);

export async function markConversationRead(conversationId: string) {
  await api(`/api/chat/conversations/${conversationId}/read`, { method: "PATCH" });
}

export async function getUnreadMessageCount() {
  return (await api<Envelope<{ count: number }>>("/api/chat/unread-count")).data.count;
}

// The messages page of each dashboard
export const messagesPageFor: Record<Role, string> = {
  FARMER: "/dashboard/messages",
  EXPERT: "/expert/messages",
  ADMIN: "/admin/messages",
};
