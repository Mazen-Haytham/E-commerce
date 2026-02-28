import { Router } from "express";
import { OrderPostgreSqlRepo } from "./Repo/OrderPostgreRepo.js";
import { OrderService } from "./Service/OrderService.js";
import { OrderController } from "./controller/orderController.js";
import { UserImp } from "../User/src/Api/userImplementation.js";
import { ProductApiImp } from "../Catalog/Product/API/productApiImp.js";
import { CategoryApiImp } from "../Catalog/Category/API/categoryApiImp.js";
import { UserService } from "../User/src/service/userService.js";
import { PrismaUserRepo } from "../User/src/repo/userRepo.js";
import { ProductService } from "../Catalog/Product/service/productService.js";
import { ProductPostgreSqlRepo } from "../Catalog/Product/repo/ProductRepo.js";
import { CategoryService } from "../Catalog/Category/service/categoryService.js";
import { PrismaProductRepo as CatalogPrismaProductRepo } from "../Catalog/Category/repo/CatalogRepo.js";
import { InventoryApiImp } from "../Inventory/Api/InvApiImp.js";
import { InventoryService } from "../Inventory/service/inventoryService.js";
import { PrismaInventory } from "../Inventory/repo/inventoryRepo.js";
import { authenticate } from "../Auth/middleware/authMiddleWare.js";
import { authorize } from "../Auth/middleware/authorizationMiddleWare.js";

// Initialize repositories
const orderRepo = new OrderPostgreSqlRepo();

// User dependencies
const userRepository = new PrismaUserRepo();
const userService = new UserService(userRepository);
const userApi = new UserImp(userService);

// Inventory dependencies (for ProductService)
const inventoryRepository = new PrismaInventory();
const inventoryService = new InventoryService(inventoryRepository);
const inventoryApi = new InventoryApiImp(inventoryService);

// Product dependencies
const productRepository = new ProductPostgreSqlRepo();
const productService = new ProductService(productRepository, inventoryApi);
const productApi = new ProductApiImp(productService);

// Category dependencies
const categoryRepository = new CatalogPrismaProductRepo();
const categoryService = new CategoryService(categoryRepository);
const categoryApi = new CategoryApiImp(categoryService);

// Initialize OrderService with all dependencies
const orderService = new OrderService(
  orderRepo,
  userApi,
  productApi,
  categoryApi,
);

// Initialize OrderController
const orderController = new OrderController(orderService);

// Setup routes
const router = Router();

// Public/specific routes - MUST BE FIRST to prevent them being matched by generic patterns
router.get(
  "/pricing/product/:productId",
  orderController.getPricingByProductId,
);
router.get(
  "/pricing/variant/:variantId",
  orderController.getPricingByProductVariantId,
);
router.get(
  "/pricing/category/:categoryId",
  orderController.getPricingByCategoryId,
);

// Admin only - collection routes
router.get(
  "/",
  authenticate,
  authorize(["admin"]),
  orderController.getAllOrders,
);

// Admin only - discount creation routes
router.post(
  "/discount/variant",
  authenticate,
  authorize(["admin"]),
  orderController.createVariantDiscount,
);
router.post(
  "/discount/category",
  authenticate,
  authorize(["admin"]),
  orderController.createCategoryDiscount,
);

// Authenticated user - specific routes (before generic :orderId)
router.get("/user/:userId", authenticate, orderController.getOrdersByUserId);
router.post("/", authenticate, orderController.createOrder);

// Authenticated user - generic routes with :orderId
router.get("/:orderId", authenticate, orderController.getOrderById);
router.patch(
  "/:orderId/status",
  authenticate,
  authorize(["admin"]),
  orderController.updateOrderStatus,
);
router.delete(
  "/:orderId",
  authenticate,
  authorize(["admin"]),
  orderController.deleteOrder,
);
router.post("/:orderId/payments", authenticate, orderController.createPayment);
router.get(
  "/:orderId/payments",
  authenticate,
  orderController.getPaymentsByOrderId,
);
router.get(
  "/:orderId/discount",
  authenticate,
  orderController.calculateOrderDiscount,
);

export { router as OrderRouter };
