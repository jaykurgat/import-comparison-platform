-- Import checkout/order persistence
CREATE TYPE "ImportOrderStatus" AS ENUM ('READY', 'SUBMITTED', 'FAILED');

CREATE TABLE "ImportOrder" (
  "id" TEXT NOT NULL,
  "outOrderId" TEXT NOT NULL,
  "status" "ImportOrderStatus" NOT NULL DEFAULT 'READY',
  "country" TEXT NOT NULL,
  "province" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "address2" TEXT,
  "fullName" TEXT,
  "mobileNo" TEXT,
  "zip" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'KES',
  "customerTotal" DECIMAL(12,2) NOT NULL,
  "supplierOrderIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ImportOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ImportOrder_outOrderId_key" ON "ImportOrder"("outOrderId");
CREATE INDEX "ImportOrder_status_createdAt_idx" ON "ImportOrder"("status", "createdAt");

CREATE TABLE "ImportOrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "aliExpressSkuId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "skuId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitSellPrice" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ImportOrderItem_orderId_idx" ON "ImportOrderItem"("orderId");
CREATE INDEX "ImportOrderItem_aliExpressSkuId_idx" ON "ImportOrderItem"("aliExpressSkuId");

ALTER TABLE "ImportOrderItem"
  ADD CONSTRAINT "ImportOrderItem_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "ImportOrder"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
