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
  // Empty when the message is only a photo
  content: string;
  imageUrl: string | null;
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

// The server's limit for one message
export const MESSAGE_MAX_LENGTH = 2000;

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

// Text, a photo, or a photo with `content` as its caption
export async function sendMessage(conversationId: string, content: string, photo?: Blob) {
  let body: string | FormData = JSON.stringify({ content });
  if (photo) {
    body = new FormData();
    body.append("photo", photo, "photo.jpg");
    body.append("content", content);
  }

  const { data } = await api<Envelope<ChatMessage>>(`/api/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    body,
  });
  return data;
}

// One line for a message in the chat list, the dashboard and toasts
export function messagePreview(message: Pick<ChatMessage, "content" | "imageUrl">, photoLabel: string) {
  if (!message.imageUrl) return message.content;
  return `📷 ${message.content || photoLabel}`;
}

// A Cloudinary photo resized for the chat bubble; other URLs are used as they are
export const chatPhotoUrl = (url: string) => url.replace("/upload/", "/upload/c_limit,w_640,q_auto,f_auto/");

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
