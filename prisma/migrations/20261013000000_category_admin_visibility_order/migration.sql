-- Make category visibility and display order editable from the admin workspace.
ALTER TABLE "Category"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT "id", (ROW_NUMBER() OVER (
    PARTITION BY "parentId" ORDER BY "name" ASC
  ) - 1) * 10 AS next_order
  FROM "Category"
)
UPDATE "Category" AS category
SET "sortOrder" = ranked.next_order
FROM ranked
WHERE category."id" = ranked."id";

CREATE INDEX "Category_parentId_sortOrder_idx" ON "Category"("parentId", "sortOrder");
