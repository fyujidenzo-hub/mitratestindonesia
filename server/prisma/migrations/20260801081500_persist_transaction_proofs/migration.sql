CREATE TABLE "TransactionProof" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionProof_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TransactionProof_transactionId_key"
ON "TransactionProof"("transactionId");

ALTER TABLE "TransactionProof"
ADD CONSTRAINT "TransactionProof_transactionId_fkey"
FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
