-- Farmer ↔ expert and expert ↔ admin chat.
-- The shared database already has these tables (created before this migration existed),
-- so every statement checks first and running it there changes nothing.

CREATE TABLE IF NOT EXISTS "chat_conversation" (
    "id" UUID NOT NULL,
    "participantOneId" UUID NOT NULL,
    "participantTwoId" UUID NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chat_conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chat_message" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "chat_conversation_participantOneId_idx" ON "chat_conversation"("participantOneId");
CREATE INDEX IF NOT EXISTS "chat_conversation_participantTwoId_idx" ON "chat_conversation"("participantTwoId");
CREATE UNIQUE INDEX IF NOT EXISTS "chat_conversation_participantOneId_participantTwoId_key" ON "chat_conversation"("participantOneId", "participantTwoId");
CREATE INDEX IF NOT EXISTS "chat_message_conversationId_idx" ON "chat_message"("conversationId");
CREATE INDEX IF NOT EXISTS "chat_message_senderId_idx" ON "chat_message"("senderId");

-- Postgres has no "ADD CONSTRAINT IF NOT EXISTS"; an existing key is skipped instead
DO $$ BEGIN
  ALTER TABLE "chat_conversation" ADD CONSTRAINT "chat_conversation_participantOneId_fkey" FOREIGN KEY ("participantOneId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "chat_conversation" ADD CONSTRAINT "chat_conversation_participantTwoId_fkey" FOREIGN KEY ("participantTwoId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
