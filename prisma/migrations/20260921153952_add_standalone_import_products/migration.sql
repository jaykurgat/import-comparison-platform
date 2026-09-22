-- AlterTable
ALTER TABLE "AliExpressSKU" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ImportListingPrice" (
    "id" TEXT NOT NULL,
    "aliExpressSkuId" TEXT NOT NULL,
    "landedImportPrice" DECIMAL(12,2) NOT NULL,
    "sellPrice" DECIMAL(12,2) NOT NULL,
    "markup" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "priceDataAsOf" TIMESTAMP(3) NOT NULL,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportListingPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportListingPrice_aliExpressSkuId_key" ON "ImportListingPrice"("aliExpressSkuId");

-- AddForeignKey
ALTER TABLE "ImportListingPrice" ADD CONSTRAINT "ImportListingPrice_aliExpressSkuId_fkey" FOREIGN KEY ("aliExpressSkuId") REFERENCES "AliExpressSKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
