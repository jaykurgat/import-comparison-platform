-- Switch the provisional payment provider from Stripe to Safaricom Daraja/M-PESA.
ALTER TYPE "PaymentProvider" RENAME TO "PaymentProvider_old";

CREATE TYPE "PaymentProvider" AS ENUM ('DARAJA');

ALTER TABLE "ImportPayment"
  ALTER COLUMN "provider" DROP DEFAULT;

ALTER TABLE "ImportPayment"
  ALTER COLUMN "provider" TYPE "PaymentProvider"
  USING 'DARAJA'::"PaymentProvider";

ALTER TABLE "ImportPayment"
  ALTER COLUMN "provider" SET DEFAULT 'DARAJA';

DROP TYPE "PaymentProvider_old";

ALTER TABLE "ImportPayment"
  RENAME COLUMN "checkoutSessionId" TO "checkoutRequestId";

ALTER TABLE "ImportPayment"
  RENAME COLUMN "paymentIntentId" TO "merchantRequestId";

ALTER TABLE "ImportPayment"
  ADD COLUMN "mpesaReceiptNumber" TEXT;
