CREATE TABLE "HomepageHero" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL DEFAULT 'homepage',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "config" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HomepageHero_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HomepageHero_key_key" ON "HomepageHero"("key");
