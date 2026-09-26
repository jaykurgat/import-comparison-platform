-- Keep the persisted storefront shipping flag aligned with the canonical
-- Kenya freight snapshots. A positive shipping quote means paid shipping;
-- otherwise there is no shipping cost to display, so the product is free shipping.
UPDATE "ImportListingPrice" ilp
SET "freeShipping" = NOT EXISTS (
  SELECT 1
  FROM "FreightSnapshot" fs
  WHERE fs."aliExpressSkuId" = ilp."aliExpressSkuId"
    AND fs."destination" = 'KE'
    AND fs."freightCost" > 0
);
