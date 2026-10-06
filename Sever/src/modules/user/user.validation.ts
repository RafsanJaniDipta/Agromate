import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().max(50, "Name cannot exceed 50 characters").optional(),
  phone: z.string().max(20, "Phone number cannot exceed 20 characters").optional(),
  location: z.string().max(50, "Location cannot exceed 50 characters").optional(),
  language: z.enum(["bn", "en"]).optional(),
  locale: z.enum(["bn", "en"]).optional(),
  image: z.string().url("Image must be a valid URL").optional(),
  // Expert profile specific fields
  specialization: z.string().max(100, "Specialization cannot exceed 100 characters").optional(),
  organization: z.string().max(100, "Organization cannot exceed 100 characters").optional(),
  experienceYears: z.number().int().min(0, "Experience years must be positive").max(70).optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  qualifications: z.string().max(300, "Qualifications cannot exceed 300 characters").optional(),
});
