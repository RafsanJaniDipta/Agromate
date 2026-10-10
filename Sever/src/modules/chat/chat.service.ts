import { randomUUID } from "node:crypto";
import { prisma } from "../../config/database.js";
import { cloudinary } from "../../config/cloudinary.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { AppError } from "../../utils/AppError.js";
import { emitToUser } from "../../socket/socket.server.js";
import { markReadByReference, notifyLatest } from "../notification/notification.service.js";

// One-to-one chat between a farmer and an expert, or an expert and an admin.
// Farmers start chats with verified experts, experts with admins, admins with experts;
// once a chat exists either side can write. A message is text, up to CHAT_PHOTOS_MAX photos,
// or photos with one shared caption. Every new message and read receipt is also pushed live
// to both people (see socket.server.ts).

const MESSAGE_MAX_LENGTH = 2000;
const PAGE_SIZE = 30;
const CHAT_PHOTO_FOLDER = "agromate/chat";
export const CHAT_PHOTOS_MAX = 10;

type Role = "FARMER" | "EXPERT" | "ADMIN";
// Older accounts store the role in lower case
const roleOf = (role: string) => role.toUpperCase() as Role;
const rolesMatching = (role: Role) => [role, role.toLowerCase()];

// Who each role may start a chat with
const CAN_START_WITH: Record<Role, Role | null> = {
  FARMER: "EXPERT",
  EXPERT: "ADMIN",
  ADMIN: "EXPERT",
};

const userFields = {
  id: true,
  name: true,
  image: true,
  role: true,
  expertProfile: { select: { specialization: true, status: true } },
} as const;

type UserRow = {
  id: string;
  name: string;
  image: string | null;
  role: string;
  expertProfile: { specialization: string; status: string } | null;
};

// The person on the other side of a chat, as the client shows them
const toChatUser = (user: UserRow) => ({
  id: user.id,
  name: user.name,
  image: user.image,
  role: roleOf(user.role),
  specialization: user.expertProfile?.specialization ?? null,
});

const messageFields = {
  id: true,
  conversationId: true,
  senderId: true,
  content: true,
  imageUrls: true,
  isRead: true,
  createdAt: true,
} as const;

const myConversations = (userId: string) => ({
  OR: [{ participantOneId: userId }, { participantTwoId: userId }],
});

// The other person's id; a chat the user isn't part of looks the same as a missing one
async function otherParticipantId(conversationId: string, userId: string) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: { participantOneId: true, participantTwoId: true },
  });
  if (conversation?.participantOneId === userId) return conversation.participantTwoId;
  if (conversation?.participantTwoId === userId) return conversation.participantOneId;
  throw AppError.notFound("Conversation not found");
}

// People the user can start a new chat with
export const getContacts = serviceHandler(async (userId: string, role: string) => {
  const target = CAN_START_WITH[roleOf(role)];
  if (!target) return [];

  const users = await prisma.user.findMany({
    where: {
      id: { not: userId },
      role: { in: rolesMatching(target) },
      banned: { not: true },
      // Farmers only see experts the admin has verified; admins see every applicant
      ...(target === "EXPERT" && {
        expertProfile: roleOf(role) === "FARMER" ? { status: "VERIFIED" } : { isNot: null },
      }),
    },
    select: userFields,
    orderBy: { name: "asc" },
  });
  return users.map(toChatUser);
});

// The user's chats that have at least one message, most recent first, with unread counts
export const getConversations = serviceHandler(async (userId: string) => {
  const [conversations, unread] = await Promise.all([
    prisma.chatConversation.findMany({
      where: { ...myConversations(userId), messages: { some: {} } },
      include: {
        participantOne: { select: userFields },
        participantTwo: { select: userFields },
        messages: { take: 1, orderBy: { createdAt: "desc" }, select: messageFields },
      },
      orderBy: { lastMessageAt: "desc" },
    }),
    prisma.chatMessage.groupBy({
      by: ["conversationId"],
      where: { isRead: false, senderId: { not: userId }, conversation: myConversations(userId) },
      _count: { _all: true },
    }),
  ]);

  const unreadByConversation = new Map(unread.map((row) => [row.conversationId, row._count._all]));
  return conversations.map((conversation) => ({
    id: conversation.id,
    otherUser: toChatUser(
      conversation.participantOneId === userId ? conversation.participantTwo : conversation.participantOne,
    ),
    lastMessage: conversation.messages[0] ?? null,
    unreadCount: unreadByConversation.get(conversation.id) ?? 0,
  }));
});

// Opens the chat with `targetUserId`, creating it the first time
export const startConversation = serviceHandler(async (userId: string, role: string, targetUserId: string) => {
  if (targetUserId === userId) {
    throw AppError.badRequest("You can't start a chat with yourself");
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: userFields });
  if (!target) {
    throw AppError.notFound("User not found");
  }

  const myRole = roleOf(role);
  const allowed =
    CAN_START_WITH[myRole] === roleOf(target.role) &&
    // A farmer may only write to an expert the admin has verified
    (myRole !== "FARMER" || target.expertProfile?.status === "VERIFIED");
  if (!allowed) {
    throw AppError.forbidden("You can't start a chat with this user");
  }

  // Sorted ids give each pair a single row (see the unique index)
  const [participantOneId, participantTwoId] = [userId, targetUserId].sort() as [string, string];
  const conversation = await prisma.chatConversation.upsert({
    where: { participantOneId_participantTwoId: { participantOneId, participantTwoId } },
    update: {},
    create: { participantOneId, participantTwoId },
    select: { id: true },
  });

  return { id: conversation.id, otherUser: toChatUser(target), lastMessage: null, unreadCount: 0 };
});

