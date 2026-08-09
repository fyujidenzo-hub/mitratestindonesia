-- Persistent notification inboxes and standards-based Web Push subscriptions.
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" VARCHAR(60) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "entityType" VARCHAR(80),
    "entityId" VARCHAR(191),
    "dedupeKey" VARCHAR(255) NOT NULL,
    "readAt" TIMESTAMP(3),
    "clearedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" VARCHAR(2048) NOT NULL,
    "p256dh" VARCHAR(255) NOT NULL,
    "auth" VARCHAR(255) NOT NULL,
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushConfiguration" (
    "id" VARCHAR(32) NOT NULL DEFAULT 'primary',
    "publicKey" VARCHAR(255) NOT NULL,
    "privateKey" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notification_recipientId_dedupeKey_key" ON "Notification"("recipientId", "dedupeKey");
CREATE INDEX "Notification_recipientId_clearedAt_createdAt_idx" ON "Notification"("recipientId", "clearedAt", "createdAt");
CREATE INDEX "Notification_recipientId_readAt_clearedAt_idx" ON "Notification"("recipientId", "readAt", "clearedAt");
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
