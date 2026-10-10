import { api } from "@/lib/api";

// The farmer's AI assistant: saved conversations, answered with the farmer's own data.

export type AssistantMessage = {
  id: string;
  sender: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
};

export type AssistantConversation = { id: string; title: string | null; updatedAt: string };

export type Exchange = { question: AssistantMessage; answer: AssistantMessage };

// The server's limit for one question
export const QUESTION_MAX_LENGTH = 2000;

type Envelope<T> = { data: T };

export async function getAssistantConversations() {
  return (await api<Envelope<AssistantConversation[]>>("/api/ai/conversations")).data;
}

export async function getAssistantMessages(conversationId: string) {
  return (await api<Envelope<{ id: string; messages: AssistantMessage[] }>>(`/api/ai/conversations/${conversationId}`)).data
    .messages;
}

// Starts a conversation; the answer comes back with it
export async function startAssistantConversation(message: string) {
  const { data } = await api<Envelope<Exchange & { conversation: { id: string; title: string } }>>("/api/ai/conversations", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return data;
}

export async function askAssistant(conversationId: string, message: string) {
  const { data } = await api<Envelope<Exchange>>(`/api/ai/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return data;
}

export async function deleteAssistantConversation(conversationId: string) {
  await api(`/api/ai/conversations/${conversationId}`, { method: "DELETE" });
}
