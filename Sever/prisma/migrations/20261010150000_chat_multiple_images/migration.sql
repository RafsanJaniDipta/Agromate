-- A chat message can carry several photos; existing single photos move into the list
ALTER TABLE "chat_message" ADD COLUMN "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "chat_message" SET "imageUrls" = ARRAY["imageUrl"] WHERE "imageUrl" IS NOT NULL;

ALTER TABLE "chat_message" DROP COLUMN "imageUrl";
