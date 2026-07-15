import {
  addProductVariantInInventoryInput,
  getProductVariantStockFromInventoryResponse,
  updateProductVariantStockLevel,
} from "../types/types.js";
import { PrismaClient } from "../../../generated/inventory-prisma/index.js";

export interface OrderItemForInventory {
  productVariantId: string;
  quantity: number;
}

export interface InventoryApi {
  addProductVariantInInventory(
    addProductVariantInInventoryInput: addProductVariantInInventoryInput[],
    tx: PrismaClient,
  ): Promise<addProductVariantInInventoryInput[]>;
  getProductVariantStock(variantId: string): Promise<number>;
  getProductVariantStockWithLock(
    variantId: string,
    tx: PrismaClient,
  ): Promise<number>;
  updateStockLevel(
    input: updateProductVariantStockLevel,
    tx: PrismaClient,
  ): Promise<updateProductVariantStockLevel>;
  getProductVariantStocksForDecrement(
    variantId: string,
    tx: PrismaClient,
  ): Promise<addProductVariantInInventoryInput[]>;
  decrementStockForOrderItems(
    items: OrderItemForInventory[],
    tx: PrismaClient,
  ): Promise<void>;
  incrementStockForOrderItems(
    items: OrderItemForInventory[],
    tx: PrismaClient,
  ): Promise<void>;
}
