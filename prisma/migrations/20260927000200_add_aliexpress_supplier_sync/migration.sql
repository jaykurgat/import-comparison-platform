-- Track the last successful supplier refresh for each AliExpress SKU.
ALTER TABLE "AliExpressSKU" ADD COLUMN "lastSupplierSyncAt" TIMESTAMP(3);

CREATE INDEX "AliExpressSKU_lastSupplierSyncAt_idx" ON "AliExpressSKU"("lastSupplierSyncAt");
