import { InventoryApi } from "./InvApi.js";
import { InventoryService } from "../service/inventoryService.js";
import { addProductVariantInInventoryInput } from "../types/types.js";
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
}
