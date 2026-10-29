-- UPI QR payment fallback, used while the Razorpay integration is pending.
-- Mirrors Prisma's generated DDL for this schema change.

-- AlterTable: UPI payments have no Razorpay order id, so the column becomes nullable.
ALTER TABLE "Payment" ALTER COLUMN "razorpayOrderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "method" TEXT NOT NULL DEFAULT 'RAZORPAY',
ADD COLUMN     "payerNote" TEXT,
ADD COLUMN     "payerUtr" TEXT,
ADD COLUMN     "proofUrl" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "upiPayeeName" TEXT,
ADD COLUMN     "upiPayeeVpa" TEXT,
ADD COLUMN     "upiRef" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT;

-- "updatedAt" is maintained by the Prisma client, not the database. The default
-- above only exists so the NOT NULL add succeeds on rows that already exist;
-- dropping it here keeps the column identical to the schema.
ALTER TABLE "Payment" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_upiRef_key" ON "Payment"("upiRef");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");
