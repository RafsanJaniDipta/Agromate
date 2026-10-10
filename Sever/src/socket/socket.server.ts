import { Server as SocketIOServer, type Socket } from "socket.io";
import type { Server as HTTPServer } from "node:http";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../config/auth.js";
import { env } from "../config/env.js";
import { prisma } from "../config/database.js";

// Live updates for the dashboards. The browser only listens (plus "typing"): chat messages,
// read receipts and notifications are saved through the REST API, which then pushes them here
// to each user's private room.

// Server → browser events
export type ServerEvents = {
  "notification:new": (notification: unknown) => void;
  "notification:read": (payload: { referenceId: string }) => void;
  "chat:message": (payload: { conversationId: string; message: unknown; senderName: string }) => void;
  "chat:read": (payload: { conversationId: string; readerId: string }) => void;
  "chat:typing": (payload: { conversationId: string; userId: string }) => void;
};

// Browser → server events
type ClientEvents = {
  "chat:typing": (conversationId: string) => void;
};

type SocketData = { userId: string };

let io: SocketIOServer<ClientEvents, ServerEvents, Record<string, never>, SocketData> | null = null;

const userRoom = (userId: string) => `user:${userId}`;

// Sends an event to every open tab of a user; does nothing before the socket server starts
export function emitToUser<E extends keyof ServerEvents>(
  userId: string,
  event: E,
  ...payload: Parameters<ServerEvents[E]>
) {
  io?.to(userRoom(userId)).emit(event, ...payload);
}

// The other person in a conversation, or null when `userId` isn't part of it
async function otherParticipant(conversationId: string, userId: string) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: { participantOneId: true, participantTwoId: true },
  });
  if (conversation?.participantOneId === userId) return conversation.participantTwoId;
  if (conversation?.participantTwoId === userId) return conversation.participantOneId;
  return null;
}

export function setupSocketIO(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.CLIENT_URL.split(",").map((origin) => origin.trim()),
      credentials: true,
    },
  });

  // Same session cookie as the REST API; no session, no connection
  io.use(async (socket, next) => {
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(socket.handshake.headers) });
      if (!session) return next(new Error("Authentication required"));
      socket.data.userId = session.user.id;
      next();
    } catch {
      next(new Error("Authentication required"));
    }
  });

  io.on("connection", (socket: Socket<ClientEvents, ServerEvents, Record<string, never>, SocketData>) => {
    const { userId } = socket.data;
    void socket.join(userRoom(userId));

    // "Typing…" is passed on to the other person only; nothing is saved
    socket.on("chat:typing", async (conversationId) => {
      if (typeof conversationId !== "string") return;
      const otherId = await otherParticipant(conversationId, userId).catch(() => null);
      if (otherId) emitToUser(otherId, "chat:typing", { conversationId, userId });
    });
  });

  return io;
}
