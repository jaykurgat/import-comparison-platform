/*
  Warnings:

  - Made the column `sellPrice` on table `ComparisonResult` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ComparisonResult" ALTER COLUMN "sellPrice" SET NOT NULL;

-- AlterTable
ALTER TABLE "LocalSKU" ADD COLUMN     "featuredOverride" BOOLEAN;
