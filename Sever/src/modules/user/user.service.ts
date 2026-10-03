import { prisma } from "../../config/database.js";

export interface UpdateUserProfileInput {
  name?: string;
  phone?: string;
  location?: string;
  language?: string;
}

const getUserById = async (id: string) => {
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
  };
};

const updateUserProfile = async (id: string, data: UpdateUserProfileInput) => {
  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(data.language !== undefined ? { language: data.language } : {}),
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
  };
};

const getAllUsers = async (role?: string) => {
  return await prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
    },
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
  });
};

export const UserService = {
  getUserById,
  updateUserProfile,
  getAllUsers,
};


