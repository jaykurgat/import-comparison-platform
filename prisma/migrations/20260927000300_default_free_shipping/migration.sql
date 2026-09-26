-- Missing shipping data is treated as free shipping.
-- A current positive Kenya freight quote remains authoritative at read/reprice time.
ALTER TABLE "ImportListingPrice"
  ALTER COLUMN "freeShipping" SET DEFAULT true;

UPDATE "ImportListingPrice" ilp
SET "freeShipping" = NOT EXISTS (
  SELECT 1
  FROM "FreightSnapshot" fs
  WHERE fs."aliExpressSkuId" = ilp."aliExpressSkuId"
    AND fs."destination" = 'KE'
    AND fs."freightCost" > 0
);
