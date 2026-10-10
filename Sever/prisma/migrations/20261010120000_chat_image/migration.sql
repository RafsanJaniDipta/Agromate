-- A photo sent in a chat message; the text may then be empty
ALTER TABLE "chat_message" ADD COLUMN "imageUrl" TEXT;
