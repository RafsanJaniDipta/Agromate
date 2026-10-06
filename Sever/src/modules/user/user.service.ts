import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface UpdateUserProfileInput {
  name?: string;
  phone?: string;
  location?: string;
  language?: string;
  locale?: string;
  image?: string;
  // Expert profile fields
  specialization?: string;
  organization?: string;
  experienceYears?: number;
  bio?: string;
  qualifications?: string;
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
      locale: true,
      banned: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      expertProfile: {
        select: {
          id: true,
          specialization: true,
          organization: true,
          experienceYears: true,
          bio: true,
          qualifications: true,
          status: true,
          rejectionReason: true,
        },
      },
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
    locale: user.locale ?? "bn",
    isActive: !user.banned,
    image: user.image,
    expertProfile: user.expertProfile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
});

export const updateUserProfile = serviceHandler(async (id: string, data: UpdateUserProfileInput) => {
  // Update core user fields if provided
  const hasUserUpdates =
    data.name !== undefined ||
    data.phone !== undefined ||
    data.location !== undefined ||
    data.language !== undefined ||
    data.locale !== undefined ||
    data.image !== undefined;

  if (hasUserUpdates) {
    await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.language !== undefined ? { language: data.language } : {}),
        ...(data.locale !== undefined ? { locale: data.locale } : {}),
        ...(data.image !== undefined ? { image: data.image } : {}),
      },
    });
  }

  // Update or create ExpertProfile if expert fields are provided
  const hasExpertFields =
    data.specialization !== undefined ||
    data.organization !== undefined ||
    data.experienceYears !== undefined ||
    data.bio !== undefined ||
    data.qualifications !== undefined;

  if (hasExpertFields) {
    await prisma.expertProfile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        specialization: data.specialization ?? "General Agriculture",
        organization: data.organization,
        experienceYears: data.experienceYears ?? 0,
        bio: data.bio,
        qualifications: data.qualifications,
      },
      update: {
        ...(data.specialization !== undefined ? { specialization: data.specialization } : {}),
        ...(data.organization !== undefined ? { organization: data.organization } : {}),
        ...(data.experienceYears !== undefined ? { experienceYears: data.experienceYears } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.qualifications !== undefined ? { qualifications: data.qualifications } : {}),
      },
    });
  }

  return getUserById(id);
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
        locale: true,
        banned: true,
        createdAt: true,
        expertProfile: {
          select: {
            specialization: true,
            status: true,
          },
        },
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
