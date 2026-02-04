import {
  AddInventoryInput,
  AddInventoryResponse,
  addProductVariantInInventoryInput,
  findInventoryByIdResponse,
  Inventory,
  updateInventoryInput,
  updateProductVariantStockLevel,
} from "../types/types";
export interface Repo {
  findInventoryById(id: string): Promise<findInventoryByIdResponse | null>;
  updateInventory(inventoryId :string,input: updateInventoryInput): Promise<Inventory | null>;
  updateProductStockLevel(
    input: updateProductVariantStockLevel,
  ): Promise<updateProductVariantStockLevel | null>;
  deactivateInventory(inventoryId: string): Promise<Inventory | null>;
  addInventory(input: AddInventoryInput): Promise<AddInventoryResponse | null>;
  addProductVariantInInventoryInput(
    input: addProductVariantInInventoryInput,
  ): Promise<addProductVariantInInventoryInput | null>;
}
