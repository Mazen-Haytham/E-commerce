import { InventoryApi } from "./InvApi.js";
import { InventoryService } from "../service/inventoryService.js";
import {
  addProductVariantInInventoryInput,
  getProductVariantStockFromInventoryResponse,
} from "../types/types.js";
export class InventoryApiImp implements InventoryApi {
  constructor(private readonly inventoryService: InventoryService) {}
  addProductVariantInInventory = async (
    addProductVariantInInventoryInput: addProductVariantInInventoryInput[],
  ): Promise<addProductVariantInInventoryInput[]> => {
    const productStock: addProductVariantInInventoryInput[] =
      await this.inventoryService.addProductVariantInInventory(
        addProductVariantInInventoryInput,
      );
    return productStock;
  };
  getProductVariantStock(
    variantId: string,
  ): Promise<getProductVariantStockFromInventoryResponse[]> {
    const stocks = this.inventoryService.getProductVariantStock(variantId);
    return stocks;
  }
}
