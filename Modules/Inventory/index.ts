import { Router } from "express";
import { InventoryRepoFactory } from "./Components/RepoFactory.js";
import { InventoryService } from "./service/inventoryService.js";
import { InventoryController } from "./controller/inventoryController.js";
import { InventoryApiImp } from "./Api/InvApiImp.js";
import { authenticate } from "../Auth/middleware/authMiddleWare.js";
import { authorize } from "../Auth/middleware/authorizationMiddleWare.js";
const repo = InventoryRepoFactory.getInventoryRepo("prisma");
const inventoryService = new InventoryService(repo);
const InventoryApi = new InventoryApiImp(inventoryService);
const inventoryController = new InventoryController(inventoryService);
const router = Router();

router.get("/", authenticate,authorize(["ADMIN"]),inventoryController.getAllInventories);
router.get("/:id", authenticate,authorize(["ADMIN"]),inventoryController.findInventoryById);
router.delete("/:id", authenticate,authorize(["ADMIN"]), inventoryController.deactivateInventory);
router.post("/", authenticate,authorize(["ADMIN"]),inventoryController.addInventory);
router.patch("/:id", authenticate,authorize(["ADMIN"]),inventoryController.updateInventory);
router.patch("/stock/:id", authenticate,authorize(["ADMIN","SUPPLIER"]),inventoryController.updateStockLevel);

export { router as inventoryRouter };
export { InventoryApi };
