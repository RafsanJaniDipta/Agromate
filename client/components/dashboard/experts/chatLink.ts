import { messagesPageFor } from "@/lib/chat";

// The farmer's messages page with the chat to this expert open (created on first visit)
export const chatWithPage = (expertUserId: string) => `${messagesPageFor.FARMER}?with=${expertUserId}`;
