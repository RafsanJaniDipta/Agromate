import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import type { StoryStatus } from "./successStory.types.js";
import { translateStoryText } from "./successStory.translate.js";
import {
  createSuccessStory,
  deleteAdminStory,
  deleteFarmerStory,
  generateUploadSignature,
  getAdminStories,
  getFarmerStories,
  getPublicSuccessStories,
  reviewSuccessStory,
  updateFarmerStory,
} from "./successStory.service.js";

export const getUploadSignatureHandler = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const signatureData = await generateUploadSignature();
    sendSuccess(res, 200, "Upload signature generated successfully", signatureData);
  },
);

export const createSuccessStoryHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const story = await createSuccessStory(userId, req.body);
    sendSuccess(res, 201, "Success story submitted successfully", story);
  },
);

export const getFarmerStoriesHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const stories = await getFarmerStories(userId);
    sendSuccess(res, 200, "Farmer success stories fetched", stories);
  },
);

export const updateFarmerStoryHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const storyId = String(req.params.id || "");
    const updated = await updateFarmerStory(storyId, userId, req.body);
    sendSuccess(res, 200, "Success story updated and submitted for re-review", updated);
  },
);

export const deleteFarmerStoryHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const storyId = String(req.params.id || "");
    const result = await deleteFarmerStory(storyId, userId);
    sendSuccess(res, 200, "Success story deleted successfully", result);
  },
);

export const getAdminStoriesHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { status } = req.query;
    const stories = await getAdminStories(status as StoryStatus | undefined);
    sendSuccess(res, 200, "Admin success stories fetched", stories);
  },
);

export const reviewSuccessStoryHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const adminUserId = req.user!.id;
    const storyId = String(req.params.id || "");
    const updated = await reviewSuccessStory(storyId, adminUserId, req.body);
    sendSuccess(res, 200, "Success story reviewed successfully", updated);
  },
);

// AI suggestions for the text missing in one language; nothing is saved
export const translateStoryHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const suggestions = await translateStoryText(String(req.params.id || ""));
    sendSuccess(res, 200, "Translation suggestions ready", suggestions);
  },
);

export const deleteAdminStoryHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const storyId = String(req.params.id || "");
    const result = await deleteAdminStory(storyId);
    sendSuccess(res, 200, "Success story deleted by admin", result);
  },
);

export const getPublicSuccessStoriesHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const locale = (req.query.locale === "en" ? "en" : "bn") as "bn" | "en";
    const limit = Number(req.query.limit) || 4;
    const stories = await getPublicSuccessStories(locale, limit);
    sendSuccess(res, 200, "Success stories fetched", stories);
  },
);
