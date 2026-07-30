ALTER TABLE "Bank"
ADD COLUMN "maximumDeposit" BIGINT NOT NULL DEFAULT 100000000;

UPDATE "Bank"
SET "active" = false
WHERE "active" = true
  AND "id" NOT IN (
    SELECT "id"
    FROM "Bank"
    WHERE "active" = true
    ORDER BY "updatedAt" DESC
    LIMIT 1
  );

CREATE UNIQUE INDEX "Bank_single_active_idx"
ON "Bank" ("active")
WHERE "active" = true;
