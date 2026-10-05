# AgroMate Backend

## Local setup

1. Install dependencies:
   ```bash
   bun install
   ```
2. Copy `.env.example` to `.env` and configure `DATABASE_URL` and a
   `BETTER_AUTH_SECRET` with at least 32 characters. For local development,
   keep the Better Auth and client URLs at `http://localhost:5000` and
   `http://localhost:3000`.
3. Generate the Prisma client:
   ```bash
   bun run db:generate
   ```
4. Apply migrations to your development database if they have not already been
   applied:
   ```bash
   bun run db:migrate
   ```
5. Start the AgroMate API:
   ```bash
   bun run dev
   ```

The `start` and `dev` scripts run `src/server.ts`, which connects to PostgreSQL
and starts the configured API. Authentication uses Better Auth email/password
with HTTP-only session cookies. Email verification is currently disabled.

See [POSTMAN_TESTING_GUIDE.md](./POSTMAN_TESTING_GUIDE.md) for auth and API test
instructions.
