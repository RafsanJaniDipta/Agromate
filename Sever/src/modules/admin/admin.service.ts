import { prisma } from "../../config/database.js";

const getAllUsersFromDB = async () => {
  return await prisma.user.findMany({
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
  });
};

const updateUserRoleStatusInDB = async (
  id: string,
  payload: { status?: boolean | string; role?: string },
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
};

const getPlatformStatistics = async () => {
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
};

const getDeliveryAgentsFromDB = async () => {
  return await prisma.user.findMany({
    where: {
      role: "DELIVERY_AGENT",
    },
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
  });
};

export const AdminService = {
  getAllUsersFromDB,
  updateUserRoleStatusInDB,
  getPlatformStatistics,
  getDeliveryAgentsFromDB,
};

