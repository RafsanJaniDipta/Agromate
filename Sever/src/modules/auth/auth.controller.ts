import type { Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import { env } from "../../config/env.js";
import { registerUser, loginUser } from "./auth.service.js";

const MIN_PASSWORD_LENGTH = 8;

// Only these two can be chosen at sign-up; admins are made by other admins
const SIGN_UP_ROLES = ["FARMER", "EXPERT"];

export const handleRegister = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, password, locale, specialization, organization, experienceYears } = req.body;
  const role = String(req.body.role ?? "FARMER").toUpperCase();

  if (!name || !phone || !password) {
    throw AppError.unprocessable("Name, phone and password are required.");
  }
  if (String(password).length < MIN_PASSWORD_LENGTH) {
    throw AppError.unprocessable(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (!SIGN_UP_ROLES.includes(role)) {
    throw AppError.unprocessable("Role must be FARMER or EXPERT.");
  }

  const years = Number(experienceYears ?? 0);
  if (role === "EXPERT") {
    if (!specialization) {
      throw AppError.unprocessable("Specialization is required for experts.");
    }
    if (!Number.isInteger(years) || years < 0) {
      throw AppError.unprocessable("Experience must be a whole number of years.");
    }
  }

  const user = await registerUser({
    name,
    phone,
    password,
    locale,
    expert: role === "EXPERT" ? { specialization, organization, experienceYears: years } : undefined,
  });

  sendSuccess(res, 201, "User registered successfully.", user);
});

export const handleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { phone, password, remember } = req.body;

  if (!phone || !password) {
    throw AppError.unprocessable("Phone and password are required.");
  }

  // HTML checkboxes send "on" when ticked
  const rememberMe = remember === true || remember === "on" || remember === "true";
  const { user, cookies } = await loginUser(
    { phone, password, remember: rememberMe },
    fromNodeHeaders(req.headers),
  );

  res.setHeader("Set-Cookie", cookies);
  sendSuccess(res, 200, "Login successful.", user);
});

// Accounts created by prisma/seed.ts
const SEEDED_EXPERT_PHONE = "+8801711223344";
const SEEDED_ADMIN_PHONE = "+8801799887766";

// Demo accounts for the login pages' one-click buttons, read from .env so no password
// ever reaches the browser. A role without a phone or password is simply not offered.
// The expert and admin default to the seeded accounts.
const demoAccounts = () => ({
  farmer: { phone: env.DEMO_FARMER_PHONE, password: env.DEMO_FARMER_PASSWORD },
  expert: {
    phone: env.DEMO_EXPERT_PHONE || SEEDED_EXPERT_PHONE,
    password: env.DEMO_EXPERT_PASSWORD || env.SEED_EXPERT_PASSWORD,
  },
  admin: {
    phone: env.DEMO_ADMIN_PHONE || SEEDED_ADMIN_PHONE,
    password: env.DEMO_ADMIN_PASSWORD || env.SEED_ADMIN_PASSWORD,
  },
});

type DemoRole = keyof ReturnType<typeof demoAccounts>;

const availableDemoRoles = () =>
  (Object.entries(demoAccounts()) as [DemoRole, { phone: string; password: string }][])
    .filter(([, account]) => account.phone && account.password)
    .map(([role]) => role);

// GET /api/auth/demo-login → which demo buttons to show
export const listDemoLogins = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, 200, "Demo accounts", availableDemoRoles());
});

// POST /api/auth/demo-login { role: "farmer" | "expert" | "admin" } → signs in as that demo account
export const handleDemoLogin = asyncHandler(async (req: Request, res: Response) => {
  const role = String(req.body?.role ?? "") as DemoRole;
  if (!availableDemoRoles().includes(role)) {
    throw AppError.notFound("This demo account isn't available.");
  }

  const { user, cookies } = await loginUser(
    { ...demoAccounts()[role], remember: false },
    fromNodeHeaders(req.headers),
  );

  res.setHeader("Set-Cookie", cookies);
  sendSuccess(res, 200, "Login successful.", user);
});

export const AuthController = {
  handleRegister,
  handleLogin,
  listDemoLogins,
  handleDemoLogin,
};
