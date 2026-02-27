import { Router } from "express";
import { ProductPostgreSqlRepo } from "./repo/ProductRepo.js";
import { ProductService } from "./service/productService.js";
import { ProductController } from "./controller/ProductController.js";
import { InventoryApiImp } from "../../../Modules/Inventory/Api/InvApiImp.js";
import { InventoryRepoFactory } from "../../../Modules/Inventory/Components/RepoFactory.js";
import { InventoryService } from "../../../Modules/Inventory/service/inventoryService.js";
import { authenticate } from "../../Auth/middleware/authMiddleWare.js";
import { authorize } from "../../Auth/middleware/authorizationMiddleWare.js";

// Initialize Product Repository
const productRepo = new ProductPostgreSqlRepo();

// Initialize Inventory Service and API
const inventoryRepo = InventoryRepoFactory.getInventoryRepo("prisma");
const inventoryService = new InventoryService(inventoryRepo);
const inventoryApi = new InventoryApiImp(inventoryService);

// Initialize Product Service with dependencies
const productService = new ProductService(productRepo, inventoryApi);

// Initialize Product Controller
const productController = new ProductController(productService);

// Create Router
const router = Router();

// Routes
router.get(
  "/",
  authenticate,
  authorize(["ADMIN", "USER"]),
  productController.getAllProducts,
);

router.post(
  "/",
  authenticate,
  authorize(["ADMIN","SUPPLIER"]),
  productController.addProduct,
);

router.patch(
  "/:id",
  authenticate,
  authorize(["ADMIN","SUPPLIER"]),
  productController.updateProduct,
);

router.delete(
  "/:id",
  authenticate,
  authorize(["ADMIN","SUPPLIER"]),
  productController.deleteProduct,
);

export { router as productRouter };
export { inventoryApi as ProductInventoryApi };
