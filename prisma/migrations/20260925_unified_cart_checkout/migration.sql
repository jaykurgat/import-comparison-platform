-- Unified cart checkout: allow order items to be fulfilled locally as well as by a supplier.
ALTER TABLE "ImportOrderItem"
  ALTER COLUMN "aliExpressSkuId" DROP NOT NULL;

ALTER TABLE "ImportOrderItem"
  ADD COLUMN "localSkuId" TEXT;

CREATE INDEX "ImportOrderItem_localSkuId_idx" ON "ImportOrderItem"("localSkuId");
CREATE INDEX "ImportOrderItem_productId_skuId_idx" ON "ImportOrderItem"("productId", "skuId");

ALTER TABLE "ImportOrderItem"
  ADD CONSTRAINT "ImportOrderItem_localSkuId_fkey"
  FOREIGN KEY ("localSkuId") REFERENCES "LocalSKU"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
