ALTER TABLE "ImportListingPrice"
ADD COLUMN "freeShipping" BOOLEAN NOT NULL DEFAULT false;

UPDATE "ImportListingPrice" AS p
SET "freeShipping" = (f."freightCost" = 0)
FROM "FreightSnapshot" AS f
WHERE f."aliExpressSkuId" = p."aliExpressSkuId"
  AND f."destination" = 'KE'
  AND f."recordedAt" = (
    SELECT MAX(f2."recordedAt")
    FROM "FreightSnapshot" AS f2
    WHERE f2."aliExpressSkuId" = p."aliExpressSkuId"
      AND f2."destination" = 'KE'
  );
