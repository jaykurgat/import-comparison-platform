CREATE TABLE "StorefrontAnnouncement" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL DEFAULT 'top-bar',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "message" TEXT NOT NULL,
  "showCouponPercentages" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StorefrontAnnouncement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StorefrontAnnouncement_key_key" ON "StorefrontAnnouncement"("key");
CREATE TABLE "Coupon" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT,
  "discountPercent" DECIMAL(5,2) NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "appliesToAll" BOOLEAN NOT NULL DEFAULT false,
  "productKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "categoryIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX "Coupon_enabled_startsAt_endsAt_idx" ON "Coupon"("enabled","startsAt","endsAt");
ALTER TABLE "ImportOrder" ADD COLUMN "couponId" TEXT, ADD COLUMN "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0, ADD COLUMN "couponDiscountPercent" DECIMAL(5,2);
CREATE INDEX "ImportOrder_couponId_idx" ON "ImportOrder"("couponId");
ALTER TABLE "ImportOrder" ADD CONSTRAINT "ImportOrder_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;