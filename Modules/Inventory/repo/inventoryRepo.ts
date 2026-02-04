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
  async addInventory(
    input: AddInventoryInput,
  ): Promise<AddInventoryResponse | null> {
    const inventory: AddInventoryResponse | null =
      await prisma.inventory.create({
        data: input,
      });
    return inventory;
  }
  async deactivateInventory(inventoryId: string): Promise<Inventory | null> {
    const inventory: Inventory | null = await prisma.inventory.update({
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
  ): Promise<Inventory | null> {
    const dto: updateInventoryInput = {};
    dto.name = input.name ?? undefined;
    dto.location = input.location ?? undefined;
    const inventory: Inventory | null = await prisma.inventory.update({
      where: { id: inventoryId },
      data: dto,
    });
    return inventory;
  }
  async addProductVariantInInventoryInput(
    input: addProductVariantInInventoryInput,
  ): Promise<addProductVariantInInventoryInput | null> {
    const productStock: addProductVariantInInventoryInput | null =
      await prisma.productStock.create({
        data: input
      });
    return productStock;
  }
  
}
