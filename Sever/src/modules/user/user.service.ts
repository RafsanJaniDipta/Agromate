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
  image?: string;
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
      banned: true,
      image: true,
      createdAt: true,
      updatedAt: true,
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
    isActive: !user.banned,
    image: user.image,
  };
});

export const updateUserProfile = serviceHandler(async (id: string, data: UpdateUserProfileInput) => {
  const name = data.name?.trim();
  if (data.name !== undefined && !name) {
    throw AppError.unprocessable("Name cannot be empty");
  }
  const phone = data.phone !== undefined ? await checkedPhone(id, data.phone) : undefined;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      // phoneNumber is what Better Auth's phone sign-in looks up; keep both in step
      ...(phone ? { phone, phoneNumber: phone } : {}),
      ...(data.location !== undefined ? { location: data.location.trim() || null } : {}),
      ...(data.language !== undefined ? { language: data.language } : {}),
      ...(data.image !== undefined ? { image: data.image } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      location: true,
      language: true,
      banned: true,
      image: true,
      updatedAt: true,
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role ?? "FARMER",
    phone: updated.phone,
    location: updated.location,
    language: updated.language ?? "en",
    isActive: !updated.banned,
    image: updated.image,
  };
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
        banned: true,
        createdAt: true,
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
