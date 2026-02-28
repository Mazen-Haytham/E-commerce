-- CreateTable
CREATE TABLE "catalog"."VariantImage" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VariantImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "catalog"."VariantImage" ADD CONSTRAINT "VariantImage_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "catalog"."ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
