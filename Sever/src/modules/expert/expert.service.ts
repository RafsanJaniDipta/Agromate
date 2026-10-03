import { prisma } from "../../config/database.js";

export interface UpsertExpertProfileInput {
  userId: string;
  specialization: string;
  bio?: string;
  experienceYears?: number;
  qualifications?: string;
}

const getVerifiedExperts = async (specialization?: string) => {
  const experts = await prisma.expertProfile.findMany({
    where: {
      status: "VERIFIED" as any,
      ...(specialization ? { specialization: { contains: specialization, mode: "insensitive" } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, location: true, phone: true } },
    },
    orderBy: { rating: "desc" },
  });

  return experts;
};

const getVerifiedExpertById = async (id: string) => {
  const expert = await prisma.expertProfile.findFirst({
    where: {
      OR: [{ id }, { userId: id }],
      status: "VERIFIED" as any,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, location: true, phone: true } },
    },
  });

  return expert;
};

const getOwnProfile = async (userId: string) => {
  const profile = await prisma.expertProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, location: true, phone: true } },
    },
  });

  return profile;
};

const upsertOwnProfile = async (data: UpsertExpertProfileInput) => {
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
    },
    update: {
      specialization: data.specialization,
      bio: data.bio,
      experienceYears: data.experienceYears,
      qualifications: data.qualifications,
      status: newStatus,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, location: true, phone: true } },
    },
  });

  return profile;
};

export const ExpertService = {
  getVerifiedExperts,
  getVerifiedExpertById,
  getOwnProfile,
  upsertOwnProfile,
};


