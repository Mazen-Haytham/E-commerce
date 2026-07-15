import { AppError } from "../../../utils/AppError.js";
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
import { inventoryPrisma } from "../../../shared/inventoryPrisma.js";
import { PrismaClient } from "../../../generated/inventory-prisma/index.js";
export class InventoryService {
  constructor(private readonly inventoryRepo: Repo) {}

  findInventoryByID = async (
    id: string,
    db = inventoryPrisma,
  ): Promise<Inventory | null> => {
    const inv: Inventory | null = await this.inventoryRepo.findInventoryById(
      id,
      db,
    );
    return inv;
  };

  findInventoryByNameAndLocation = async (
    input: findInventoryByNameAndLocationInput,
    db = inventoryPrisma,
  ): Promise<findInventoryByNameAndLocationResponse | null> => {
    const inv: findInventoryByNameAndLocationResponse | null =
      await this.inventoryRepo.findInventoryByNameAndLocation(input, db);
    return inv;
  };

  addInventory = async (
    input: AddInventoryInput,
    db = inventoryPrisma,
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
    db = inventoryPrisma,
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
    db = inventoryPrisma,
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
    db = inventoryPrisma,
  ): Promise<getProductVariantStockFromInventoryResponse | null> => {
    const stock: getProductVariantStockFromInventoryResponse | null =
      await this.inventoryRepo.getProductVariantFromInventory(input, db);
    return stock;
  };

  updateStockLevel = async (
    input: updateProductVariantStockLevel,
    db = inventoryPrisma,
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
      await this.getProductVariantFromInventory(ProductInventoryPK, db);
    if (!productStock)
      throw new AppError(
        "There Is No Product Variant With That Id in The Inventory",
        400,
      );
    if (input.stockLevel < 0) {
      if (productStock.stockLevel + input.stockLevel < 0)
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
    db: PrismaClient = inventoryPrisma,
  ): Promise<addProductVariantInInventoryInput[]> => {
    const success: addProductVariantInInventoryInput[] = [];

    for (const productStock of input) {
      const inv: Inventory | null = await this.findInventoryByID(
        productStock.inventoryId,
        db,
      );
      if (!inv) {
        throw new AppError("There is No Inventory With That Id", 400);
      }

      const newProductStock =
        await this.inventoryRepo.addProductVariantInInventoryInput(
          productStock,
          db,
        );

      success.push(newProductStock);
    }

    return success;
  };

  getAllInventories = async (
    db = inventoryPrisma,
    filters?: findInventoryByNameAndLocationInput,
  ): Promise<Inventory[]> => {
    const inventories: Inventory[] = await this.inventoryRepo.getAllInventories(
      db,
      filters,
    );
    return inventories;
  };
  getProductVariantStock = async (
    variantId: string,
    db = inventoryPrisma,
  ): Promise<getProductVariantStockFromInventoryResponse[]> => {
    const stocks = await this.inventoryRepo.getProductVariant(variantId, db);
    return stocks;
  };

  getTotalProductVariantStockLevel = async (
    variantId: string,
    db = inventoryPrisma,
  ): Promise<number> => {
    const totalStock =
      await this.inventoryRepo.getTotalProductVariantStockLevel(variantId, db);
    return totalStock;
  };

  getTotalProductVariantStockLevelWithLock = async (
    variantId: string,
    db = inventoryPrisma,
  ): Promise<number> => {
    const totalStock =
      await this.inventoryRepo.getTotalProductVariantStockLevelWithLock(
        variantId,
        db,
      );
    return totalStock;
  };

  getProductVariantStocksForDecrement = async (
    variantId: string,
    db = inventoryPrisma,
  ): Promise<addProductVariantInInventoryInput[]> => {
    const stocks = await this.inventoryRepo.getProductVariantStocksForDecrement(
      variantId,
      db,
    );
    return stocks;
  };

  decrementStockForOrderItems = async (
    items: Array<{ productVariantId: string; quantity: number }>,
    db: PrismaClient = inventoryPrisma,
  ): Promise<void> => {
    for (const item of items) {
      // Get all inventory records for this variant, ordered by inventory ID
      const allInventoryStocks = await this.getProductVariantStocksForDecrement(
        item.productVariantId,
        db,
      );
      const availableStock = allInventoryStocks.reduce(
        (total, inventory) => total + inventory.stockLevel,
        0,
      );

      if (item.quantity > availableStock) {
        throw new AppError(
          `Insufficient stock for product variant ${item.productVariantId}. Available: ${availableStock}, Requested: ${item.quantity}`,
          400,
        );
      }

      let remainingQuantity = item.quantity;

      // Loop through each inventory location and decrement
      for (const inventory of allInventoryStocks) {
        if (remainingQuantity <= 0) break; // All quantity decremented

        if (inventory.stockLevel >= remainingQuantity) {
          // This inventory has enough stock
          await this.updateStockLevel(
            {
              productVariantId: item.productVariantId,
              inventoryId: inventory.inventoryId,
              stockLevel: -remainingQuantity,
            },
            db,
          );
          remainingQuantity = 0;
        } else {
          // This inventory doesn't have enough, decrement what's available and set to 0
          const toDecrement = -inventory.stockLevel; // Negative of current stock level to set to 0
          await this.updateStockLevel(
            {
              productVariantId: item.productVariantId,
              inventoryId: inventory.inventoryId,
              stockLevel: toDecrement,
            },
            db,
          );
          remainingQuantity -= inventory.stockLevel;
        }
      }
    }
  };

  incrementStockForOrderItems = async (
    items: Array<{ productVariantId: string; quantity: number }>,
    db: PrismaClient = inventoryPrisma,
  ): Promise<void> => {
    for (const item of items) {
      const allInventoryStocks = await this.getProductVariantStocksForDecrement(
        item.productVariantId,
        db,
      );

      if (allInventoryStocks.length === 0) {
        throw new AppError(
          `No inventory location found for product variant ${item.productVariantId}`,
          400,
        );
      }

      await this.updateStockLevel(
        {
          productVariantId: item.productVariantId,
          inventoryId: allInventoryStocks[0].inventoryId,
          stockLevel: item.quantity,
        },
        db,
      );
    }
  };
}
