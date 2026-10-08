import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "node:http";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../config/auth.js";
import { env } from "../config/env.js";
import { saveMessage, markMessagesAsRead } from "../modules/chat/chat.service.js";

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

let ioInstance: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function setupSocketIO(server: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: Array.from(
        new Set([
          "http://localhost:3000",
          "http://localhost:5000",
          ...env.CLIENT_URL.split(",").map((o) => o.trim()),
        ])
      ),
      credentials: true,
    },
  });

  ioInstance = io;


  // Socket Authentication Middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      // Extract headers from socket handshake
      const headers = fromNodeHeaders(socket.handshake.headers);
      const session = await auth.api.getSession({ headers });

      if (!session || !session.user) {
        return next(new Error("Unauthorized: Invalid or missing session"));
      }

      socket.user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role ?? "FARMER",
      };

      next();
    } catch (err) {
      next(new Error("Unauthorized: Authentication failed"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.user?.id;
    console.log(`[socket] User connected: ${userId} (${socket.user?.role})`);

    // Personal user room for direct notifications
    if (userId) {
      void socket.join(`user_${userId}`);
    }

    // Join conversation room
    socket.on("join_conversation", (conversationId: string) => {
      if (!conversationId) return;
      const room = `conversation_${conversationId}`;
      void socket.join(room);
      console.log(`[socket] User ${userId} joined room ${room}`);
    });

    // Leave conversation room
    socket.on("leave_conversation", (conversationId: string) => {
      if (!conversationId) return;
      const room = `conversation_${conversationId}`;
      void socket.leave(room);
      console.log(`[socket] User ${userId} left room ${room}`);
    });

    // Realtime message sending and DB persistence
    socket.on("send_message", async (data: { conversationId: string; content: string }) => {
      try {
        if (!userId || !data.conversationId || !data.content?.trim()) {
          return;
        }

        // Save to DB
        const savedMessage = await saveMessage({
          conversationId: data.conversationId,
          senderId: userId,
          content: data.content.trim(),
        });

        const room = `conversation_${data.conversationId}`;
        
        // Broadcast new message to conversation room
        io.to(room).emit("new_message", savedMessage);
      } catch (err) {
        console.error("[socket] Error sending message:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Realtime typing indicators
    socket.on("typing", (conversationId: string) => {
      if (!conversationId) return;
      socket.to(`conversation_${conversationId}`).emit("user_typing", {
        conversationId,
        userId,
        userName: socket.user?.name,
      });
    });

    socket.on("stop_typing", (conversationId: string) => {
      if (!conversationId) return;
      socket.to(`conversation_${conversationId}`).emit("user_stop_typing", {
        conversationId,
        userId,
      });
    });

    // Read receipt event
    socket.on("mark_read", async (conversationId: string) => {
      try {
        if (!userId || !conversationId) return;
        await markMessagesAsRead(conversationId, userId);

        io.to(`conversation_${conversationId}`).emit("messages_read", {
          conversationId,
          readBy: userId,
        });
      } catch (err) {
        console.error("[socket] Error marking messages read:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[socket] User disconnected: ${userId}`);
    });
  });

  return io;
}
