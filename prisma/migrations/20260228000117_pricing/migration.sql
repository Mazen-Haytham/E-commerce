-- CreateTable
CREATE TABLE "catalog"."Pricing" (
    "id" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" DECIMAL(65,30) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "productId" TEXT,
    "productVariantId" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pricing_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "catalog"."Pricing" ADD CONSTRAINT "Pricing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "catalog"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."Pricing" ADD CONSTRAINT "Pricing_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "catalog"."ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."Pricing" ADD CONSTRAINT "Pricing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "catalog"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
