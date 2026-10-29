-- Add signature audit metadata columns to Booking.
-- The signature images themselves stay in pickupSignatures / returnSignatures,
-- now wrapped in an evidence envelope (signedAt, ip, userAgent, tamper hash).
ALTER TABLE "Booking" ADD COLUMN "pickupSignatureMeta" TEXT;
ALTER TABLE "Booking" ADD COLUMN "returnSignatureMeta" TEXT;
