/*
  Warnings:

  - Added the required column `priceDataAsOf` to the `ComparisonResult` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CategorySourceType" AS ENUM ('ALIEXPRESS', 'JUMIA');

-- AlterTable
ALTER TABLE "AliExpressSKU" ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "ComparisonResult" ADD COLUMN     "isStale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceDataAsOf" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "LocalSKU" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryMapping" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "source" "CategorySourceType" NOT NULL,
    "sourceCategoryId" TEXT NOT NULL,
    "sourceCategoryName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "CategoryMapping_categoryId_idx" ON "CategoryMapping"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryMapping_source_sourceCategoryId_key" ON "CategoryMapping"("source", "sourceCategoryId");

-- CreateIndex
CREATE INDEX "AliExpressSKU_categoryId_idx" ON "AliExpressSKU"("categoryId");

-- CreateIndex
CREATE INDEX "LocalSKU_categoryId_idx" ON "LocalSKU"("categoryId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryMapping" ADD CONSTRAINT "CategoryMapping_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalSKU" ADD CONSTRAINT "LocalSKU_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AliExpressSKU" ADD CONSTRAINT "AliExpressSKU_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
