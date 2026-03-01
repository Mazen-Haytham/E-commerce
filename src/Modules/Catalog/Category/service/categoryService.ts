import { Repo } from "../repo/Repo.js";
import { prisma } from "../../../../shared/prisma.js";
import {
  addCategoryInput,
  addCategoryResponse,
  CategoryResponse,
  updateCategory,
} from "../types/ProductTypes.js";
import { AppError } from "../../../../utils/AppError.js";

export class CategoryService {
  constructor(private repo: Repo) {}

  findCategoryById = async (categoryId: string): Promise<CategoryResponse> => {
    if (!categoryId || categoryId.trim() === "") {
      throw new AppError("Category ID is required", 400);
    }

    const category = await this.repo.findCategoryById(categoryId, prisma);

    if (!category) {
      throw new AppError(`Category with ID ${categoryId} not found`, 404);
    }

    return category;
  };

  findAllCategories = async (): Promise<CategoryResponse[]> => {
    const categories = await this.repo.findAllCategories(prisma);

    if (!categories || categories.length === 0) {
      throw new AppError("No categories found", 404);
    }

    return categories;
  };

  addCategories = async (
    input: addCategoryInput,
  ): Promise<addCategoryResponse> => {
    // Validation: Ensure at least one category is provided
    if (!Array.isArray(input) || input.length === 0) {
      throw new AppError("At least one category must be provided", 400);
    }

    // Validation: Check for duplicate category names in input
    const categoryNames = input.map((cat) => cat.name.toLowerCase());
    const uniqueNames = new Set(categoryNames);

    if (uniqueNames.size !== categoryNames.length) {
      throw new AppError("Duplicate category names provided", 400);
    }

    // Validation: Check if any category names already exist in database
    const existingCategories = await this.repo.checkCategoryNamesExist(
      input.map((cat) => cat.name),
      prisma,
    );

    if (existingCategories.length > 0) {
      const duplicateNames = existingCategories
        .map((cat) => `"${cat.name}"`)
        .join(", ");
      throw new AppError(
        `Category names already exist: ${duplicateNames}`,
        409,
      );
    }

    return await this.repo.addCategory(input, prisma);
  };

  updateCategory = async (input: updateCategory): Promise<CategoryResponse> => {
    // Validation: Ensure category ID is provided
    if (!input.id || input.id.trim() === "") {
      throw new AppError("Category ID is required", 400);
    }

    // Validation: Check if category exists
    const existingCategory = await this.findCategoryById(input.id);

    if (!existingCategory) {
      throw new AppError("Category not found", 404);
    }

    // Validation: If name is being updated, check for duplicates
    if (input.newName) {
      const duplicateCategory = await this.repo.checkCategoryNameExists(
        input.newName,
        input.id,
        prisma,
      );

      if (duplicateCategory) {
        throw new AppError(
          `Category with name "${input.newName}" already exists`,
          409,
        );
      }
    }

    return await this.repo.updateCategory(input, prisma);
  };

  deleteCategory = async (categoryId: string): Promise<CategoryResponse> => {
    // Validation: Ensure category ID is provided
    if (!categoryId || categoryId.trim() === "") {
      throw new AppError("Category ID is required", 400);
    }

    // Validation: Check if category exists
    const existingCategory = await this.findCategoryById(categoryId);

    if (!existingCategory) {
      throw new AppError("Category not found", 404);
    }

    return await this.repo.deleteCategory(categoryId, prisma);
  };
}
