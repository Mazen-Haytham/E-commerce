-- CreateTable
CREATE TABLE "inventory"."Inventory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."ProductStock" (
    "productVariantId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "stockLevel" INTEGER NOT NULL DEFAULT 0,
    "restockAlert" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStock_pkey" PRIMARY KEY ("productVariantId","inventoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_name_location_key" ON "inventory"."Inventory"("name", "location");

-- AddForeignKey
ALTER TABLE "inventory"."ProductStock" ADD CONSTRAINT "ProductStock_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"."Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
