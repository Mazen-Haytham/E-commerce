import { addProductVariantInInventoryInput } from "../types/types.js";
export interface InventoryApi {
  addProductVariantInInventory(
    addProductVariantInInventoryInput: addProductVariantInInventoryInput[],
  ): Promise<addProductVariantInInventoryInput[]>;
}
