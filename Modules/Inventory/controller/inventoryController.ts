import { NextFunction, Request, Response } from "express";
import { InventoryService } from "../service/inventoryService.js";
import {
  AddInventoryInput,
  findByIdParams,
  findInventoryByNameAndLocationInput,
  findInventoryByNameAndLocationResponse,
  Inventory,
  updateProductVariantStockLevel,
} from "../types/types.js";
import { AppError } from "../../../src/utils/AppError.js";
import { prisma } from "../../../src/shared/prisma.js";

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
  findInventoryByNameAndLocation = async (
    req: Request<{}, {}, {}, findInventoryByNameAndLocationInput>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const name: string = req.query.name;
      const location: string = req.query.location;
      if (!name || !location)
        throw new AppError(
          "Please Enter The Name and Location Of The Inventory",
          400,
        );
      console.log(`Name ${name} and Location ${location}`);
      const inv: findInventoryByNameAndLocationResponse | null =
        await this.inventoryService.findInventoryByNameAndLocation({
          name,
          location,
        });
      if (!inv) throw new AppError("Inventory Not Found ", 404);
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
  deactivateInventory = async (
    req: Request<findByIdParams>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const id: string = req.params.id;
      const deletedInv: Inventory =
        await this.inventoryService.deactivateInventory(id);
      return res.status(200).send({
        status: "Success",
        message: "Inventory Is Deleted Successfully ",
      });
    } catch (err) {
      next(err);
    }
  };
  updateInventory = async (
    req: Request<findByIdParams>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const id: string = req.params.id;
      const data = req.body;
      const updatedInventory: Inventory =
        await this.inventoryService.updateInventory(id, data);
      return res.status(200).send({
        status: "Success",
        data: updatedInventory,
      });
    } catch (err) {
      next(err);
    }
  };
  updateStockLevel = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { productVariantId, inventoryId, stockLevel } = req.body;
      if (!productVariantId && !inventoryId && !stockLevel)
        throw new AppError(
          "Inventory ID Or ProductVariant ID Or StockLevel Is Not Added",
          400,
        );
      const updatedStock: updateProductVariantStockLevel =
        await this.inventoryService.updateStockLevel({
          productVariantId,
          inventoryId,
          stockLevel,
        });
      return res.status(200).send({
        status: "Success",
        data: updatedStock,
      });
    } catch (err) {
      next(err);
    }
  };

  getAllInventories = async (
    req: Request<{}, {}, {}, findInventoryByNameAndLocationInput>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const filters: findInventoryByNameAndLocationInput = {
        name: req.query.name,
        location: req.query.location,
      };
      if (filters.name || filters.location) {
        if (
          (filters.name && !filters.location) ||
          (filters.location && !filters.name)
        )
          throw new AppError(
            "You Must Enter Location and The Name of The Inventory",
            400,
          );
      }
      const inventories: Inventory[] =
        await this.inventoryService.getAllInventories(prisma, filters);
      return res.status(200).send({
        status: "Success",
        data: inventories,
      });
    } catch (err) {
      next(err);
    }
  };
}
