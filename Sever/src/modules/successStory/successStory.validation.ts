import { z } from "zod";

export const createSuccessStorySchema = z
  .object({
    nameBn: z.string().max(40, "nameBn cannot exceed 40 characters").optional(),
    nameEn: z.string().max(40, "nameEn cannot exceed 40 characters").optional(),
    roleBn: z.string().max(30, "roleBn cannot exceed 30 characters").optional(),
    roleEn: z.string().max(30, "roleEn cannot exceed 30 characters").optional(),
    locationBn: z.string().max(30, "locationBn cannot exceed 30 characters").optional(),
    locationEn: z.string().max(30, "locationEn cannot exceed 30 characters").optional(),
    quoteBn: z.string().min(60, "quoteBn must be at least 60 characters").max(200, "quoteBn cannot exceed 200 characters").optional(),
    quoteEn: z.string().min(60, "quoteEn must be at least 60 characters").max(200, "quoteEn cannot exceed 200 characters").optional(),
    imageUrl: z.string().url("imageUrl must be a valid URL"),
    imageKey: z.string().min(1, "imageKey is required"),
    yieldChangePercent: z.number().int().min(-100, "yieldChangePercent min is -100").max(1000, "yieldChangePercent max is 1000"),
    costChangePercent: z.number().int().min(-100, "costChangePercent min is -100").max(1000, "costChangePercent max is 1000"),
    incomeChangePercent: z.number().int().min(-100, "incomeChangePercent min is -100").max(1000, "incomeChangePercent max is 1000"),
    consent: z.boolean().refine((val) => val === true, {
      message: "You must consent to publish your story",
    }),
  })
  .superRefine((data, ctx) => {
    if (!data.nameBn && !data.nameEn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one language name (nameBn or nameEn) is required",
        path: ["nameBn"],
      });
    }
    if (!data.roleBn && !data.roleEn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one language role (roleBn or roleEn) is required",
        path: ["roleBn"],
      });
    }
    if (!data.locationBn && !data.locationEn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one language location (locationBn or locationEn) is required",
        path: ["locationBn"],
      });
    }
    if (!data.quoteBn && !data.quoteEn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one language quote (quoteBn or quoteEn) is required",
        path: ["quoteBn"],
      });
    }
  });

export const updateSuccessStorySchema = z.object({
  nameBn: z.string().max(40, "nameBn cannot exceed 40 characters").optional(),
  nameEn: z.string().max(40, "nameEn cannot exceed 40 characters").optional(),
  roleBn: z.string().max(30, "roleBn cannot exceed 30 characters").optional(),
  roleEn: z.string().max(30, "roleEn cannot exceed 30 characters").optional(),
  locationBn: z.string().max(30, "locationBn cannot exceed 30 characters").optional(),
  locationEn: z.string().max(30, "locationEn cannot exceed 30 characters").optional(),
  quoteBn: z.string().min(60, "quoteBn must be at least 60 characters").max(200, "quoteBn cannot exceed 200 characters").optional(),
  quoteEn: z.string().min(60, "quoteEn must be at least 60 characters").max(200, "quoteEn cannot exceed 200 characters").optional(),
  imageUrl: z.string().url("imageUrl must be a valid URL").optional(),
  imageKey: z.string().min(1).optional(),
  yieldChangePercent: z.number().int().min(-100).max(1000).optional(),
  costChangePercent: z.number().int().min(-100).max(1000).optional(),
  incomeChangePercent: z.number().int().min(-100).max(1000).optional(),
});

export const adminReviewSuccessStorySchema = z
  .object({
    nameBn: z.string().max(40).optional(),
    nameEn: z.string().max(40).optional(),
    roleBn: z.string().max(30).optional(),
    roleEn: z.string().max(30).optional(),
    locationBn: z.string().max(30).optional(),
    locationEn: z.string().max(30).optional(),
    quoteBn: z.string().min(60).max(200).optional(),
    quoteEn: z.string().min(60).max(200).optional(),
    imageFocus: z.string().optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    rejectionReason: z.string().optional(),
    isFeatured: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "REJECTED" && (!data.rejectionReason || data.rejectionReason.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "rejectionReason is required when status is REJECTED",
        path: ["rejectionReason"],
      });
    }
  });

export const publicStoryQuerySchema = z.object({
  locale: z.enum(["bn", "en"]).default("bn"),
  limit: z.coerce.number().int().min(1).max(20).default(4),
});

export const adminStoryQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});
