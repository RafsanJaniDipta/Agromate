import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { AppError } from "../../utils/AppError.js";
import { parseEnum } from "../../utils/enum.js";
import { ExpertStatus } from "../../generated/prisma/client.js";

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

const USER_ROLES = ["FARMER", "EXPERT", "ADMIN"];

export interface UpdateUserRoleStatusPayload {
  status?: boolean | string;
  role?: string;
}

export const getAllUsersFromDB = serviceHandler(async (options: PaginationOptions = {}) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
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
    prisma.user.count(),
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
    totalQuestions,
    totalDiseaseDetections,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.farm.count(),
    prisma.cropCycle.count(),
    prisma.question.count(),
    prisma.diseaseDetection.count(),
  ]);

  return {
    totalUsers,
    totalFarms,
    totalCropCycles,
    totalQuestions,
    totalDiseaseDetections,
  };
});

export const getDeliveryAgentsFromDB = serviceHandler(async (options: PaginationOptions = {}) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const where = { role: "DELIVERY_AGENT" as const };

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        location: true,
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

// Approves or rejects an expert; only a verified expert can answer questions
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

  return prisma.expertProfile.update({
    where: { userId },
    data: {
      status: decision,
      rejectionReason: decision === "REJECTED" ? (rejectionReason ?? null) : null,
    },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
    },
  });
});

export const AdminService = {
  getExpertApplications,
  reviewExpertApplication,
  getAllUsersFromDB,
  updateUserRoleStatusInDB,
  getPlatformStatistics,
  getDeliveryAgentsFromDB,
};

