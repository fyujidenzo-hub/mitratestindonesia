CREATE INDEX "User_referrerId_createdAt_idx"
ON "User" ("referrerId", "createdAt");

CREATE INDEX "User_role_createdAt_idx"
ON "User" ("role", "createdAt");

CREATE INDEX "Transaction_createdAt_idx"
ON "Transaction" ("createdAt");

CREATE INDEX "Order_userId_createdAt_id_idx"
ON "Order" ("userId", "createdAt", "id");

CREATE INDEX "Order_status_createdAt_idx"
ON "Order" ("status", "createdAt");

CREATE INDEX "Order_createdAt_idx"
ON "Order" ("createdAt");
