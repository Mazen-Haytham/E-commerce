import { PrismaClient } from "@prisma/client/extension";
import {
  AddInventoryInput,
  AddInventoryResponse,
  addProductVariantInInventoryInput,
  findInventoryByIdResponse,
  findInventoryByNameAndLocationInput,
  findInventoryByNameAndLocationResponse,
  getProductVariantStockFromInventoryInput,
  getProductVariantStockFromInventoryResponse,
  Inventory,
  updateInventoryInput,
  updateProductVariantStockLevel,
} from "../types/types";
export interface Repo {
  findInventoryById(id: string, db: PrismaClient): Promise<Inventory | null>;
  findInventoryByNameAndLocation(
    input: findInventoryByNameAndLocationInput
    ,db:PrismaClient
  ): Promise<findInventoryByNameAndLocationResponse | null>;
  updateInventory(
    inventoryId: string,
    input: updateInventoryInput
    ,db:PrismaClient
  ): Promise<Inventory>;
  updateProductStockLevel(
    input: updateProductVariantStockLevel,
    db:PrismaClient
  ): Promise<updateProductVariantStockLevel>;
  deactivateInventory(inventoryId: string,db:PrismaClient): Promise<Inventory>;
  addInventory(input: AddInventoryInput,db:PrismaClient): Promise<AddInventoryResponse>;
  addProductVariantInInventoryInput(
    input: addProductVariantInInventoryInput,
    db:PrismaClient
  ): Promise<addProductVariantInInventoryInput>;
  getProductVariantFromInventory(
    input: getProductVariantStockFromInventoryInput,
    db:PrismaClient
  ): Promise<getProductVariantStockFromInventoryResponse | null>;
}
