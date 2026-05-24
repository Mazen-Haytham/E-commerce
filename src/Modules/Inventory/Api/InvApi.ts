import { addProductVariantInInventoryInput, getProductVariantStockFromInventoryResponse } from "../types/types.js";
import { PrismaClient } from "@prisma/client/extension";
export interface InventoryApi {
  addProductVariantInInventory(
    addProductVariantInInventoryInput: addProductVariantInInventoryInput[],
    tx:PrismaClient
  ): Promise<addProductVariantInInventoryInput[]>;
  getProductVariantStock(variantId:string):Promise<getProductVariantStockFromInventoryResponse[]>;
}
