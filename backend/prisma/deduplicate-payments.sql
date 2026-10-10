-- Idempotent Payment dedup — run BEFORE a deploy that (re)applies the
-- UNIQUE constraint on `Payment.razorpayOrderId`.
--
-- Why: `prisma migrate deploy` fails outright if duplicate values exist for
-- a column gaining a unique constraint. This script removes duplicates first
-- (keeping the most recent row per order id), so the migration applies cleanly.
--
-- Safe to run on every deploy: it is a no-op when no duplicates exist, and
-- skips entirely when the Payment table has not been created yet. It only
-- deletes older duplicate rows — the newest row per order id is always kept.
--
-- Usage (manual, from repo root):
--   psql "$DATABASE_URL" -f backend/prisma/deduplicate-payments.sql
--
-- Optional: wire into the Render build command so it runs automatically:
--   cd backend && npm install && npx prisma generate \
--     && psql "$DATABASE_URL" -f prisma/deduplicate-payments.sql \
--     && npx prisma migrate deploy

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Payment'
  ) THEN
    -- Keep only the newest payment per razorpayOrderId
    WITH ranked AS (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY "razorpayOrderId" ORDER BY createdAt DESC, id DESC) AS rn
      FROM "Payment"
      WHERE "razorpayOrderId" IS NOT NULL AND "razorpayOrderId" <> ''
    )
    DELETE FROM "Payment"
    WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
  END IF;
END $$;
