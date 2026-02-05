import {
  AddInventoryInput,
  AddInventoryResponse,
  addProductVariantInInventoryInput,
  findInventoryByIdResponse,
  Inventory,
  updateInventoryInput,
  updateProductVariantStockLevel,
} from "../types/types";
import { Repo } from "./repo";
import { prisma } from "../../../src/shared/prisma";
export class PrismaInventory implements Repo {
  async findInventoryById(
    id: string,
  ): Promise<findInventoryByIdResponse | null> {
    const Inventories: Inventory | null = await prisma.inventory.findUnique({
      where: { id: id, deletedAt: null },
    });
    return Inventories;
  }
  async addInventory(input: AddInventoryInput): Promise<AddInventoryResponse> {
    const inventory: AddInventoryResponse = await prisma.inventory.create({
      data: input,
    });
    return inventory;
  }
  async deactivateInventory(inventoryId: string): Promise<Inventory> {
    const inventory: Inventory = await prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        deletedAt: new Date(),
      },
    });
    return inventory;
  }
  async updateInventory(
    inventoryId: string,
    input: updateInventoryInput,
  ): Promise<Inventory> {
    const dto: updateInventoryInput = {};
    dto.name = input.name ?? undefined;
    dto.location = input.location ?? undefined;
    const inventory: Inventory = await prisma.inventory.update({
      where: { id: inventoryId },
      data: dto,
    });
    return inventory;
  }
  async addProductVariantInInventoryInput(
    input: addProductVariantInInventoryInput,
  ): Promise<addProductVariantInInventoryInput> {
    const productStock: addProductVariantInInventoryInput =
      await prisma.productStock.create({
        data: input,
      });
    return productStock;
  }
  async updateProductStockLevel(
    input: updateProductVariantStockLevel,
  ): Promise<updateProductVariantStockLevel> {
    const productStock: updateProductVariantStockLevel =
      await prisma.productStock.update({
        where: {
          productVariantId_inventoryId: {
            productVariantId: input.productVariantId,
            inventoryId: input.inventoryId,
          },
        },
        data: {
          stockLevel: {
            increment: input.stockLevel,
          },
        },
        select: {
          productVariantId: true,
          inventoryId: true,
          stockLevel: true,
        },
      });
    return productStock;
  }
}
