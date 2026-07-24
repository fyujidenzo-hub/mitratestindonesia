-- User.phone is already protected by a unique B-tree index for exact lookups.
-- This pattern-ops index also lets PostgreSQL accelerate the prefix lookups
-- used by the real-time Admin and Super Admin member search.
CREATE INDEX IF NOT EXISTS "User_phone_prefix_idx"
ON "User" ("phone" text_pattern_ops);
