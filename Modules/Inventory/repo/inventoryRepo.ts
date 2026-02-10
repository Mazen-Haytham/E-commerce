import { PrismaClient } from "@prisma/client/extension";
import {
  AddInventoryInput,
  AddInventoryResponse,
  addProductVariantInInventoryInput,
  findInventoryByNameAndLocationInput,
  findInventoryByNameAndLocationResponse,
  getProductVariantStockFromInventoryInput,
  getProductVariantStockFromInventoryResponse,
  Inventory,
  updateInventoryInput,
  updateProductVariantStockLevel,
} from "../types/types.js";
import { Repo } from "./repo.js";

export class PrismaInventory implements Repo {
  async getAllInventories(
    db: PrismaClient,
    data?: findInventoryByNameAndLocationInput,
  ): Promise<Inventory[]> {
    const inventories: Inventory[] = await db.inventory.findMany({
      where: {
        deletedAt: null,
        name: data?.name
          ? { contains: data.name.trim(), mode: "insensitive" }
          : undefined,
        location: data?.location
          ? { contains: data.location.trim(), mode: "insensitive" }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        location: true,
        deletedAt: true,
      },
    });
    return inventories;
  }
  async findInventoryById(
    id: string,
    db: PrismaClient,
  ): Promise<Inventory | null> {
    const Inventories = await db.inventory.findUnique({
      where: { id: id, deletedAt: null },
      select: { id: true, name: true, location: true, deletedAt: true },
    });
    return Inventories;
  }
  async addInventory(
    input: AddInventoryInput,
    db: PrismaClient,
  ): Promise<AddInventoryResponse> {
    const inventory: AddInventoryResponse = await db.inventory.create({
      data: input,
    });
    return inventory;
  }
  async deactivateInventory(
    inventoryId: string,
    db: PrismaClient,
  ): Promise<Inventory> {
    const inventory: Inventory = await db.inventory.update({
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
    db: PrismaClient,
  ): Promise<Inventory> {
    const dto: updateInventoryInput = {};
    dto.name = input.name ?? undefined;
    dto.location = input.location ?? undefined;
    const inventory: Inventory = await db.inventory.update({
      where: { id: inventoryId },
      data: dto,
    });
    return inventory;
  }
  async addProductVariantInInventoryInput(
    input: addProductVariantInInventoryInput,
    db: PrismaClient,
  ): Promise<addProductVariantInInventoryInput> {
    const productStock: addProductVariantInInventoryInput =
      await db.productStock.create({
        data: input,
      });
    return productStock;
  }
  async updateProductStockLevel(
    input: updateProductVariantStockLevel,
    db: PrismaClient,
  ): Promise<updateProductVariantStockLevel> {
    const productStock: updateProductVariantStockLevel =
      await db.productStock.update({
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
  async getProductVariantFromInventory(
    input: getProductVariantStockFromInventoryInput,
    db: PrismaClient,
  ): Promise<getProductVariantStockFromInventoryResponse | null> {
    const stockLevel: getProductVariantStockFromInventoryResponse | null =
      await db.productStock.findUnique({
        where: {
          productVariantId_inventoryId: {
            productVariantId: input.productVariantId,
            inventoryId: input.inventoryId,
          },
        },
        select: {
          productVariantId: true,
          inventoryId: true,
          stockLevel: true,
          inventory: {
            select: {
              location: true,
            },
          },
        },
      });
    return stockLevel;
  }
  async findInventoryByNameAndLocation(
    input: findInventoryByNameAndLocationInput,
    db: PrismaClient,
  ): Promise<findInventoryByNameAndLocationResponse | null> {
    const inv: findInventoryByNameAndLocationResponse | null =
      await db.inventory.findFirst({
        where: {
          name: { contains: input.name.trim(), mode: "insensitive" },
          location: { contains: input.location.trim(), mode: "insensitive" },
          deletedAt: null,
        },
        select: {
          name: true,
          location: true,
          id: true,
        },
      });
    return inv;
  }
}
