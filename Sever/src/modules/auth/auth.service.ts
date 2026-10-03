import { prisma } from "../../config/database.js";
import { normalizePhoneNumber } from "../../utils/phone.js";
import { AppError } from "../../utils/AppError.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface RegisterInput {
  name: string;
  phone: string;
  password?: string;
  locale?: string;
}

export interface LoginInput {
  phone: string;
  password?: string;
  remember?: string;
}

export const registerUser = serviceHandler(async (input: RegisterInput) => {
  const normalizedPhone = normalizePhoneNumber(input.phone);
  const locale = input.locale || "bn";

  // Dummy email fallback if only phone is provided
  const email = `${normalizedPhone}@agromate.local`;

  // Check if phone or email exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ phone: normalizedPhone }, { email }],
    },
  });

  if (existingUser) {
    throw AppError.badRequest("Phone number already registered.");
  }

  const user = await (prisma.user as any).create({
    data: {
      name: input.name,
      phone: normalizedPhone,
      email,
      locale,
      role: "FARMER",
    },
  });

  if (input.password) {
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: input.password,
      },
    });
  }

  return user;
});

export const loginUser = serviceHandler(async (input: LoginInput) => {
  const normalizedPhone = normalizePhoneNumber(input.phone);

  const user = await prisma.user.findFirst({
    where: { phone: normalizedPhone },
  });

  if (!user) {
    throw AppError.unauthorized("Invalid phone number or password.");
  }

  return {
    user,
    message: "Login successful.",
  };
});

export const AuthService = {
  registerUser,
  loginUser,
};
