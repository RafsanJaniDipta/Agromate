import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  getAllCategories as getAllCategoriesService,
  getVerifiedExperts as getVerifiedExpertsService,
  getVerifiedExpertById as getVerifiedExpertByIdService,
  getOwnProfile as getOwnProfileService,
  upsertOwnProfile as upsertOwnProfileService,
} from "./expert.service.js";

export const getAllCategories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const categories = await getAllCategoriesService();
  sendSuccess(res, 200, "Expert categories fetched successfully", categories);
});

export const getVerifiedExperts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { specialization, category } = req.query;
  const experts = await getVerifiedExpertsService(
    typeof category === "string" ? category : undefined,
    typeof specialization === "string" ? specialization : undefined,
  );
  sendSuccess(res, 200, "Verified experts fetched successfully", experts);
});

export const getVerifiedExpertById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id || "");
  const expert = await getVerifiedExpertByIdService(id);
  if (!expert) {
    throw AppError.notFound("Expert profile not found");
  }

  sendSuccess(res, 200, "Expert profile details fetched successfully", expert);
});

export const getOwnProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const profile = await getOwnProfileService(userId);
  if (!profile) {
    throw AppError.notFound("Expert profile not found");
  }

  sendSuccess(res, 200, "Own expert profile fetched successfully", profile);
});

export const updateOwnProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { specialization, organization, bio, experienceYears, qualifications, categoryIds } = req.body;
  if (!specialization) {
    throw AppError.unprocessable("specialization is required");
  }

  const profile = await upsertOwnProfileService({
    userId,
    specialization,
    organization,
    bio,
    experienceYears: experienceYears ? Number(experienceYears) : 0,
    qualifications,
    categoryIds: Array.isArray(categoryIds) ? categoryIds : undefined,
  });

  sendSuccess(res, 200, "Expert profile saved successfully", profile);
});

export const ExpertController = {
  getAllCategories,
  getVerifiedExperts,
  getVerifiedExpertById,
  getOwnProfile,
  updateOwnProfile,
};
