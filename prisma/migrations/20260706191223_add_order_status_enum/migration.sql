/*
  Warnings:

  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "orders"."OrderStatus" AS ENUM ('pending', 'confirmed', 'stock_rejected', 'cancelled');

-- AlterTable
ALTER TABLE "orders"."Order" DROP COLUMN "status",
ADD COLUMN     "status" "orders"."OrderStatus" NOT NULL DEFAULT 'pending';
