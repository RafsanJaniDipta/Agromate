import "dotenv/config";
import { z } from "zod";

/**
 * Centralised, validated environment configuration.
 *
 * Every secret the server needs is declared here once. `parseEnv` runs at
 * import time, so a missing or malformed variable crashes the process on boot
 * instead of failing silently on the first request that needs it.
 */

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  // Optional: error | warn | info | http | debug (see src/utils/logger.ts)
  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "debug"]).optional(),

  // Database (Sondip)
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Auth: Better Auth (Masud)
  // NOTE: src/config/auth.ts reads BETTER_AUTH_* straight from process.env
  // instead of this schema, because this file calls process.exit(1) on a
  // missing variable and that would kill the Better Auth CLI mid-generation.
  // The values are validated here anyway so the server fails fast with a
  // readable message rather than a Better Auth stack trace.
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:5000"),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().default("http://localhost:3000"),
  SESSION_EXPIRES_IN: z.coerce.number().int().positive().default(604800),
  SESSION_UPDATE_AGE: z.coerce.number().int().positive().default(86400),

  // CORS (Masud)
  CLIENT_URL: z.string().default("http://localhost:3000"),

  // Cloudinary — profile picture upload (Masud)
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

  // AI provider (Irfan)
  AI_PROVIDER: z.enum(["gemini", "openai", "openrouter", "groq", "claude"]).default("gemini"),
  AI_API_KEY: z.string().default(""),
  AI_MODEL: z.string().default("gemini-2.0-flash"),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),

  // External APIs (Irfan)
  // Empty WEATHER_API_KEY is allowed on purpose: the weather service falls
  // back to clearly-flagged sample data in development when the key is
  // missing or rejected, per the assignment's testing-fallback rule.
  WEATHER_API_KEY: z.string().default(""),
  MARKET_API_KEY: z.string().default(""),

  // Seed data (Sondip)
  SEED_ADMIN_EMAIL: z.string().email().default("admin@agromate.dev"),
  SEED_ADMIN_PASSWORD: z.string().min(8).default("Admin@12345"),
  SEED_EXPERT_EMAIL: z.string().email().default("expert@agromate.dev"),
  SEED_EXPERT_PASSWORD: z.string().min(8).default("Expert@12345"),
  SEED_FARMER_EMAIL: z.string().email().default("farmer@agromate.dev"),
  SEED_FARMER_PASSWORD: z.string().min(8).default("Farmer@12345"),

  // One-click demo logins on the login pages. Credentials stay on the server; a role whose
  // phone or password is empty gets no button. Expert and admin fall back to the seeded accounts.
  DEMO_FARMER_PHONE: z.string().default(""),
  DEMO_FARMER_PASSWORD: z.string().default(""),
  DEMO_EXPERT_PHONE: z.string().default(""),
  DEMO_EXPERT_PASSWORD: z.string().default(""),
  DEMO_ADMIN_PHONE: z.string().default(""),
  DEMO_ADMIN_PASSWORD: z.string().default(""),
});

type Env = z.infer<typeof envSchema>;

function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");

    // eslint-disable-next-line no-console
    console.error(`\nInvalid environment configuration:\n${details}\n`);
    process.exit(1);
  }

  return result.data;
}

export const env = parseEnv(process.env);

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";