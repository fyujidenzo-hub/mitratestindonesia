-- Add the new highest tier without replacing the existing PostgreSQL enum.
-- Keeping the legacy values makes this migration backward compatible with the
-- currently running service while Render performs its rolling deployment.
ALTER TYPE "UserLevel" ADD VALUE IF NOT EXISTS 'VVIP';

-- Consolidate legacy memberships into the three client-approved tiers.
-- STARTER is displayed as Classic by the application.
UPDATE "User" SET "level" = 'STARTER' WHERE "level" = 'SILVER';
UPDATE "User" SET "level" = 'VIP' WHERE "level" = 'GOLD';
