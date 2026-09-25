ALTER TYPE "PaymentProvider" ADD VALUE 'PAYSTACK';

ALTER TABLE "ImportOrder"
  ADD COLUMN "email" TEXT;

ALTER TABLE "ImportPayment"
  ALTER COLUMN "checkoutRequestId" DROP NOT NULL;

ALTER TABLE "ImportPayment"
  ADD COLUMN "providerReference" TEXT;

CREATE UNIQUE INDEX "ImportPayment_providerReference_key"
  ON "ImportPayment"("providerReference");