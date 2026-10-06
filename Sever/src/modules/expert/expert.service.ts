import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface UpsertExpertProfileInput {
  userId: string;
  specialization: string;
  organization?: string;
  bio?: string;
  experienceYears?: number;
  qualifications?: string;
}

export const getVerifiedExperts = serviceHandler(async (specialization?: string) => {
  const experts = await prisma.expertProfile.findMany({
    where: {
      status: "VERIFIED",
      ...(specialization ? { specialization: { contains: specialization, mode: "insensitive" } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, location: true, phone: true } },
    },
    orderBy: { experienceYears: "desc" },
  });

  return experts;
});

export const getVerifiedExpertById = serviceHandler(async (id: string) => {
  const expert = await prisma.expertProfile.findFirst({
    where: {
      OR: [{ id }, { userId: id }],
      status: "VERIFIED",
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, location: true, phone: true } },
    },
  });

  return expert;
});

export const getOwnProfile = serviceHandler(async (userId: string) => {
  const profile = await prisma.expertProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, location: true, phone: true } },
    },
  });

  return profile;
});

export const upsertOwnProfile = serviceHandler(async (data: UpsertExpertProfileInput) => {
  const existing = await prisma.expertProfile.findUnique({
    where: { userId: data.userId },
  });

  // Editing a rejected profile sends it back for review; otherwise the status is kept
  const status = !existing || existing.status === "REJECTED" ? "PENDING" : existing.status;

  const profile = await prisma.expertProfile.upsert({
    where: { userId: data.userId },
    create: {
      userId: data.userId,
      specialization: data.specialization,
      organization: data.organization,
      bio: data.bio,
      experienceYears: data.experienceYears ?? 0,
      qualifications: data.qualifications,
      status,
    },
    update: {
      specialization: data.specialization,
      organization: data.organization,
      bio: data.bio,
      experienceYears: data.experienceYears,
      qualifications: data.qualifications,
      status,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, location: true, phone: true } },
    },
  });

  return profile;
});

export const ExpertService = {
  getVerifiedExperts,
  getVerifiedExpertById,
  getOwnProfile,
  upsertOwnProfile,
};
