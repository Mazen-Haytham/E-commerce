-- DropIndex
DROP INDEX "users"."User_email_key";

-- CreateIndex
CREATE INDEX "idx_products_pagination" ON "catalog"."Product"("createdAt" DESC, "id" DESC) WHERE ("deletedAt" IS NULL);
