import { addProductVariantInInventoryInput, getProductVariantStockFromInventoryResponse } from "../types/types.js";
export interface InventoryApi {
  addProductVariantInInventory(
    addProductVariantInInventoryInput: addProductVariantInInventoryInput[],
  ): Promise<addProductVariantInInventoryInput[]>;
  getProductVariantStock(variantId:string):Promise<getProductVariantStockFromInventoryResponse[]>;
}
