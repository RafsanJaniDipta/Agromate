import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { AppError } from "../../utils/AppError.js";
import { normalizePhoneNumber } from "../../utils/phone.js";

// Bangladeshi mobile number after normalising, e.g. 017XXXXXXXX
const BD_MOBILE = /^01[3-9]\d{8}$/;

// The phone is the farmer's login, so it must be valid and belong to no one else
async function checkedPhone(userId: string, raw: string): Promise<string> {
  const phone = normalizePhoneNumber(raw);
  if (!BD_MOBILE.test(phone)) {
    throw AppError.unprocessable("Enter an 11-digit mobile number, e.g. 017XXXXXXXX");
  }

  const taken = await prisma.user.findFirst({
    where: {
      id: { not: userId },
      OR: [{ phone: { in: [phone, `+88${phone}`, `88${phone}`] } }, { phoneNumber: phone }],
    },
    select: { id: true },
  });
  if (taken) {
    throw AppError.conflict("This phone number is already used by another account");
  }
  return phone;
}

export interface UpdateUserProfileInput {
  name?: string;
  phone?: string;
  location?: string;
  language?: string;
  locale?: string;
  image?: string;
  // Expert profile fields
  specialization?: string;
  organization?: string;
  experienceYears?: number;
  bio?: string;
  qualifications?: string;
}

export const getUserById = serviceHandler(async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      location: true,
      language: true,
      locale: true,
      banned: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      expertProfile: {
        select: {
          id: true,
          specialization: true,
          organization: true,
          experienceYears: true,
          bio: true,
          qualifications: true,
          status: true,
          rejectionReason: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role ?? "FARMER",
    phone: user.phone,
    location: user.location,
    language: user.language ?? "en",
    locale: user.locale ?? "bn",
    isActive: !user.banned,
    image: user.image,
    expertProfile: user.expertProfile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
});

export const updateUserProfile = serviceHandler(async (id: string, data: UpdateUserProfileInput) => {
  const name = data.name?.trim();
  if (data.name !== undefined && !name) {
    throw AppError.unprocessable("Name cannot be empty");
  }
  const phone = data.phone !== undefined ? await checkedPhone(id, data.phone) : undefined;

  // Core account fields
  const userData = {
    ...(name ? { name } : {}),
    // phoneNumber is what Better Auth's phone sign-in looks up; keep both in step
    ...(phone ? { phone, phoneNumber: phone } : {}),
    ...(data.location !== undefined ? { location: data.location.trim() || null } : {}),
    ...(data.language !== undefined ? { language: data.language } : {}),
    ...(data.locale !== undefined ? { locale: data.locale } : {}),
    ...(data.image !== undefined ? { image: data.image } : {}),
  };
  if (Object.keys(userData).length) {
    await prisma.user.update({ where: { id }, data: userData });
  }

  // Expert profile fields
  const hasExpertFields =
    data.specialization !== undefined ||
    data.organization !== undefined ||
    data.experienceYears !== undefined ||
    data.bio !== undefined ||
    data.qualifications !== undefined;

  if (hasExpertFields) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true, expertProfile: { select: { status: true } } },
    });
    // Otherwise a farmer could create a PENDING profile that shows up as an expert application
    if (user?.role?.toUpperCase() !== "EXPERT") {
      throw AppError.forbidden("Only experts can edit expert profile fields");
    }

    await prisma.expertProfile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        specialization: data.specialization ?? "General Agriculture",
        organization: data.organization,
        experienceYears: data.experienceYears ?? 0,
        bio: data.bio,
        qualifications: data.qualifications,
      },
      update: {
        ...(data.specialization !== undefined ? { specialization: data.specialization } : {}),
        ...(data.organization !== undefined ? { organization: data.organization } : {}),
        ...(data.experienceYears !== undefined ? { experienceYears: data.experienceYears } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.qualifications !== undefined ? { qualifications: data.qualifications } : {}),
        // Editing a rejected profile sends it back for review, as /experts/me does
        ...(user.expertProfile?.status === "REJECTED" ? { status: "PENDING" as const } : {}),
      },
    });
  }

  return getUserById(id);
});

export const getAllUsers = serviceHandler(async (options: { role?: string; page?: number; limit?: number } = {}) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const where = options.role ? { role: options.role } : {};

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        location: true,
        phone: true,
        language: true,
        locale: true,
        banned: true,
        createdAt: true,
        expertProfile: {
          select: {
            specialization: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
});

export const UserService = {
  getUserById,
  updateUserProfile,
  getAllUsers,
};
