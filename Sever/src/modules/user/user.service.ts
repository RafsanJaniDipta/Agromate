import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface UpdateUserProfileInput {
  name?: string;
  phone?: string;
  location?: string;
  language?: string;
  image?: string;
}

export const getUserById = serviceHandler(async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      location: true,
      language: true,
      isActive: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role ?? "FARMER",
    phone: user.phone,
    location: user.location,
    language: user.language ?? "en",
    isActive: user.isActive ?? true,
    image: user.image,
  };
});

export const updateUserProfile = serviceHandler(async (id: string, data: UpdateUserProfileInput) => {
  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(data.language !== undefined ? { language: data.language } : {}),
      ...(data.image !== undefined ? { image: data.image } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      location: true,
      language: true,
      isActive: true,
      image: true,
      updatedAt: true,
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role ?? "FARMER",
    phone: updated.phone,
    location: updated.location,
    language: updated.language ?? "en",
    isActive: updated.isActive ?? true,
    image: updated.image,
  };
});

export const getAllUsers = serviceHandler(async (options: { role?: string; page?: number; limit?: number } = {}) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const where = options.role ? { role: options.role } : {};

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
        location: true,
        phone: true,
        language: true,
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

export const UserService = {
  getUserById,
  updateUserProfile,
  getAllUsers,
};
