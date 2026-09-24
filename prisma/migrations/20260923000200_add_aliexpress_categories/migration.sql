-- Store the supplier-native AliExpress category tree independently from the internal
-- canonical matching taxonomy.

CREATE TABLE "AliExpressCategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "names" JSONB,
    "level" INTEGER,
    "isLeaf" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AliExpressCategory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AliExpressSKU"
ADD COLUMN "aliExpressCategoryId" TEXT;

CREATE UNIQUE INDEX "AliExpressCategory_categoryId_key"
ON "AliExpressCategory"("categoryId");

CREATE INDEX "AliExpressCategory_parentId_idx"
ON "AliExpressCategory"("parentId");

CREATE INDEX "AliExpressCategory_name_idx"
ON "AliExpressCategory"("name");

CREATE INDEX "AliExpressSKU_aliExpressCategoryId_idx"
ON "AliExpressSKU"("aliExpressCategoryId");

ALTER TABLE "AliExpressCategory"
ADD CONSTRAINT "AliExpressCategory_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "AliExpressCategory"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AliExpressSKU"
ADD CONSTRAINT "AliExpressSKU_aliExpressCategoryId_fkey"
FOREIGN KEY ("aliExpressCategoryId") REFERENCES "AliExpressCategory"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
