/*
  Warnings:

  - The primary key for the `Role` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Role` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `roleId` on the `UserRole` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "users"."UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";

-- AlterTable
ALTER TABLE "users"."Role" DROP CONSTRAINT "Role_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Role_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users"."UserRole" DROP COLUMN "roleId",
ADD COLUMN     "roleId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "users"."UserRole"("userId", "roleId");

-- AddForeignKey
ALTER TABLE "users"."UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "users"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
