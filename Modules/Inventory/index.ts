import { Router } from "express";
import { InventoryRepoFactory } from "./Components/RepoFactory.js";
import { InventoryService } from "./service/inventoryService.js";
import { InventoryController } from "./controller/inventoryController.js";
import { InventoryApiImp } from "./Api/InvApiImp.js";
const repo = InventoryRepoFactory.getInventoryRepo("prisma");
const inventoryService = new InventoryService(repo);
const InventoryApi = new InventoryApiImp(inventoryService);
const inventoryController = new InventoryController(inventoryService);
const router = Router();

router.get("/", inventoryController.getAllInventories);
router.get("/:id", inventoryController.findInventoryById);
router.delete("/:id", inventoryController.deactivateInventory);
router.post("/", inventoryController.addInventory);
router.patch("/:id", inventoryController.updateInventory);
router.patch("/stock/:id", inventoryController.updateStockLevel);

export { router as inventoryRouter };
export { InventoryApi };
