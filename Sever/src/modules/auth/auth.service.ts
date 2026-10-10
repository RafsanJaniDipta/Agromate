import { isAPIError } from "better-auth/api";

import { auth } from "../../config/auth.js";
import { prisma } from "../../config/database.js";
import { normalizePhoneNumber } from "../../utils/phone.js";
import { AppError } from "../../utils/AppError.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

// What an expert fills in when applying; an admin reviews it before farmers can reach them
export interface ExpertApplication {
  specialization: string;
  organization?: string;
  experienceYears?: number;
}

export interface RegisterInput {
  name: string;
  phone: string;
  password: string;
  locale?: string;
  // Present only when signing up as an expert
  expert?: ExpertApplication;
}

export interface LoginInput {
  phone: string;
  password: string;
  remember?: boolean;
}

// Better Auth signs in by email, so each phone gets a stable placeholder email
const emailForPhone = (phone: string) => `${phone}@agromate.local`;

// Some accounts (e.g. seeded ones) store the number with the +88 country code
const phoneVariants = (phone: string) => [phone, `+88${phone}`, `88${phone}`];

// Better Auth won't let sign-up set a role, so the server does it here, together
// with the PENDING profile. If that fails the half-made account is removed.
async function makeExpertApplicant(userId: string, application: ExpertApplication) {
  try {
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { role: "EXPERT" } }),
      prisma.expertProfile.create({
        data: {
          userId,
          specialization: application.specialization,
          organization: application.organization,
          experienceYears: application.experienceYears ?? 0,
          status: "PENDING",
        },
      }),
    ]);
  } catch (error) {
    await prisma.user.delete({ where: { id: userId } });
    throw error;
  }
}

export const registerUser = serviceHandler(async (input: RegisterInput) => {
  const phone = normalizePhoneNumber(input.phone);
  const email = emailForPhone(phone);

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ phone: { in: phoneVariants(phone) } }, { email }] },
  });

  if (existingUser) {
    throw AppError.conflict("Phone number already registered.");
  }

  let userId: string;
  try {
    // Better Auth hashes the password and creates the credential account
    const { user } = await auth.api.signUpEmail({
      body: { name: input.name, email, password: input.password, phone, locale: input.locale ?? "bn" },
    });
    userId = user.id;
  } catch (error) {
    if (isAPIError(error)) {
      throw AppError.badRequest(error.body?.message ?? error.message);
    }
    throw error;
  }

  if (input.expert) {
    await makeExpertApplicant(userId, input.expert);
  }

  return { id: userId, name: input.name, phone, role: input.expert ? "EXPERT" : "FARMER" };
});

export const loginUser = serviceHandler(async (input: LoginInput, requestHeaders: Headers) => {
  const phone = normalizePhoneNumber(input.phone);
  const user = await prisma.user.findFirst({
    where: { phone: { in: phoneVariants(phone) } },
  });

  if (!user) {
    throw AppError.unauthorized("Invalid phone number or password.");
  }

  try {
    // returnHeaders gives us the Set-Cookie header for the session
    const { headers, response } = await auth.api.signInEmail({
      body: { email: user.email, password: input.password, rememberMe: input.remember ?? false },
      headers: requestHeaders,
      returnHeaders: true,
    });

    return {
      user: { id: response.user.id, name: response.user.name, phone, role: user.role },
      cookies: headers.getSetCookie(),
    };
  } catch (error) {
    if (isAPIError(error)) {
      throw AppError.unauthorized("Invalid phone number or password.");
    }
    throw error;
  }
});

export const AuthService = {
  registerUser,
  loginUser,
};
