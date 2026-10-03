import type { Request, Response } from "express";
import { ExpertService } from "./expert.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const getVerifiedExperts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { specialization } = req.query;
    const experts = await ExpertService.getVerifiedExperts(
      typeof specialization === "string" ? specialization : undefined,
    );
    sendSuccess(res, 200, "Verified experts fetched successfully", experts);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch experts");
  }
};

const getVerifiedExpertById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id || "";
    const expert = await ExpertService.getVerifiedExpertById(id);
    if (!expert) {
      sendError(res, 404, "Expert profile not found");
      return;
    }

    sendSuccess(res, 200, "Expert profile details fetched successfully", expert);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch expert profile");
  }
};

const getOwnProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const profile = await ExpertService.getOwnProfile(userId);
    if (!profile) {
      sendError(res, 404, "Expert profile not found");
      return;
    }

    sendSuccess(res, 200, "Own expert profile fetched successfully", profile);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch own profile");
  }
};

const updateOwnProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { specialization, bio, experienceYears, qualifications } = req.body;
    if (!specialization) {
      sendError(res, 422, "specialization is required");
      return;
    }

    const profile = await ExpertService.upsertOwnProfile({
      userId,
      specialization,
      bio,
      experienceYears: experienceYears ? Number(experienceYears) : 0,
      qualifications,
    });

    sendSuccess(res, 200, "Expert profile saved successfully", profile);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to save expert profile");
  }
};

export const ExpertController = {
  getVerifiedExperts,
  getVerifiedExpertById,
  getOwnProfile,
  updateOwnProfile,
};


