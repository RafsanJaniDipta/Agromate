-- Ticket status was added to the database with `prisma db push`; this records it in migration history
-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'RESOLVED');

-- AlterTable
ALTER TABLE "support_ticket" ADD COLUMN "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN';
