import { prisma } from "../../config/database.js";
import { cloudinary } from "../../config/cloudinary.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";
import { createNotification } from "../notification/notification.service.js";
import type {
  AdminReviewSuccessStoryInput,
  CreateSuccessStoryInput,
  PublicSuccessStoryResponse,
  StoryStatus,
  UpdateSuccessStoryInput,
} from "./successStory.types.js";

/**
 * Generate a Cloudinary upload signature for client-side direct uploads.
 */
export async function generateUploadSignature() {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = "agromate/stories";

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    env.CLOUDINARY_API_SECRET,
  );

  return {
    signature,
    timestamp,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    folder,
  };
}

// testing

/**
 * Create a new success story (Farmer).
 */
export async function createSuccessStory(userId: string, input: CreateSuccessStoryInput) {
  const story = await prisma.successStory.create({
    data: {
      userId,
      nameBn: input.nameBn,
      nameEn: input.nameEn,
      roleBn: input.roleBn,
      roleEn: input.roleEn,
      locationBn: input.locationBn,
      locationEn: input.locationEn,
      quoteBn: input.quoteBn,
      quoteEn: input.quoteEn,
      imageUrl: input.imageUrl,
      imageKey: input.imageKey,
      yieldChangePercent: input.yieldChangePercent,
      costChangePercent: input.costChangePercent,
      incomeChangePercent: input.incomeChangePercent,
      consentAt: new Date(),
      status: "PENDING",
    },
  });

  return story;
}

/**
 * Get all stories belonging to a farmer.
 */
