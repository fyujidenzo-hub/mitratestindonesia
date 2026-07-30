ALTER TABLE "Transaction"
ADD COLUMN "description" TEXT;

UPDATE "Transaction"
SET "description" = "senderName"
WHERE "type" = 'REWARD'
  AND "description" IS NULL
  AND "senderName" IS NOT NULL;
