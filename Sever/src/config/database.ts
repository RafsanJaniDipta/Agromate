import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

import { env, isProduction } from "./env.js";

/**
 * Single shared Prisma client (Sondip).
 *
 * Prisma 7 requires an explicit driver adapter — `new PrismaClient()` with no
 * options cannot open a Postgres connection. PrismaPg wraps the pg driver and
 * takes the same pooled connection string as DATABASE_URL.
 *
 * One instance per process: creating a client per request exhausts the
 * connection pool. In development it is cached on globalThis so hot reloads
 * don't leak a pool on every file save.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

  return new PrismaClient({
    adapter,
    log: isProduction ? ["warn", "error"] : ["warn", "error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}

/** Fails fast at boot if the database is unreachable (server.ts calls this). */
export async function connectDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}

/** "agromate @ localhost:5432" — name and host only, never the credentials. */
export function describeDatabase(): string {
  try {
    const url = new URL(env.DATABASE_URL);
    return `${url.pathname.slice(1)} @ ${url.host}`;
  } catch {
    return "database";
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}