import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, phoneNumber } from "better-auth/plugins";

import { prisma } from "./database.js";
import { ac, admin as adminRole, expert, farmer } from "./permissions.js";

/**
 * Better Auth instance (Masud — Day 2).
 *
 * Read by the Better Auth CLI to generate the Prisma schema, so keep it
 * side-effect free. `bunx @better-auth/cli@latest generate` imports this file.
 *
 * Config values come straight from process.env rather than src/config/env.ts on
 * purpose: env.ts calls process.exit(1) on a missing variable, which would kill
 * the CLI mid-generation.
 */
export const auth = betterAuth({
  appName: "AgroMate",

  // Required: >= 32 chars. Provided via BETTER_AUTH_SECRET in .env.
  secret: process.env.BETTER_AUTH_SECRET,

  // This API's own origin, not the Next.js client.
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:5000",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Origins permitted to send credentialed requests. Must include the
  // Next.js client or session cookies are rejected.
  trustedOrigins: Array.from(
    new Set([
      "http://localhost:3000",
      "http://localhost:5000",
      ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "http://localhost:3000")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ]),
  ),

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    // Registration and login use email/password; verification can be enabled
    // once an email delivery provider is part of the project scope.
    requireEmailVerification: false,
  },

  session: {
    // Cookie sessions. Cross-origin cookies require SameSite=None; Secure in
    // production, which means the deployed API MUST be served over HTTPS.
    expiresIn: Number(process.env.SESSION_EXPIRES_IN ?? 60 * 60 * 24 * 7),
    updateAge: Number(process.env.SESSION_UPDATE_AGE ?? 60 * 60 * 24),
  },

  advanced: {
    // Lets the client read cross-origin cookies in local dev.
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes:
      process.env.NODE_ENV === "production"
        ? { sameSite: "none", secure: true }
        : { sameSite: "lax" },

    database: {
      generateId: "uuid",
      // Better Auth's runtime schema check reads `prisma._runtimeDataModel`,
      // which Prisma 7's `prisma-client` generator no longer populates (it
      // comes back with zero models). The check then reports all four auth
      // tables as missing even though they exist and queries work fine.
      //
      // Disabling it here is safe: `prisma migrate dev` is the real guard, and
      // it validates the schema against the live database. Re-enable if we
      // move off Prisma 7 or the generator starts emitting the data model.
      validateSchema: false,
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          let role = ((user as Record<string, unknown>).role as string || "FARMER").toUpperCase();
          if (role !== "EXPERT" && role !== "FARMER") {
            role = "FARMER";
          }
          const rawPhone = (user as Record<string, unknown>).phoneNumber || (user as Record<string, unknown>).phone;
          const phone = typeof rawPhone === "string" ? rawPhone.trim() : undefined;

          // If email is missing or empty, generate a fallback email using phone number
          let email = user.email;
          if (!email && phone) {
            const cleanPhone = phone.replace(/[^0-9]/g, "");
            email = `${cleanPhone}@agromate.dev`;
          }

          return {
            data: {
              ...user,
              email,
              role,
              phoneNumber: phone,
              phone: phone,
            },
          };
        },
      },
    },
  },

  user: {
    additionalFields: {
      // Surfaced on the farmer profile and used by the admin dashboard.
      location: { type: "string", required: false },
      phone: { type: "string", required: false },
      phoneNumber: { type: "string", required: false },
      role: { type: "string", required: false, defaultValue: "FARMER" },
      locale: { type: "string", required: false, defaultValue: "bn" },
    },
  },

  plugins: [
    phoneNumber({
      sendOTP: async () => {}, // OTP not required
      requireVerification: false,
    }),
    admin({
      ac,
      roles: {
        farmer,
        expert,
        admin: adminRole,
      },
      defaultRole: "farmer",
      adminRoles: ["admin"],
    }),
  ],
});