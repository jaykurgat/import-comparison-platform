/*
  Warnings:

  - Added the required column `sellPrice` to the `ComparisonResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ComparisonResult" ADD COLUMN "sellPrice" DECIMAL(12,2);
