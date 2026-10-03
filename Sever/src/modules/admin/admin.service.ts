import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

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
        isActive: true,
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
    throw new Error("User not found");
  }

  if (adminId && targetUser.id === adminId) {
    throw new Error("You cannot modify your own data");
  }

  if (targetUser.role === "ADMIN") {
    throw new Error("You cannot modify another ADMIN's data");
  }

  const updateData: Record<string, any> = {};

  if (payload.role !== undefined) {
    updateData.role = payload.role;
  }

  if (payload.status !== undefined) {
    if (typeof payload.status === "boolean") {
      updateData.isActive = payload.status;
    } else if (payload.status === "ACTIVE") {
      updateData.isActive = true;
      updateData.banned = false;
    } else if (payload.status === "INACTIVE" || payload.status === "BANNED") {
      updateData.isActive = false;
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
      isActive: true,
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
        isActive: true,
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

export const AdminService = {
  getAllUsersFromDB,
  updateUserRoleStatusInDB,
  getPlatformStatistics,
  getDeliveryAgentsFromDB,
};

