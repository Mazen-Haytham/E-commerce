/*
  Warnings:

  - Made the column `userId` on table `Cart` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "users"."Cart" DROP CONSTRAINT "Cart_userId_fkey";

-- AlterTable
ALTER TABLE "users"."Cart" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "users"."Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
