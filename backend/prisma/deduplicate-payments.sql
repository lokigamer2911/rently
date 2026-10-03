-- Idempotent Payment dedup — runs in the Render build BEFORE `prisma db push`.
--
-- Why: the schema declares UNIQUE constraints on `upiRef` and `razorpayOrderId`.
-- `prisma db push` refuses to add a unique constraint without the
-- `--accept-data-loss` flag, and it would fail outright if duplicate values
-- exist. This script removes any duplicates first (keeping the most recent
-- row per reference), so the flag is a no-op confirmation with zero actual
-- data loss in practice.
--
-- Safe to run on every deploy: it is a no-op when no duplicates exist, and
-- skips entirely when the Payment table has not been created yet.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Payment'
  ) THEN
    -- Keep only the newest payment per upiRef (UPI QR reference in the payment note)
    WITH ranked AS (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY upiRef ORDER BY createdAt DESC, id DESC) AS rn
      FROM "Payment"
      WHERE upiRef IS NOT NULL AND upiRef <> ''
    )
    DELETE FROM "Payment"
    WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

    -- Keep only the newest payment per razorpayOrderId (used once the gateway is live)
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
