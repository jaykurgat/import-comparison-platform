-- Commerce payment state for import orders.
CREATE TYPE "ImportPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE');

ALTER TYPE "ImportOrderStatus" RENAME TO "ImportOrderStatus_old";

CREATE TYPE "ImportOrderStatus" AS ENUM (
  'PAYMENT_PENDING',
  'PAID',
  'SUBMITTING',
  'SUBMITTED',
  'FAILED',
  'CANCELLED'
);

ALTER TABLE "ImportOrder"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ImportOrderStatus"
    USING (
      CASE "status"::text
        WHEN 'READY' THEN 'PAYMENT_PENDING'
        WHEN 'SUBMITTED' THEN 'SUBMITTED'
        WHEN 'FAILED' THEN 'FAILED'
        ELSE 'PAYMENT_PENDING'
      END
    )::"ImportOrderStatus";

ALTER TABLE "ImportOrder"
  ALTER COLUMN "status" SET DEFAULT 'PAYMENT_PENDING';

DROP TYPE "ImportOrderStatus_old";

CREATE TABLE "ImportPayment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL DEFAULT 'STRIPE',
  "status" "ImportPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "checkoutSessionId" TEXT NOT NULL,
  "paymentIntentId" TEXT,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'KES',
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ImportPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ImportPayment_orderId_key" ON "ImportPayment"("orderId");
CREATE UNIQUE INDEX "ImportPayment_checkoutSessionId_key" ON "ImportPayment"("checkoutSessionId");
CREATE INDEX "ImportPayment_status_createdAt_idx" ON "ImportPayment"("status", "createdAt");

ALTER TABLE "ImportPayment"
  ADD CONSTRAINT "ImportPayment_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "ImportOrder"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
