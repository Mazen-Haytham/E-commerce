import { Request, Response, NextFunction } from "express";
import { CategoryService } from "../service/categoryService.js";
import {
  CategoryResponse,
  addCategoryInput,
  addCategoryResponse,
  updateCategory,
} from "../types/ProductTypes.js";

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Get all categories
   * GET /categories
   */
  getAllCategories = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const categories: CategoryResponse[] =
        await this.categoryService.findAllCategories();

      res.status(200).json({
        status: "Success",
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get category by ID
   * GET /categories/:id
   */
  getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categoryId = req.params.id as string;

      if (!categoryId) {
        return res.status(400).json({
          status: "Error",
          data: { message: "Category ID is required" },
        });
      }

      const category: CategoryResponse =
        await this.categoryService.findCategoryById(categoryId);

      res.status(200).json({
        status: "Success",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add one or more categories
   * POST /categories
   */
  addCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input: addCategoryInput = req.body;
      console.log(input);

      // Validate input
      if (!Array.isArray(input) || input.length === 0) {
        return res.status(400).json({
          status: "Error",
          data: {
            message: "Input must be an array with at least one category",
          },
        });
      }

      // Validate each category has a name
      for (const category of input) {
        if (!category.name || category.name.trim() === "") {
          return res.status(400).json({
            status: "Error",
            data: { message: "Each category must have a name" },
          });
        }
      }

      const result: addCategoryResponse =
        await this.categoryService.addCategories(input);

      res.status(201).json({
        status: "Success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a category
   * PATCH /categories/:id
   */
  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categoryId = req.params.id as string;
      const updateData = req.body;

      if (!categoryId) {
        return res.status(400).json({
          status: "Error",
          data: { message: "Category ID is required" },
        });
      }

      const input: updateCategory = {
        id: categoryId,
        newName: updateData.name || updateData.newName,
      };

      const updatedCategory: CategoryResponse =
        await this.categoryService.updateCategory(input);

      res.status(200).json({
        status: "Success",
        data: updatedCategory,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a category
   * DELETE /categories/:id
   */
  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categoryId = req.params.id as string;

      if (!categoryId) {
        return res.status(400).json({
          status: "Error",
          data: { message: "Category ID is required" },
        });
      }

      const result: CategoryResponse =
        await this.categoryService.deleteCategory(categoryId);

      res.status(200).json({
        status: "Success",
        data: result,
        message: "Category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
