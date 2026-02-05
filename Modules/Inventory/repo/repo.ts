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
  updateInventory(inventoryId :string,input: updateInventoryInput): Promise<Inventory>;
  updateProductStockLevel(
    input: updateProductVariantStockLevel,
  ): Promise<updateProductVariantStockLevel>;
  deactivateInventory(inventoryId: string): Promise<Inventory>;
  addInventory(input: AddInventoryInput): Promise<AddInventoryResponse>;
  addProductVariantInInventoryInput(
    input: addProductVariantInInventoryInput,
  ): Promise<addProductVariantInInventoryInput>;
}
