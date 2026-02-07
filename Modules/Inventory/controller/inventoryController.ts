import { NextFunction, Request, Response } from "express";
import { InventoryService } from "../service/inventoryService";
import { AddInventoryInput, findByIdParams, Inventory } from "../types/types";
import { AppError } from "../../../src/utils/AppError";

export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}
  findInventoryById = async (
    req: Request<findByIdParams>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const id: string = req.params.id;
      const inv: Inventory | null =
        await this.inventoryService.findInventoryByID(id);
      if (!inv) throw new AppError("Inventory Is Not Found", 404);
      return res.status(200).send({
        status: "Success",
        data: inv,
      });
    } catch (err) {
      next(err);
    }
  };
  addInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input: AddInventoryInput = req.body;
      const newInv = await this.inventoryService.addInventory(input);
      return res.status(201).send({
        status: "success",
        data: newInv,
      });
    } catch (err) {
      next(err);
    }
  };
}
