-- Rename updateAt to updatedAt in catalog.Category
ALTER TABLE "catalog"."Category" RENAME COLUMN "updateAt" TO "updatedAt";

-- Rename updateAt to updatedAt in inventory.Inventory
ALTER TABLE "inventory"."Inventory" RENAME COLUMN "updateAt" TO "updatedAt";

-- Rename updateAt to updatedAt in inventory.ProductStock
ALTER TABLE "inventory"."ProductStock" RENAME COLUMN "updateAt" TO "updatedAt";
