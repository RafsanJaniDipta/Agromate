import { createServer } from "node:http";

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";

/**
 * Process entrypoint (Masud — Day 1).
 *
 * Verifies the database is reachable before binding the port, so a bad
 * DATABASE_URL fails immediately and loudly instead of on the first query.
 */

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
    console.log("[db] connected");
  } catch (error) {
    console.error("[db] connection failed — check DATABASE_URL in your .env");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const app = createApp();
  const server = createServer(app);

  server.listen(env.PORT, () => {
    console.log(`[api] AgroMate server listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    console.log(`[api] ${signal} received, shutting down`);
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
    // Don't hang forever if a connection refuses to drain.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    console.error("[api] unhandled rejection:", reason);
  });
}

void bootstrap();