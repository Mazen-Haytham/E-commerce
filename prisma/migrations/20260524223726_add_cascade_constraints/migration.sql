-- DropForeignKey
ALTER TABLE "inventory"."ProductStock" DROP CONSTRAINT "ProductStock_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "inventory"."ProductStock" DROP CONSTRAINT "ProductStock_productVariantId_fkey";

-- AddForeignKey
ALTER TABLE "inventory"."ProductStock" ADD CONSTRAINT "ProductStock_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"."Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."ProductStock" ADD CONSTRAINT "ProductStock_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "catalog"."ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
