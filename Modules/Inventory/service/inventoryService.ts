import { AppError } from "../../../src/utils/AppError.js";
import { Repo } from "../repo/repo.js";
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
import { prisma } from "../../../src/shared/prisma.js";
import { PrismaClient } from "@prisma/client/extension";
export class InventoryService {
  constructor(private readonly inventoryRepo: Repo) {}
  findInventoryByID = async (
    id: string,
    db = prisma,
  ): Promise<Inventory | null> => {
    const inv: Inventory | null = await this.inventoryRepo.findInventoryById(
      id,
      db,
    );
    return inv;
  };

  findInventoryByNameAndLocation = async (
    input: findInventoryByNameAndLocationInput,
    db = prisma,
  ): Promise<findInventoryByNameAndLocationResponse | null> => {
    const inv: findInventoryByNameAndLocationResponse | null =
      await this.inventoryRepo.findInventoryByNameAndLocation(input, db);
    return inv;
  };

  addInventory = async (
    input: AddInventoryInput,
    db = prisma,
  ): Promise<AddInventoryResponse> => {
    const inv: findInventoryByNameAndLocationResponse | null =
      await this.findInventoryByNameAndLocation(input);
    if (inv) throw new AppError("Inventory Already Exists", 409);
    const newInv: AddInventoryResponse = await this.inventoryRepo.addInventory(
      input,
      db,
    );
    return newInv;
  };

  deactivateInventory = async (
    inventoryId: string,
    db = prisma,
  ): Promise<Inventory> => {
    const inv: Inventory | null = await this.findInventoryByID(inventoryId);
    if (!inv)
      throw new AppError("There is No Inventory Exists With That Id", 400);
    const deactivatedInventory: Inventory =
      await this.inventoryRepo.deactivateInventory(inventoryId, db);
    return deactivatedInventory;
  };

  updateInventory = async (
    inventoryId: string,
    data: updateInventoryInput,
    db = prisma,
  ): Promise<Inventory> => {
    const inv: Inventory | null = await this.findInventoryByID(inventoryId);
    if (!inv)
      throw new AppError("There is No Inventory Exists With That Id", 400);
    const dto: updateInventoryInput = {};
    if (data.location) {
      if (data.location === inv.location)
        throw new AppError("That Location Already Exists", 409);
      dto.location = data.location;
    }
    if (data.name) {
      if (data.name === inv.name)
        throw new AppError("That Name Already Exists", 409);
      dto.name = data.name;
    }
    const updatedInventory: Inventory =
      await this.inventoryRepo.updateInventory(inventoryId, dto, db);
    return updatedInventory;
  };

  getProductVariantFromInventory = async (
    input: getProductVariantStockFromInventoryInput,
    db = prisma,
  ): Promise<getProductVariantStockFromInventoryResponse | null> => {
    const stock: getProductVariantStockFromInventoryResponse | null =
      await this.inventoryRepo.getProductVariantFromInventory(input, db);
    return stock;
  };

  updateStockLevel = async (
    input: updateProductVariantStockLevel,
    db = prisma,
  ): Promise<updateProductVariantStockLevel> => {
    if (input.stockLevel === 0)
      throw new AppError(
        "You Must Enter A Number Greater Than or Smaller Than 0",
        400,
      );
    const ProductInventoryPK: getProductVariantStockFromInventoryInput = {
      productVariantId: input.productVariantId,
      inventoryId: input.inventoryId,
    };
    const productStock =
      await this.getProductVariantFromInventory(ProductInventoryPK);
    if (!productStock)
      throw new AppError(
        "There Is No Product Variant With That Id in The Inventory",
        400,
      );
    if (input.stockLevel < 0) {
      if (productStock.stockLevel - input.stockLevel < 0)
        throw new AppError(
          "Enter A Number Smalller Than or Eqauls to Stock Level ",
          400,
        );
    }
    const updatedProduct: updateProductVariantStockLevel =
      await this.inventoryRepo.updateProductStockLevel(input, db);
    return updatedProduct;
  };

  addProductVariantInInventory = async (
    input: addProductVariantInInventoryInput[],
  ): Promise<addProductVariantInInventoryInput[]> => {
    return await prisma.$transaction(async (tx) => {
      const success: addProductVariantInInventoryInput[] = [];

      for (const productStock of input) {
        const inv: Inventory | null = await this.findInventoryByID(
          productStock.inventoryId,
          tx as PrismaClient,
        );
        if (!inv) {
          throw new AppError("There is No Inventory With That Id", 400);
        }

        const newProductStock =
          await this.inventoryRepo.addProductVariantInInventoryInput(
            productStock,
            tx as PrismaClient,
          );

        success.push(newProductStock);
      }

      return success;
    });
  };
}
