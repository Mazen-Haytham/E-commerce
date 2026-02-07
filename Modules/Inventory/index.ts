import {Router} from "express"
import { InventoryRepoFactory } from "./Components/RepoFactory.js";
import { InventoryService } from "./service/inventoryService.js";
import {InventoryController} from "./controller/inventoryController.js"
const repo=InventoryRepoFactory.getInventoryRepo("prisma");
const inventoryService=new InventoryService(repo);
const inventoryController=new InventoryController(inventoryService);
const router=Router();

router.get("/:id",inventoryController.findInventoryById);
router.post("/",inventoryController.addInventory);

export {router as inventoryRouter};