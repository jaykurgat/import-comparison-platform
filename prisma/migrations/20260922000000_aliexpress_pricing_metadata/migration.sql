-- Add the AliExpress pricing layers required by the DS product API.
ALTER TABLE "AliExpressSKU"
  ADD COLUMN "skuPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "offerSalePrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "priceIncludeTax" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "skuCode" TEXT;

ALTER TABLE "AliExpressSKU"
  ADD COLUMN "rawCategoryId" TEXT,
  ADD COLUMN "shipFromCountry" TEXT;
