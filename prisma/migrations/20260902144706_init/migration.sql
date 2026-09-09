-- CreateEnum
CREATE TYPE "LocalSourceType" AS ENUM ('JUMIA_SCRAPE', 'JUMIA_SELLER_API', 'MANUAL_CSV', 'SUPPLIER_FEED', 'OWN_DB');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('UNMATCHED', 'AUTO_MATCHED', 'NEEDS_REVIEW', 'MANUAL_CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ComparisonRenderMode" AS ENUM ('IMPORT_ADVANTAGE', 'LOCAL_ONLY');

-- CreateTable
CREATE TABLE "LocalListingRaw" (
    "id" TEXT NOT NULL,
    "source" "LocalSourceType" NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrls" TEXT[],
    "priceRaw" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "inStock" BOOLEAN,
    "attributesRaw" JSONB,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "localSkuId" TEXT,

    CONSTRAINT "LocalListingRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalSKU" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrls" TEXT[],
    "color" TEXT,
    "size" TEXT,
    "specs" JSONB,
    "currentPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocalSKU_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalPriceSnapshot" (
    "id" TEXT NOT NULL,
    "localSkuId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "inStock" BOOLEAN NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocalPriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AliExpressSKU" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrls" TEXT[],
    "color" TEXT,
    "size" TEXT,
    "specs" JSONB,
    "itemPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AliExpressSKU_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AliExpressPriceSnapshot" (
    "id" TEXT NOT NULL,
    "aliExpressSkuId" TEXT NOT NULL,
    "itemPrice" DECIMAL(12,2) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AliExpressPriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreightSnapshot" (
    "id" TEXT NOT NULL,
    "aliExpressSkuId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "freightCost" DECIMAL(12,2) NOT NULL,
    "estimatedTaxes" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "etaMinDays" INTEGER NOT NULL,
    "etaMaxDays" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreightSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SKUMatch" (
    "id" TEXT NOT NULL,
    "localSkuId" TEXT NOT NULL,
    "aliExpressSkuId" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'UNMATCHED',
    "matchSignal" TEXT,
    "confidenceNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SKUMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonResult" (
    "id" TEXT NOT NULL,
    "skuMatchId" TEXT NOT NULL,
    "landedImportPrice" DECIMAL(12,2) NOT NULL,
    "localTotalPrice" DECIMAL(12,2) NOT NULL,
    "renderMode" "ComparisonRenderMode" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparisonResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LocalListingRaw_source_sourceRef_idx" ON "LocalListingRaw"("source", "sourceRef");

-- CreateIndex
CREATE INDEX "LocalListingRaw_localSkuId_idx" ON "LocalListingRaw"("localSkuId");

-- CreateIndex
CREATE INDEX "LocalListingRaw_ingestedAt_idx" ON "LocalListingRaw"("ingestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LocalSKU_sku_key" ON "LocalSKU"("sku");

-- CreateIndex
CREATE INDEX "LocalSKU_color_size_idx" ON "LocalSKU"("color", "size");

-- CreateIndex
CREATE INDEX "LocalPriceSnapshot_localSkuId_recordedAt_idx" ON "LocalPriceSnapshot"("localSkuId", "recordedAt");

-- CreateIndex
CREATE INDEX "AliExpressSKU_productId_idx" ON "AliExpressSKU"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "AliExpressSKU_productId_skuId_key" ON "AliExpressSKU"("productId", "skuId");

-- CreateIndex
CREATE INDEX "AliExpressPriceSnapshot_aliExpressSkuId_recordedAt_idx" ON "AliExpressPriceSnapshot"("aliExpressSkuId", "recordedAt");

-- CreateIndex
CREATE INDEX "FreightSnapshot_aliExpressSkuId_destination_recordedAt_idx" ON "FreightSnapshot"("aliExpressSkuId", "destination", "recordedAt");

-- CreateIndex
CREATE INDEX "SKUMatch_status_idx" ON "SKUMatch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SKUMatch_localSkuId_aliExpressSkuId_key" ON "SKUMatch"("localSkuId", "aliExpressSkuId");

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonResult_skuMatchId_key" ON "ComparisonResult"("skuMatchId");

-- CreateIndex
CREATE INDEX "ComparisonResult_renderMode_idx" ON "ComparisonResult"("renderMode");

-- AddForeignKey
ALTER TABLE "LocalListingRaw" ADD CONSTRAINT "LocalListingRaw_localSkuId_fkey" FOREIGN KEY ("localSkuId") REFERENCES "LocalSKU"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalPriceSnapshot" ADD CONSTRAINT "LocalPriceSnapshot_localSkuId_fkey" FOREIGN KEY ("localSkuId") REFERENCES "LocalSKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AliExpressPriceSnapshot" ADD CONSTRAINT "AliExpressPriceSnapshot_aliExpressSkuId_fkey" FOREIGN KEY ("aliExpressSkuId") REFERENCES "AliExpressSKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreightSnapshot" ADD CONSTRAINT "FreightSnapshot_aliExpressSkuId_fkey" FOREIGN KEY ("aliExpressSkuId") REFERENCES "AliExpressSKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SKUMatch" ADD CONSTRAINT "SKUMatch_localSkuId_fkey" FOREIGN KEY ("localSkuId") REFERENCES "LocalSKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SKUMatch" ADD CONSTRAINT "SKUMatch_aliExpressSkuId_fkey" FOREIGN KEY ("aliExpressSkuId") REFERENCES "AliExpressSKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonResult" ADD CONSTRAINT "ComparisonResult_skuMatchId_fkey" FOREIGN KEY ("skuMatchId") REFERENCES "SKUMatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
