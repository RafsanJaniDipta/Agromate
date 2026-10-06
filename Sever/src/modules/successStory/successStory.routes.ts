import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { adminOnly, authorize, farmerOnly } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  createSuccessStoryHandler,
  deleteAdminStoryHandler,
  deleteFarmerStoryHandler,
  getAdminStoriesHandler,
  getFarmerStoriesHandler,
  getPublicSuccessStoriesHandler,
  getUploadSignatureHandler,
  reviewSuccessStoryHandler,
  updateFarmerStoryHandler,
} from "./successStory.controller.js";
import {
  adminReviewSuccessStorySchema,
  adminStoryQuerySchema,
  createSuccessStorySchema,
  publicStoryQuerySchema,
  updateSuccessStorySchema,
} from "./successStory.validation.ts";

export const successStoryRouter = Router();

// Public route (Home Page)
successStoryRouter.get(
  "/",
  validate({ query: publicStoryQuerySchema }),
  getPublicSuccessStoriesHandler,
);

// Cloudinary signature endpoint (Farmer or Admin)
successStoryRouter.post(
  "/upload-signature",
  authenticate,
  authorize("FARMER", "ADMIN", "farmer", "admin"),
  getUploadSignatureHandler,
);

// Farmer routes
successStoryRouter.post(
  "/",
  authenticate,
  farmerOnly,
  validate({ body: createSuccessStorySchema }),
  createSuccessStoryHandler,
);

successStoryRouter.get(
  "/mine",
  authenticate,
  farmerOnly,
  getFarmerStoriesHandler,
);

successStoryRouter.patch(
  "/mine/:id",
  authenticate,
  farmerOnly,
  validate({ body: updateSuccessStorySchema }),
  updateFarmerStoryHandler,
);

successStoryRouter.delete(
  "/mine/:id",
  authenticate,
  farmerOnly,
  deleteFarmerStoryHandler,
);

// Admin routes
successStoryRouter.get(
  "/admin",
  authenticate,
  adminOnly,
  validate({ query: adminStoryQuerySchema }),
  getAdminStoriesHandler,
);

successStoryRouter.patch(
  "/:id/review",
  authenticate,
  adminOnly,
  validate({ body: adminReviewSuccessStorySchema }),
  reviewSuccessStoryHandler,
);

successStoryRouter.delete(
  "/:id",
  authenticate,
  adminOnly,
  deleteAdminStoryHandler,
);
