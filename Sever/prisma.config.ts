// Required even on Bun: `bunx prisma` spawns the CLI as a child process, which
// does NOT inherit Bun's automatic .env loading (only `bun run` scripts do).
// Without this, migrate fails with "Connection url is empty".
import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma CLI configuration (Prisma 7).
 *
 * The CLI resolves every path below relative to this file, so all commands
 * must be run from the project root (`Sever/`).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Neon pooled connection string. `process.env` rather than `env()` so that
    // `prisma generate` still works in CI where DATABASE_URL may be absent.
    url: process.env.DATABASE_URL ?? "",
  },
});