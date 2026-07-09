import { InventoryApi } from "./InvApi.js";
import { InventoryService } from "../service/inventoryService.js";
import { PrismaClient } from "@prisma/client/extension";
import {
  addProductVariantInInventoryInput,
  getProductVariantStockFromInventoryResponse,
  updateProductVariantStockLevel,
} from "../types/types.js";
export class InventoryApiImp implements InventoryApi {
  constructor(private readonly inventoryService: InventoryService) {}
  addProductVariantInInventory = async (
    addProductVariantInInventoryInput: addProductVariantInInventoryInput[],
    tx: PrismaClient,
  ): Promise<addProductVariantInInventoryInput[]> => {
    const productStock: addProductVariantInInventoryInput[] =
      await this.inventoryService.addProductVariantInInventory(
        addProductVariantInInventoryInput,
        tx,
      );
    return productStock;
  };
  getProductVariantStock(variantId: string): Promise<number> {
    const stocks =
      this.inventoryService.getTotalProductVariantStockLevel(variantId);
    return stocks;
  }

  getProductVariantStockWithLock = async (
    variantId: string,
    tx: PrismaClient,
  ): Promise<number> => {
    const stocks =
      await this.inventoryService.getTotalProductVariantStockLevelWithLock(
        variantId,
        tx,
      );
    return stocks;
  };

  updateStockLevel = async (
    input: updateProductVariantStockLevel,
    tx: PrismaClient,
  ): Promise<updateProductVariantStockLevel> => {
    const updatedStock = await this.inventoryService.updateStockLevel(
      input,
      tx,
    );
    return updatedStock;
  };

  getProductVariantStocksForDecrement = async (
    variantId: string,
    tx: PrismaClient,
  ): Promise<addProductVariantInInventoryInput[]> => {
    const stocks =
      await this.inventoryService.getProductVariantStocksForDecrement(
        variantId,
        tx,
      );
    return stocks;
  };

  decrementStockForOrderItems = async (
    items: Array<{ productVariantId: string; quantity: number }>,
    tx: PrismaClient,
  ): Promise<void> => {
    await this.inventoryService.decrementStockForOrderItems(items, tx);
  };

  incrementStockForOrderItems = async (
    items: Array<{ productVariantId: string; quantity: number }>,
    tx: PrismaClient,
  ): Promise<void> => {
    await this.inventoryService.incrementStockForOrderItems(items, tx);
  };
}
