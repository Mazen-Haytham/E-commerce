import { Router } from "express";
import { PrismaProductRepo } from "./repo/CatalogRepo.js";
import { CategoryService } from "./service/categoryService.js";
import { CategoryController } from "./controller/CategoryController.js";
import { authenticate } from "../../Auth/middleware/authMiddleWare.js";
import { authorize } from "../../Auth/middleware/authorizationMiddleWare.js";

// Initialize Category Repository
const categoryRepo = new PrismaProductRepo();

// Initialize Category Service with dependencies
const categoryService = new CategoryService(categoryRepo);

// Initialize Category Controller
const categoryController = new CategoryController(categoryService);

// Create Router
const router = Router();

// Routes
router.get(
  "/",
  authenticate,
  authorize(["ADMIN", "CUSTOMER"]),
  categoryController.getAllCategories,
);

router.get(
  "/:id",
  authenticate,
  authorize(["ADMIN", "CUSTOMER"]),
  categoryController.getCategoryById,
);

router.post(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  categoryController.addCategories,
);

router.patch(
  "/:id",
  authenticate,
  authorize(["ADMIN"]),
  categoryController.updateCategory,
);

router.delete(
  "/:id",
  authenticate,
  authorize(["ADMIN"]),
  categoryController.deleteCategory,
);

export { router as categoryRouter };
