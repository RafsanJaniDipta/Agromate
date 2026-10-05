import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface UpsertExpertProfileInput {
  userId: string;
  specialization: string;
  bio?: string;
  experienceYears?: number;
  qualifications?: string;
  categoryIds?: string[];
}

export const getAllCategories = serviceHandler(async () => {
  const categories = await prisma.expertCategory.findMany({
    orderBy: { nameEn: "asc" },
  });
  return categories;
});

export const getVerifiedExperts = serviceHandler(async (category?: string, specialization?: string) => {
  const experts = await prisma.expertProfile.findMany({
    where: {
      status: "VERIFIED" as any,
      ...(specialization ? { specialization: { contains: specialization, mode: "insensitive" } } : {}),
      ...(category
        ? {
            categories: {
              some: {
                OR: [
                  { categoryId: category },
                  { category: { slug: category } },
                ],
              },
            },
          }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, location: true, phone: true } },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  return experts;
});

export const getVerifiedExpertById = serviceHandler(async (id: string) => {
  const expert = await prisma.expertProfile.findFirst({
    where: {
      OR: [{ id }, { userId: id }],
      status: "VERIFIED" as any,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, location: true, phone: true } },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  return expert;
});

export const getOwnProfile = serviceHandler(async (userId: string) => {
  const profile = await prisma.expertProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, location: true, phone: true } },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  return profile;
});

export const upsertOwnProfile = serviceHandler(async (data: UpsertExpertProfileInput) => {
  const existing = await prisma.expertProfile.findUnique({
    where: { userId: data.userId },
  });

  const newStatus = existing && (existing as any).status === "REJECTED" ? ("PENDING" as any) : (existing as any)?.status ?? ("PENDING" as any);

  const profile = await prisma.expertProfile.upsert({
    where: { userId: data.userId },
    create: {
      userId: data.userId,
      specialization: data.specialization,
      bio: data.bio,
      experienceYears: data.experienceYears ?? 0,
      qualifications: data.qualifications,
      status: "PENDING" as any,
      categories: data.categoryIds && data.categoryIds.length > 0
        ? {
            create: data.categoryIds.map((categoryId) => ({ categoryId })),
          }
        : undefined,
    },
    update: {
      specialization: data.specialization,
      bio: data.bio,
      experienceYears: data.experienceYears,
      qualifications: data.qualifications,
      status: newStatus,
      categories: data.categoryIds
        ? {
            deleteMany: {},
            create: data.categoryIds.map((categoryId) => ({ categoryId })),
          }
        : undefined,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, location: true, phone: true } },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  return profile;
});

export const ExpertService = {
  getAllCategories,
  getVerifiedExperts,
  getVerifiedExpertById,
  getOwnProfile,
  upsertOwnProfile,
};