// A page of messages, oldest first. `before` is the id of the oldest message already shown.
export const getMessages = serviceHandler(async (conversationId: string, userId: string, before?: string) => {
  await otherParticipantId(conversationId, userId);

  const newestFirst = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    // One extra row tells whether older messages remain
    take: PAGE_SIZE + 1,
    ...(before && { cursor: { id: before }, skip: 1 }),
    select: messageFields,
  });

  return {
    messages: newestFirst.slice(0, PAGE_SIZE).reverse(),
    hasMore: newestFirst.length > PAGE_SIZE,
  };
});

// Each role's chat page, which the bell opens (the locale is added by the client)
const MESSAGES_PAGE: Record<Role, string> = {
  FARMER: "/dashboard/messages",
  EXPERT: "/expert/messages",
  ADMIN: "/admin/messages",
};
const NOTIFICATION_PREVIEW_LENGTH = 120;

// The recipient's bell shows the newest message of each unread chat (one entry per chat).
// Text is stored in Bangla, like the other notifications.
async function notifyRecipient(recipientId: string, conversationId: string, senderName: string, content: string) {
  const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { role: true } });
  if (!recipient) return;

  await notifyLatest({
    userId: recipientId,
    referenceId: conversationId,
    title: `${senderName}-এর নতুন বার্তা`,
    message:
      content.length > NOTIFICATION_PREVIEW_LENGTH ? `${content.slice(0, NOTIFICATION_PREVIEW_LENGTH)}…` : content,
    type: "INFO",
    link: `${MESSAGES_PAGE[roleOf(recipient.role)]}?c=${conversationId}`,
  });
}

// Stores the photo on Cloudinary and returns its public id and URL
function uploadChatPhoto(photo: Buffer) {
  return new Promise<{ publicId: string; url: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      // Stored as sent: the browser already shrank it (see the client's MessageComposer)
      { folder: CHAT_PHOTO_FOLDER, public_id: randomUUID(), resource_type: "image" },
      (error, result) => {
        if (error || !result) reject(new Error(error?.message ?? "Cloudinary upload failed"));
        else resolve({ publicId: result.public_id, url: result.secure_url });
      },
    );
    uploadStream.end(photo);
  });
}

const removeChatPhotos = (publicIds: string[]) =>
  Promise.all(publicIds.map((publicId) => cloudinary.uploader.destroy(publicId).catch(() => {})));

// Uploads every photo, or none: if one fails, the ones already stored are removed
async function uploadChatPhotos(photos: Buffer[]) {
  const results = await Promise.allSettled(photos.map(uploadChatPhoto));
  const uploaded = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  const failure = results.find((result) => result.status === "rejected");
  if (failure) {
    await removeChatPhotos(uploaded.map((photo) => photo.publicId));
    throw failure.reason;
  }
  return uploaded;
}

// The bell's one-line summary, in Bangla like the other notifications
function notificationPreview(content: string, photoCount: number) {
  if (photoCount === 0) return content;
  const photos = photoCount === 1 ? "ছবি" : `${photoCount.toLocaleString("bn-BD")}টি ছবি`;
  return `📷 ${content || photos}`;
}

export const sendMessage = serviceHandler(
  async (conversationId: string, senderId: string, text: unknown, photos: Buffer[] = []) => {
    const content = typeof text === "string" ? text.trim() : "";
    if ((!content && photos.length === 0) || content.length > MESSAGE_MAX_LENGTH) {
      throw AppError.unprocessable(`A message needs a photo or 1 to ${MESSAGE_MAX_LENGTH} characters`);
    }
    if (photos.length > CHAT_PHOTOS_MAX) {
      throw AppError.unprocessable(`A message can carry at most ${CHAT_PHOTOS_MAX} photos`);
    }

    // Checked before uploading, so outsiders can't store photos
    const recipientId = await otherParticipantId(conversationId, senderId);
    const uploaded = await uploadChatPhotos(photos);

    let saved;
    try {
      saved = await prisma.$transaction([
        prisma.chatMessage.create({
          data: { conversationId, senderId, content, imageUrls: uploaded.map((photo) => photo.url) },
          select: { ...messageFields, sender: { select: { name: true } } },
        }),
        prisma.chatConversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } }),
      ]);
    } catch (error) {
      // Don't leave orphan photos behind when the message couldn't be saved
      await removeChatPhotos(uploaded.map((photo) => photo.publicId));
      throw error;
    }
    const [{ sender, ...message }] = saved;

    // Saved before the live message goes out: a recipient reading the chat right away
    // then also clears this notification (see markConversationRead)
    const preview = notificationPreview(content, photos.length);
    await notifyRecipient(recipientId, conversationId, sender.name, preview).catch(() => {});

    // The sender's other tabs need it too; the name lets the recipient's dashboard show who wrote
    for (const userId of [recipientId, senderId]) {
      emitToUser(userId, "chat:message", { conversationId, message, senderName: sender.name });
    }
    return message;
  },
);

// Marks the other person's messages as read and tells them, so their ticks update
export const markConversationRead = serviceHandler(async (conversationId: string, userId: string) => {
  const senderId = await otherParticipantId(conversationId, userId);
  const { count } = await prisma.chatMessage.updateMany({
    where: { conversationId, senderId, isRead: false },
    data: { isRead: true },
  });

  if (count > 0) {
    emitToUser(senderId, "chat:read", { conversationId, readerId: userId });
  }
  // The bell's "new message" entry for this chat has been seen too
  await markReadByReference(userId, conversationId).catch(() => {});
  return { conversationId, markedRead: count };
});

// Unread messages across all chats, for the menu badge
export const getUnreadCount = serviceHandler(async (userId: string) => {
  const count = await prisma.chatMessage.count({
    where: { isRead: false, senderId: { not: userId }, conversation: myConversations(userId) },
  });
  return { count };
});