export async function getFarmerStories(userId: string) {
  return prisma.successStory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Update a farmer's own story. Resets status to PENDING and isFeatured to false.
 */
export async function updateFarmerStory(
  storyId: string,
  userId: string,
  input: UpdateSuccessStoryInput,
) {
  const existing = await prisma.successStory.findFirst({
    where: { id: storyId, userId },
  });

  if (!existing) {
    throw AppError.notFound("Success story not found");
  }

  // If a new image is supplied and differs from existing imageKey, delete old image from Cloudinary
  if (input.imageKey && input.imageKey !== existing.imageKey) {
    try {
      await cloudinary.uploader.destroy(existing.imageKey);
    } catch (err) {
      logger.warn("Failed to delete previous image from Cloudinary", err);
    }
  }

  const updated = await prisma.successStory.update({
    where: { id: storyId },
    data: {
      ...input,
      status: "PENDING",
      isFeatured: false,
    },
  });

  return updated;
}

/**
 * Delete a farmer's own story. Deletes photo from Cloudinary storage.
 */
export async function deleteFarmerStory(storyId: string, userId: string) {
  const existing = await prisma.successStory.findFirst({
    where: { id: storyId, userId },
  });

  if (!existing) {
    throw AppError.notFound("Success story not found");
  }

  try {
    await cloudinary.uploader.destroy(existing.imageKey);
  } catch (err) {
    logger.warn("Failed to delete image from Cloudinary", err);
  }

  await prisma.successStory.delete({
    where: { id: storyId },
  });

  return { id: storyId };
}

/**
 * Get stories for admin moderation list.
 */
export async function getAdminStories(status?: StoryStatus) {
  return prisma.successStory.findMany({
    where: status ? { status } : undefined,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Notification text is stored in Bangla, like the other notifications
function notifyStoryDecision(userId: string, storyId: string, status: StoryStatus, reason: string | null) {
  const approved = status === "APPROVED";
  return createNotification({
    userId,
    title: approved ? "আপনার সাফল্যের গল্প অনুমোদিত" : "আপনার সাফল্যের গল্প ফেরত এসেছে",
    message: approved
      ? "অভিনন্দন! আপনার গল্পটি এখন সবাই দেখতে পাবেন।"
      : `গল্পটি ঠিক করে আবার পাঠান।${reason ? ` কারণ: ${reason}` : ""}`,
    type: approved ? "SUCCESS" : "WARNING",
    referenceId: storyId,
    link: "/dashboard/stories",
  }).catch(() => {}); // a missed notification mustn't fail the review
}

/**
 * Admin review: approve, reject, edit translations, set focus/featured/sortOrder.
 */
export async function reviewSuccessStory(
  storyId: string,
  adminUserId: string,
  input: AdminReviewSuccessStoryInput,
) {
  const existing = await prisma.successStory.findUnique({
    where: { id: storyId },
  });

  if (!existing) {
    throw AppError.notFound("Success story not found");
  }

  const targetStatus = input.status ?? existing.status;

  // If setting status to APPROVED, ensure all 8 localized fields are present
  if (targetStatus === "APPROVED") {
    const nameBn = input.nameBn ?? existing.nameBn;
    const nameEn = input.nameEn ?? existing.nameEn;
    const roleBn = input.roleBn ?? existing.roleBn;
    const roleEn = input.roleEn ?? existing.roleEn;
    const locationBn = input.locationBn ?? existing.locationBn;
    const locationEn = input.locationEn ?? existing.locationEn;
    const quoteBn = input.quoteBn ?? existing.quoteBn;
    const quoteEn = input.quoteEn ?? existing.quoteEn;

    if (
      !nameBn ||
      !nameEn ||
      !roleBn ||
      !roleEn ||
      !locationBn ||
      !locationEn ||
      !quoteBn ||
      !quoteEn
    ) {
      throw AppError.badRequest(
        "Cannot approve story: All text fields in both Bengali and English (name, role, location, quote) must be filled before approving.",
      );
    }
  }

  const updated = await prisma.successStory.update({
    where: { id: storyId },
    data: {
      ...input,
      // A reason only makes sense on a rejected story, and only approved stories can be featured
      ...(targetStatus !== "REJECTED" && { rejectionReason: null }),
      ...(targetStatus !== "APPROVED" && { isFeatured: false }),
      reviewedById: adminUserId,
      reviewedAt: new Date(),
    },
  });

  // Tell the farmer when the decision changes (saving translations alone stays quiet)
  if (targetStatus !== existing.status && targetStatus !== "PENDING") {
    void notifyStoryDecision(updated.userId, storyId, targetStatus, updated.rejectionReason);
  }

  return updated;
}

/**
 * Admin hard delete of a success story.
 */
export async function deleteAdminStory(storyId: string) {
  const existing = await prisma.successStory.findUnique({
    where: { id: storyId },
  });

  if (!existing) {
    throw AppError.notFound("Success story not found");
  }

  try {
    await cloudinary.uploader.destroy(existing.imageKey);
  } catch (err) {
    logger.warn("Failed to delete image from Cloudinary", err);
  }

  await prisma.successStory.delete({
    where: { id: storyId },
  });

  return { id: storyId };
}

/**
 * Public home page query for approved & featured success stories.
 */
export async function getPublicSuccessStories(
  locale: "bn" | "en" = "bn",
  limit = 4,
): Promise<PublicSuccessStoryResponse[]> {
  const stories = await prisma.successStory.findMany({
    where: {
      status: "APPROVED",
      isFeatured: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
  });

  return stories.map((s) => {
    const name = locale === "en" ? s.nameEn || s.nameBn || "" : s.nameBn || s.nameEn || "";
    const role = locale === "en" ? s.roleEn || s.roleBn || "" : s.roleBn || s.roleEn || "";
    const location = locale === "en" ? s.locationEn || s.locationBn || "" : s.locationBn || s.locationEn || "";
    const quote = locale === "en" ? s.quoteEn || s.quoteBn || "" : s.quoteBn || s.quoteEn || "";

    return {
      id: s.id,
      name,
      role,
      location,
      quote,
      imageUrl: s.imageUrl,
      imageFocus: s.imageFocus,
      yieldChangePercent: s.yieldChangePercent,
      costChangePercent: s.costChangePercent,
      incomeChangePercent: s.incomeChangePercent,
    };
  });
}
