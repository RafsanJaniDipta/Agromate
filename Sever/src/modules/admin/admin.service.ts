import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { AppError } from "../../utils/AppError.js";
import { parseEnum } from "../../utils/enum.js";
import { ExpertStatus, NotificationType } from "../../generated/prisma/client.js";
import { createAndDispatchNotification } from "../notification/notification.service.js";
import { emitToUser } from "../../socket/socket.server.js";

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface GetAllUsersOptions extends PaginationOptions {
  search?: string;
  role?: string;
}

const USER_ROLES = ["FARMER", "EXPERT", "ADMIN"];

export interface UpdateUserRoleStatusPayload {
  status?: boolean | string;
  role?: string;
}

export interface GetSupportTicketsOptions extends PaginationOptions {
  status?: string;
}

export interface BroadcastNotificationInput {
  role?: string;
  title: string;
  message: string;
  type?: NotificationType;
}

export const getAllUsersFromDB = serviceHandler(async (options: GetAllUsersOptions = {}) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const whereConditions: any[] = [];

  if (options.role && options.role.trim() !== "") {
    whereConditions.push({ role: options.role.trim().toUpperCase() });
  }

  if (options.search && options.search.trim() !== "") {
    const searchTerm = options.search.trim();
    whereConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { phone: { contains: searchTerm, mode: "insensitive" } },
        { phoneNumber: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        banReason: true,
        location: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
});

export const updateUserRoleStatusInDB = serviceHandler(async (
  id: string,
  payload: UpdateUserRoleStatusPayload,
  adminId?: string
) => {
  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) {
    throw AppError.notFound("User not found");
  }

  if (adminId && targetUser.id === adminId) {
    throw AppError.forbidden("You cannot modify your own data");
  }

  if (targetUser.role.toUpperCase() === "ADMIN") {
    throw AppError.forbidden("You cannot modify another admin's data");
  }

  const updateData: Record<string, any> = {};

  if (payload.role !== undefined) {
    const role = String(payload.role).toUpperCase();
    if (!USER_ROLES.includes(role)) {
      throw AppError.unprocessable(`Role must be one of: ${USER_ROLES.join(", ")}`);
    }
    updateData.role = role;
  }

  if (payload.status !== undefined) {
    // Better Auth's `banned` flag is the single source of "inactive"
    if (typeof payload.status === "boolean") {
      updateData.banned = !payload.status;
    } else if (payload.status === "ACTIVE") {
      updateData.banned = false;
    } else if (payload.status === "INACTIVE" || payload.status === "BANNED") {
      updateData.banned = true;
    }
  }

  return await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      updatedAt: true,
    },
  });
});

export const getPlatformStatistics = serviceHandler(async () => {
  const [
    totalUsers,
    totalFarms,
    totalCropCycles,
    totalDiseaseDetections,
    pendingExperts,
    pendingStories,
    openSupportTickets,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.farm.count(),
    prisma.cropCycle.count(),
    prisma.diseaseDetection.count(),
    prisma.expertProfile.count({ where: { status: "PENDING" } }),
    prisma.successStory.count({ where: { status: "PENDING" } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
  ]);

  return {
    totalUsers,
    totalFarms,
    totalCropCycles,
    totalDiseaseDetections,
    pendingExperts,
    pendingStories,
    openSupportTickets,
  };
});

export const getSupportTicketsFromDB = serviceHandler(async (options: GetSupportTicketsOptions = {}) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const where: Record<string, any> = {};
  if (options.status && options.status.trim() !== "") {
    where.status = options.status.trim().toUpperCase();
  }

  const [data, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        phone: true,
        topic: true,
        message: true,
        locale: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
});

export const updateSupportTicketStatusInDB = serviceHandler(async (
  id: string,
  status: string
) => {
  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) {
    throw AppError.notFound("Support ticket not found");
  }

  const upperStatus = status.toUpperCase();
  if (upperStatus !== "OPEN" && upperStatus !== "RESOLVED") {
    throw AppError.unprocessable("Status must be either OPEN or RESOLVED");
  }

  return await prisma.supportTicket.update({
    where: { id },
    data: { status: upperStatus as any },
    select: {
      id: true,
      name: true,
      phone: true,
      topic: true,
      message: true,
      locale: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
});

export const broadcastNotificationToUsers = serviceHandler(async (input: BroadcastNotificationInput) => {
  if (!input.title || !input.message) {
    throw AppError.badRequest("Title and message are required");
  }

  const where: Record<string, any> = {};
  if (input.role && input.role.trim() !== "") {
    where.role = input.role.trim().toUpperCase();
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  if (users.length === 0) {
    return { count: 0, message: "No users matched the target criteria" };
  }

  const notificationType = input.type ?? "INFO";

  const notificationRecords = users.map((u) => ({
    userId: u.id,
    title: input.title,
    message: input.message,
    type: notificationType,
  }));

  await prisma.notification.createMany({
    data: notificationRecords,
  });

  // Emit live socket notification to each target user
  users.forEach((user) => {
    emitToUser(user.id, "notification:new", {
      title: input.title,
      message: input.message,
      type: notificationType,
      createdAt: new Date(),
    });
  });

  return {
    count: users.length,
    message: `Broadcast notification sent successfully to ${users.length} user(s).`,
  };
});

// Expert profiles, oldest first so applications are reviewed in order
export const getExpertApplications = serviceHandler(async (status?: string) => {
  return prisma.expertProfile.findMany({
    where: status ? { status: parseEnum(ExpertStatus, status, "status") } : {},
    include: {
      user: { select: { id: true, name: true, phone: true, email: true, createdAt: true } },
    },
    orderBy: { createdAt: "asc" },
  });
});

// Approves or rejects an expert; only verified experts are listed for farmers to message
export const reviewExpertApplication = serviceHandler(async (
  userId: string,
  status: unknown,
  rejectionReason?: string,
) => {
  const decision = parseEnum(ExpertStatus, status, "status");
  if (decision === "PENDING") {
    throw AppError.unprocessable("Status must be VERIFIED or REJECTED");
  }

  const profile = await prisma.expertProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw AppError.notFound("Expert profile not found");
  }

  const updatedProfile = await prisma.expertProfile.update({
    where: { userId },
    data: {
      status: decision,
      rejectionReason: decision === "REJECTED" ? (rejectionReason ?? null) : null,
    },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
    },
  });

  // Dispatch live notification to expert user
  void createAndDispatchNotification({
    userId,
    title: decision === "VERIFIED" ? "বিশেষজ্ঞ প্রোফাইল অনুমোদিত" : "বিশেষজ্ঞ আবেদন প্রত্যাখ্যাত",
    message:
      decision === "VERIFIED"
        ? "অভিনন্দন! আপনার বিশেষজ্ঞ আবেদনটি অনুমোদন করা হয়েছে। আপনি এখন কৃষকদের প্রশ্নের উত্তর দিতে পারবেন।"
        : `আপনার আবেদনটি প্রত্যাখ্যান করা হয়েছে।${rejectionReason ? ` কারণ: ${rejectionReason}` : ""}`,
    type: decision === "VERIFIED" ? "SUCCESS" : "ALERT",
    referenceId: profile.id,
  });

  return updatedProfile;
});

export const AdminService = {
  getExpertApplications,
  reviewExpertApplication,
  getAllUsersFromDB,
  updateUserRoleStatusInDB,
  getPlatformStatistics,
  getSupportTicketsFromDB,
  updateSupportTicketStatusInDB,
  broadcastNotificationToUsers,
};
