import { Inventory } from "../../../src/generated/prisma";
import { AppError } from "../../../src/utils/AppError";
import { Repo } from "../repo/repo";
import {
  AddInventoryInput,
  AddInventoryResponse,
  findInventoryByIdResponse,
  findInventoryByNameAndLocationInput,
  findInventoryByNameAndLocationResponse,
} from "../types/types";

export class InventoryService {
  constructor(private readonly inventoryRepo: Repo) {}
  findInventoryByID = async (
    id: string,
  ): Promise<findInventoryByIdResponse | null> => {
    const inv: findInventoryByIdResponse | null =
      await this.inventoryRepo.findInventoryById(id);
    return inv;
  };
  findInventoryByNameAndLocation = async (
    input: findInventoryByNameAndLocationInput,
  ): Promise<findInventoryByNameAndLocationResponse | null> => {
    const inv: findInventoryByNameAndLocationResponse | null =
      await this.inventoryRepo.findInventoryByNameAndLocation(input);
    return inv;
  };
  addInventory = async (
    input: AddInventoryInput,
  ): Promise<AddInventoryResponse> => {
    const inv: findInventoryByNameAndLocationResponse | null =
      await this.findInventoryByNameAndLocation(input);
    if (inv) throw new AppError("Inventory Already Exists", 409);
    const newInv:AddInventoryResponse=await this.inventoryRepo.addInventory(input);
    return newInv;
  };
}
